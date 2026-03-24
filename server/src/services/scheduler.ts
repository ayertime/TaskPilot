import cron from 'node-cron';
import { supabaseAdmin } from './supabase';
import { runAgent } from './ai-agent';
import { readEmails } from './gmail-service';
import { readCalendarEvents } from './gcalendar-service';

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

    // 1. Find explicitly scheduled automatable tasks
    const { data: scheduledTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, title, description, action_type, action_metadata, auto_execute_at, due_date, recurrence_pattern')
      .eq('is_automatable', true)
      .neq('status', 'done')
      .lte('auto_execute_at', now)
      .order('auto_execute_at', { ascending: true })
      .limit(5);

    // 2. Find overdue tasks past their due date — agent steps in as a safety net
    const { data: overdueTasks } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, title, description, action_type, action_metadata, auto_execute_at, due_date, recurrence_pattern')
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .lte('due_date', now)
      .is('auto_execute_at', null)
      .order('due_date', { ascending: true })
      .limit(5);

    // Merge and deduplicate
    const seen = new Set<string>();
    const tasks: typeof scheduledTasks = [];
    for (const t of [...(scheduledTasks || []), ...(overdueTasks || [])]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        tasks.push(t);
      }
    }

    if (tasks.length === 0) {
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
  description: string | null;
  action_type: string | null;
  action_metadata: Record<string, unknown> | null;
  auto_execute_at: string | null;
  due_date: string | null;
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
      prompt = `This task is overdue and the user hasn't completed it: "${title}"${task.description ? `. Details: ${task.description}` : ''}. Analyze the task title and description. If it involves sending an email, use send_email. If it involves scheduling, use create_calendar_event. If it involves research, use web_search. If it involves writing, use generate_document. Use your best judgment to complete it, then mark it as done with complete_task using id "${task.id}".`;
  }

  // Mark overdue tasks as automatable so they aren't re-queried next cycle
  if (!task.auto_execute_at) {
    await supabaseAdmin
      .from('tasks')
      .update({ is_automatable: true, auto_execute_at: new Date().toISOString() })
      .eq('id', task.id);
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

  // Run the agent to execute the task (don't save to chat history)
  await runAgent({
    userId: user_id,
    userClient,
    userMessage: prompt,
    onEvent: () => {},
    saveToHistory: false,
  });

  // Log the auto-execution
  const wasOverdue = !task.auto_execute_at && task.due_date;
  await supabaseAdmin.from('agent_activity').insert({
    user_id,
    task_id: task.id,
    action_type: 'auto_execute',
    description: wasOverdue
      ? `Safety net: auto-completed overdue task "${title}" (${action_type || 'general'})`
      : `Auto-executed: "${title}" (${action_type || 'general'})`,
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
 * Sync Gmail and Calendar for users who have enabled Smart Sync.
 * Respects each user's sync_interval setting.
 */
let isSyncing = false;
const lastSyncTimes = new Map<string, number>();

const INTERVAL_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '5h': 5 * 60 * 60 * 1000,
  '12h': 12 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

async function syncInboxAndCalendar() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // Find users with sync enabled and a connected Google account
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, provider, provider_token, sync_enabled, sync_interval')
      .eq('provider', 'google')
      .eq('sync_enabled', true)
      .not('provider_token', 'is', null);

    if (!profiles || profiles.length === 0) return;

    const now = Date.now();

    for (const profile of profiles) {
      // Check if enough time has passed since last sync for this user
      const interval = INTERVAL_MS[profile.sync_interval || '5h'] || INTERVAL_MS['5h'];
      const lastSync = lastSyncTimes.get(profile.id) || 0;
      if (now - lastSync < interval) continue;

      try {
        await syncUserEmails(profile.id);
        await syncUserCalendar(profile.id);
        lastSyncTimes.set(profile.id, now);
        console.log(`[Sync] Synced user ${profile.id} (interval: ${profile.sync_interval || '5h'})`);
      } catch (err) {
        console.error(`[Sync] Error syncing user ${profile.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[Sync] Error in syncInboxAndCalendar:', err);
  } finally {
    isSyncing = false;
  }
}

async function syncUserEmails(userId: string) {
  // Only fetch recent unread emails
  const result = await readEmails(userId, {
    unreadOnly: true,
    maxResults: 10,
  });

  if (!result.success || !result.emails || result.emails.length === 0) return;

  // Check which emails we've already created tasks for
  const { data: existingTasks } = await supabaseAdmin
    .from('tasks')
    .select('action_metadata')
    .eq('user_id', userId)
    .eq('action_type', 'email')
    .eq('ai_generated', true);

  const existingEmailIds = new Set(
    (existingTasks || [])
      .map((t) => (t.action_metadata as Record<string, unknown>)?.gmail_id)
      .filter(Boolean),
  );

  // Filter to new emails only
  const newEmails = result.emails.filter((e) => !existingEmailIds.has(e.id));
  if (newEmails.length === 0) return;

  // Use the agent to decide which emails need action and create tasks
  const { createClient } = await import('@supabase/supabase-js');
  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    },
  );

  const emailSummaries = newEmails.map((e) =>
    `- From: ${e.from} | Subject: "${e.subject}" | Snippet: "${e.snippet}" | Gmail ID: ${e.id}`
  ).join('\n');

  const prompt = `You are reviewing the user's unread emails to find ones that need action. Here are the new unread emails:\n\n${emailSummaries}\n\nFor each email that clearly requires the user to take action (reply, follow up, complete a request, attend something, etc.), create a task using create_task with:\n- A clear title describing what needs to be done (e.g. "Reply to John about project deadline")\n- Priority based on urgency (urgent if time-sensitive, high if important, medium otherwise)\n- action_type: "email"\n- action_metadata: include the gmail_id, from, and subject fields\n- category_id if it fits an existing category\n\nAfter creating each task that requires a reply, use update_task to save a smart reply draft in the ai_result field. The draft should be a professional, helpful reply the user can review and send. Keep it concise and match the tone of the original email.\n\nDo NOT create tasks for newsletters, marketing emails, automated notifications, or informational emails that don't require action. Only create tasks for emails that genuinely need a human response or action. If none of the emails need action, simply say so.`;

  await runAgent({
    userId,
    userClient,
    userMessage: prompt,
    onEvent: () => {},
    saveToHistory: false,
  });
}

async function syncUserCalendar(userId: string) {
  // Fetch events for the next 24 hours
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const result = await readCalendarEvents(userId, {
    timeMin: now.toISOString(),
    timeMax: tomorrow.toISOString(),
    maxResults: 15,
  });

  if (!result.success || !result.events || result.events.length === 0) return;

  // Check which calendar events we've already created tasks for
  const { data: existingTasks } = await supabaseAdmin
    .from('tasks')
    .select('action_metadata')
    .eq('user_id', userId)
    .eq('action_type', 'calendar_event')
    .eq('ai_generated', true);

  const existingEventIds = new Set(
    (existingTasks || [])
      .map((t) => (t.action_metadata as Record<string, unknown>)?.gcal_id)
      .filter(Boolean),
  );

  // Filter to new events only
  const newEvents = result.events.filter((e) => !existingEventIds.has(e.id));
  if (newEvents.length === 0) return;

  // Use the agent to create tasks from calendar events
  const { createClient } = await import('@supabase/supabase-js');
  const userClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    },
  );

  const eventSummaries = newEvents.map((e) =>
    `- "${e.title}" | Start: ${e.start} | End: ${e.end}${e.location ? ` | Location: ${e.location}` : ''}${e.attendees?.length ? ` | Attendees: ${e.attendees.join(', ')}` : ''} | GCal ID: ${e.id}`
  ).join('\n');

  const prompt = `You are reviewing the user's upcoming calendar events (next 24 hours) to create preparation tasks. Here are the events:\n\n${eventSummaries}\n\nFor each event that the user should prepare for, create a task using create_task with:\n- A clear title (e.g. "Prepare for meeting with Design Team" or "Team standup at 10am")\n- Set the due_date to the event's start time\n- Priority: high for meetings with attendees, medium for solo events\n- action_type: "calendar_event"\n- action_metadata: include the gcal_id, title, start, and end fields\n\nDo NOT create tasks for all-day events that are just reminders, or events that are clearly informational (like holidays). Focus on events the user needs to actively participate in or prepare for.`;

  await runAgent({
    userId,
    userClient,
    userMessage: prompt,
    onEvent: () => {},
    saveToHistory: false,
  });
}

/**
 * Generate morning briefings for users who have topics configured.
 * Runs once at 7am UTC — the agent personalizes based on the user's timezone.
 */
async function generateMorningBriefings() {
  try {
    const { data: users } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, briefing_topics, timezone')
      .not('briefing_topics', 'eq', '{}');

    if (!users || users.length === 0) return;

    for (const user of users) {
      const topics = user.briefing_topics as string[];
      if (!topics || topics.length === 0) continue;

      // Check if it's roughly morning (6am-9am) in the user's timezone
      const now = new Date();
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: user.timezone || 'UTC' }));
      const hour = userTime.getHours();
      if (hour < 6 || hour > 9) continue;

      const { createClient } = await import('@supabase/supabase-js');
      const userClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          },
        },
      );

      const topicNames = topics.join(', ');
      const prompt = `Good morning! Please generate my personalized morning briefing. Use the generate_morning_briefing tool — it will pull my pending tasks, today's calendar events, overnight agent activity, and my news topics. Then use web_search to get the latest news for each topic. Present everything in a clean, scannable format with my day at a glance first.`;

      try {
        await runAgent({
          userId: user.id,
          userClient,
          userMessage: prompt,
          onEvent: () => {},
          saveToHistory: true, // Save so user sees it in chat
        });
        console.log(`[Scheduler] Morning briefing sent for user ${user.id} (topics: ${topicNames})`);
      } catch (err) {
        console.error(`[Scheduler] Failed to generate briefing for user ${user.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in generateMorningBriefings:', err);
  }
}

/**
 * Start the scheduler. Call this from server startup.
 */
async function clearCompletedTasks() {
  try {
    const { error, count } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('status', 'done');

    if (error) {
      console.error('[Scheduler] Failed to clear completed tasks:', error);
      return;
    }
    if (count && count > 0) {
      console.log(`[Scheduler] Midnight cleanup: deleted ${count} completed tasks`);
    }
  } catch (err) {
    console.error('[Scheduler] Error in clearCompletedTasks:', err);
  }
}

export function startScheduler() {
  // Run every minute — process overdue tasks
  cron.schedule('* * * * *', () => {
    processOverdueTasks();
  });

  // Check for users needing sync every 30 minutes; per-user intervals control actual frequency
  cron.schedule('*/30 * * * *', () => {
    syncInboxAndCalendar();
  });

  // Morning briefings — run every hour, function checks if it's morning in each user's timezone
  cron.schedule('0 * * * *', () => {
    generateMorningBriefings();
  });

  // Midnight cleanup — delete all completed tasks
  cron.schedule('0 0 * * *', () => {
    clearCompletedTasks();
  });

  console.log('[Scheduler] Proactive agent scheduler started (tasks: every 1m, sync check: every 30m, briefings: hourly, cleanup: midnight)');
}
