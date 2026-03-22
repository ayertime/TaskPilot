import cron from 'node-cron';
import { supabaseAdmin } from './supabase';
import { runAgent } from './ai-agent';

/**
 * Proactive Agent Scheduler
 *
 * Runs every minute and:
 * 1. Auto-executes overdue automatable tasks (email, calendar, research, etc.)
 * 2. Creates next instances of recurring tasks when the current one is completed
 * 3. Fires reminders at their scheduled time
 */

let isRunning = false;

async function processOverdueTasks() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date().toISOString();

    // Find automatable tasks that are overdue for execution
    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, title, action_type, action_metadata, auto_execute_at, recurrence_pattern')
      .eq('is_automatable', true)
      .neq('status', 'done')
      .lte('auto_execute_at', now)
      .order('auto_execute_at', { ascending: true })
      .limit(5); // Process max 5 at a time to avoid overload

    if (error || !tasks || tasks.length === 0) {
      return;
    }

    for (const task of tasks) {
      try {
        await executeTask(task);
      } catch (err) {
        console.error(`[Scheduler] Failed to execute task ${task.id}:`, err);

        // Log the failure
        await supabaseAdmin.from('agent_activity').insert({
          user_id: task.user_id,
          task_id: task.id,
          action_type: 'auto_execute_failed',
          description: `Failed to auto-execute: "${task.title}"`,
          result: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in processOverdueTasks:', err);
  } finally {
    isRunning = false;
  }
}

async function executeTask(task: {
  id: string;
  user_id: string;
  title: string;
  action_type: string | null;
  action_metadata: Record<string, unknown> | null;
  auto_execute_at: string | null;
  recurrence_pattern: string | null;
}) {
  const { user_id, title, action_type } = task;

  // Build a prompt for the agent based on the task's action type
  let prompt: string;

  switch (action_type) {
    case 'email':
      prompt = buildEmailPrompt(task);
      break;
    case 'calendar_event':
      prompt = buildCalendarPrompt(task);
      break;
    case 'research':
      prompt = `Research and complete this task: "${title}". Use web_search to find relevant information, then save your findings to the task using update_task with the ai_result field. Finally, mark the task as complete.`;
      break;
    case 'document':
      prompt = `Generate a document for this task: "${title}". Create comprehensive content and save it to the task using update_task with the ai_result field. Then mark the task as complete.`;
      break;
    case 'reminder':
      prompt = `The reminder for task "${title}" is now due. Log this reminder in the activity. Mark the reminder as complete using complete_task with id "${task.id}".`;
      break;
    default:
      prompt = `Auto-execute this task: "${title}". Determine the best way to complete it, take action, and mark it as done.`;
  }

  // Create a minimal Supabase client for the user context
  const { createClient } = await import('@supabase/supabase-js');
  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          // Use service role for scheduler-initiated actions
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    },
  );

  // Run the agent to execute the task
  await runAgent({
    userId: user_id,
    userClient,
    userMessage: prompt,
    onEvent: () => {}, // No streaming needed for background execution
  });

  // Log the auto-execution
  await supabaseAdmin.from('agent_activity').insert({
    user_id,
    task_id: task.id,
    action_type: 'auto_execute',
    description: `Auto-executed: "${title}" (${action_type || 'general'})`,
    result: 'Task processed by scheduler',
  });

  // Handle recurring tasks — create the next instance
  if (task.recurrence_pattern) {
    await createNextRecurrence(task);
  }
}

function buildEmailPrompt(task: {
  title: string;
  id: string;
  action_metadata: Record<string, unknown> | null;
}): string {
  const meta = task.action_metadata || {};
  const to = meta.to as string || '';
  const subject = meta.subject as string || task.title;
  const body = meta.body as string || '';

  return `Send an email for the scheduled task "${task.title}". Send to: ${to}, Subject: "${subject}", Body: "${body}". After sending, mark the task as complete using complete_task with id "${task.id}".`;
}

function buildCalendarPrompt(task: {
  title: string;
  id: string;
  action_metadata: Record<string, unknown> | null;
}): string {
  const meta = task.action_metadata || {};
  const start = meta.start_time as string || '';
  const end = meta.end_time as string || '';
  const location = meta.location as string || '';

  return `Create a calendar event for the scheduled task "${task.title}". Start: ${start}, End: ${end}${location ? `, Location: ${location}` : ''}. After creating, mark the task as complete using complete_task with id "${task.id}".`;
}

async function createNextRecurrence(task: {
  id: string;
  user_id: string;
  title: string;
  action_type: string | null;
  action_metadata: Record<string, unknown> | null;
  auto_execute_at: string | null;
  recurrence_pattern: string | null;
}) {
  if (!task.recurrence_pattern || !task.auto_execute_at) return;

  const pattern = task.recurrence_pattern;
  const lastExecution = new Date(task.auto_execute_at);
  let nextDate: Date | null = null;

  if (pattern === 'daily') {
    nextDate = new Date(lastExecution);
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (pattern.startsWith('weekly')) {
    // e.g., "weekly" or "weekly:mon,wed,fri"
    nextDate = new Date(lastExecution);
    nextDate.setDate(nextDate.getDate() + 7);
    // For specific days like "weekly:mon,wed,fri", find the next matching day
    const daysPart = pattern.split(':')[1];
    if (daysPart) {
      const dayMap: Record<string, number> = {
        sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
      };
      const days = daysPart.split(',').map((d) => dayMap[d.trim().toLowerCase()]).filter((d) => d !== undefined);
      if (days.length > 0) {
        // Find the next day that matches
        const candidate = new Date(lastExecution);
        for (let i = 1; i <= 7; i++) {
          candidate.setDate(lastExecution.getDate() + i);
          if (days.includes(candidate.getDay())) {
            nextDate = candidate;
            break;
          }
        }
      }
    }
  } else if (pattern.startsWith('monthly')) {
    // e.g., "monthly" or "monthly:15"
    nextDate = new Date(lastExecution);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const dayPart = pattern.split(':')[1];
    if (dayPart) {
      nextDate.setDate(parseInt(dayPart, 10));
    }
  }

  if (!nextDate) return;

  // Get next position
  const { data: lastTask } = await supabaseAdmin
    .from('tasks')
    .select('position')
    .eq('user_id', task.user_id)
    .eq('status', 'todo')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  await supabaseAdmin.from('tasks').insert({
    user_id: task.user_id,
    title: task.title,
    status: 'todo',
    priority: 'medium',
    position: (lastTask?.position ?? -1) + 1,
    is_automatable: true,
    auto_execute_at: nextDate.toISOString(),
    action_type: task.action_type,
    action_metadata: task.action_metadata,
    recurrence_pattern: task.recurrence_pattern,
    ai_generated: true,
  });

  console.log(`[Scheduler] Created next recurring instance of "${task.title}" for ${nextDate.toISOString()}`);
}

/**
 * Start the scheduler. Call this from server startup.
 */
export function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', () => {
    processOverdueTasks();
  });

  console.log('[Scheduler] Proactive agent scheduler started (runs every minute)');
}
