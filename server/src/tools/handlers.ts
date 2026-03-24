import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../services/supabase';
import { webSearch } from '../services/search-service';
import { checkWeather } from '../services/weather-service';
import { sendEmail } from '../services/email-service';
import { createCalendarEvent } from '../services/calendar-service';
import { readEmails } from '../services/gmail-service';
import { readCalendarEvents } from '../services/gcalendar-service';
import { exportTasksCsv, exportTasksMarkdown } from '../services/export-service';

interface ToolContext {
  userId: string;
  userClient: SupabaseClient;
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  switch (toolName) {
    // ── Task Management ────────────────────────────────────────────
    case 'list_tasks':
      return handleListTasks(input, ctx);
    case 'create_task':
      return handleCreateTask(input, ctx);
    case 'update_task':
      return handleUpdateTask(input, ctx);
    case 'complete_task':
      return handleCompleteTask(input, ctx);
    case 'delete_task':
      return handleDeleteTask(input, ctx);
    case 'create_category':
      return handleCreateCategory(input, ctx);
    case 'break_down_task':
      return handleBreakDownTask(input, ctx);

    // ── Real-World Actions ─────────────────────────────────────────
    case 'read_emails':
      return handleReadEmails(input, ctx);
    case 'read_calendar':
      return handleReadCalendar(input, ctx);
    case 'send_email':
      return handleSendEmail(input, ctx);
    case 'create_calendar_event':
      return handleCreateCalendarEvent(input, ctx);
    case 'web_search':
      return handleWebSearch(input, ctx);
    case 'generate_document':
      return handleGenerateDocument(input, ctx);
    case 'summarize_url':
      return handleSummarizeUrl(input);
    case 'scan_emails_for_tasks':
      return handleScanEmailsForTasks(input, ctx);

    // ── Scheduling & Reminders ─────────────────────────────────────
    case 'set_reminder':
      return handleSetReminder(input, ctx);
    case 'create_recurring_task':
      return handleCreateRecurringTask(input, ctx);
    case 'schedule_optimizer':
      return handleScheduleOptimizer(input, ctx);

    // ── Productivity & Analytics ───────────────────────────────────
    case 'analyze_productivity':
      return handleAnalyzeProductivity(input, ctx);
    case 'suggest_tasks':
      return handleSuggestTasks(ctx);
    case 'get_daily_summary':
      return handleGetDailySummary(input, ctx);

    // ── Smart Planning ─────────────────────────────────────────────
    case 'focus_mode':
      return handleFocusMode(ctx);
    case 'estimate_time':
      return handleEstimateTime(input, ctx);
    case 'find_conflicts':
      return handleFindConflicts(input, ctx);

    // ── Utility ────────────────────────────────────────────────────
    case 'translate_text':
      return handleTranslateText(input);
    case 'check_weather':
      return handleCheckWeather(input);
    case 'export_tasks':
      return handleExportTasks(input, ctx);
    case 'generate_morning_briefing':
      return handleGenerateMorningBriefing(ctx);

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ── Task Management Handlers ─────────────────────────────────────────

async function handleListTasks(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  let query = ctx.userClient
    .from('tasks')
    .select('*, categories(name, color)')
    .eq('user_id', ctx.userId)
    .order('position', { ascending: true })
    .limit((input.limit as number) || 50);

  if (input.status) query = query.eq('status', input.status);
  if (input.priority) query = query.eq('priority', input.priority);
  if (input.category_id) query = query.eq('category_id', input.category_id);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ tasks: data, count: data?.length || 0 });
}

async function handleCreateTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  // Get next position
  const { data: lastTask } = await ctx.userClient
    .from('tasks')
    .select('position')
    .eq('user_id', ctx.userId)
    .eq('status', (input.status as string) || 'todo')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const position = (lastTask?.position ?? -1) + 1;

  const taskData: Record<string, unknown> = {
    user_id: ctx.userId,
    title: input.title,
    status: input.status || 'todo',
    priority: input.priority || 'medium',
    position,
  };

  if (input.description) taskData.description = input.description;
  if (input.category_id) taskData.category_id = input.category_id;
  if (input.due_date) taskData.due_date = input.due_date;
  if (input.is_automatable != null) taskData.is_automatable = input.is_automatable;
  if (input.auto_execute_at) taskData.auto_execute_at = input.auto_execute_at;
  if (input.action_type) taskData.action_type = input.action_type;
  if (input.action_metadata) taskData.action_metadata = input.action_metadata;
  taskData.ai_generated = true;

  const { data, error } = await ctx.userClient
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });

  // Log activity
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    task_id: data.id,
    action_type: 'create_task',
    description: `Created task: "${input.title}"`,
    result: `Priority: ${input.priority || 'medium'}, Status: ${input.status || 'todo'}`,
  });

  return JSON.stringify({ success: true, task: data });
}

async function handleUpdateTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const id = input.id as string;
  const updates: Record<string, unknown> = {};

  for (const key of [
    'title', 'description', 'priority', 'status', 'category_id',
    'due_date', 'is_automatable', 'auto_execute_at', 'action_type', 'action_metadata',
  ]) {
    if (input[key] !== undefined) updates[key] = input[key];
  }

  const { data, error } = await ctx.userClient
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, task: data });
}

async function handleCompleteTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { data, error } = await ctx.userClient
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
      completed_by: 'agent',
    })
    .eq('id', input.id)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });

  // Log completion
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    task_id: data.id,
    action_type: 'complete_task',
    description: `Completed task: "${data.title}"`,
    result: 'Marked as done by agent',
  });

  return JSON.stringify({ success: true, task: data });
}

async function handleDeleteTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { error } = await ctx.userClient
    .from('tasks')
    .delete()
    .eq('id', input.id)
    .eq('user_id', ctx.userId);

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, message: 'Task deleted' });
}

async function handleCreateCategory(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { data, error } = await ctx.userClient
    .from('categories')
    .insert({
      user_id: ctx.userId,
      name: input.name,
      color: input.color || '#6366f1',
    })
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ success: true, category: data });
}

async function handleBreakDownTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const parentId = input.id as string;
  const subtasks = input.subtasks as Array<{
    title: string;
    description?: string;
    priority?: string;
  }>;

  // Verify parent task exists
  const { data: parent, error: parentError } = await ctx.userClient
    .from('tasks')
    .select('id, title')
    .eq('id', parentId)
    .eq('user_id', ctx.userId)
    .single();

  if (parentError || !parent) {
    return JSON.stringify({ error: 'Parent task not found' });
  }

  const created = [];
  for (let i = 0; i < subtasks.length; i++) {
    const sub = subtasks[i];
    const { data, error } = await ctx.userClient
      .from('tasks')
      .insert({
        user_id: ctx.userId,
        parent_task_id: parentId,
        title: sub.title,
        description: sub.description || null,
        priority: sub.priority || 'medium',
        status: 'todo',
        position: i,
        ai_generated: true,
      })
      .select()
      .single();

    if (!error && data) created.push(data);
  }

  return JSON.stringify({
    success: true,
    parent_task: parent.title,
    subtasks_created: created.length,
    subtasks: created,
  });
}

// ── Real-World Actions Handlers ──────────────────────────────────────

async function handleReadEmails(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const result = await readEmails(ctx.userId, {
    query: input.query as string | undefined,
    maxResults: input.max_results as number | undefined,
    unreadOnly: input.unread_only as boolean | undefined,
  });

  if (result.success && result.emails && result.emails.length > 0) {
    await supabaseAdmin.from('agent_activity').insert({
      user_id: ctx.userId,
      action_type: 'read_emails',
      description: input.query
        ? `Searched emails: "${input.query}"`
        : `Read ${result.emails.length} recent email(s)`,
      result: result.message,
      metadata: {
        query: input.query || null,
        count: result.emails.length,
        emails: result.emails.slice(0, 5).map((e: any) => ({
          from: e.from,
          subject: e.subject,
          snippet: e.snippet,
          date: e.date,
        })),
      },
    });
  }

  return JSON.stringify(result);
}

async function handleReadCalendar(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const result = await readCalendarEvents(ctx.userId, {
    timeMin: input.time_min as string | undefined,
    timeMax: input.time_max as string | undefined,
    maxResults: input.max_results as number | undefined,
    query: input.query as string | undefined,
  });

  if (result.success && result.events && result.events.length > 0) {
    await supabaseAdmin.from('agent_activity').insert({
      user_id: ctx.userId,
      action_type: 'read_calendar',
      description: input.query
        ? `Searched calendar: "${input.query}"`
        : `Read ${result.events.length} upcoming event(s)`,
      result: result.message,
      metadata: {
        query: input.query || null,
        count: result.events.length,
        events: result.events.slice(0, 5).map((e: any) => ({
          title: e.title,
          start: e.start,
          end: e.end,
          location: e.location,
        })),
      },
    });
  }

  return JSON.stringify(result);
}

async function handleSendEmail(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  // Log progress: composing
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'agent_step',
    description: `Composing email to ${input.to}...`,
    metadata: { step: 'composing', to: input.to, subject: input.subject },
  });

  const result = await sendEmail(ctx.userId, {
    to: input.to as string,
    subject: input.subject as string,
    body: input.body as string,
    cc: input.cc as string | undefined,
    bcc: input.bcc as string | undefined,
  });

  // Log final activity with full metadata
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'send_email',
    description: `Sent email to ${input.to}: "${input.subject}"`,
    result: result.message,
    metadata: {
      to: input.to,
      cc: input.cc || null,
      bcc: input.bcc || null,
      subject: input.subject,
      body: input.body,
      success: result.success,
    },
  });

  return JSON.stringify(result);
}

async function handleCreateCalendarEvent(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  // Log progress: creating
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'agent_step',
    description: `Creating calendar event: "${input.title}"...`,
    metadata: { step: 'creating', title: input.title },
  });

  const result = await createCalendarEvent(ctx.userId, {
    title: input.title as string,
    start_time: input.start_time as string,
    end_time: input.end_time as string,
    description: input.description as string | undefined,
    location: input.location as string | undefined,
    attendees: input.attendees as string[] | undefined,
  });

  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'create_calendar_event',
    description: `Created calendar event: "${input.title}"`,
    result: result.message,
    metadata: {
      title: input.title,
      start_time: input.start_time,
      end_time: input.end_time,
      description: input.description || null,
      location: input.location || null,
      attendees: input.attendees || null,
      event_id: result.event_id || null,
      success: result.success,
    },
  });

  return JSON.stringify(result);
}

async function handleWebSearch(
  input: Record<string, unknown>,
  ctx?: ToolContext,
): Promise<string> {
  const results = await webSearch(
    input.query as string,
    (input.num_results as number) || 5,
  );

  if (ctx) {
    await supabaseAdmin.from('agent_activity').insert({
      user_id: ctx.userId,
      action_type: 'web_search',
      description: `Web search: "${input.query}"`,
      result: `Found ${(input.num_results as number) || 5} results`,
      metadata: {
        query: input.query,
        num_results: (input.num_results as number) || 5,
      },
    });
  }

  return JSON.stringify(results);
}

async function handleGenerateDocument(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  // The AI agent itself will generate the document content
  // This tool just marks the task with the prompt so the agent can fill ai_result
  const taskId = input.task_id as string;
  const prompt = input.prompt as string;
  const format = (input.format as string) || 'markdown';

  // Return instructions for the agent to generate the content
  // The agent will call update_task with the generated content in ai_result
  return JSON.stringify({
    success: true,
    message: `Ready to generate ${format} document for task ${taskId}. Generate the content based on this prompt: "${prompt}" — then use update_task to save the result in the task's ai_result field.`,
    task_id: taskId,
    prompt,
    format,
  });
}

async function handleSummarizeUrl(
  input: Record<string, unknown>,
): Promise<string> {
  const url = input.url as string;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TaskPilot/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return JSON.stringify({ error: `Failed to fetch URL: ${res.status}` });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return JSON.stringify({
        error: `Cannot summarize content type: ${contentType}`,
      });
    }

    const html = await res.text();
    // Strip HTML tags for a rough text extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    return JSON.stringify({
      url,
      content: text,
      message:
        'URL content fetched. Summarize the content above and present the key points to the user.',
    });
  } catch (err) {
    return JSON.stringify({
      error: `Failed to fetch URL: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }
}

async function handleScanEmailsForTasks(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const result = await readEmails(ctx.userId, {
    query: input.query as string | undefined,
    maxResults: input.max_results as number | undefined,
    unreadOnly: !input.query, // default to unread if no query specified
  });

  if (!result.success) {
    return JSON.stringify(result);
  }

  if (!result.emails || result.emails.length === 0) {
    return JSON.stringify({
      success: true,
      emails: [],
      message: 'No emails found to scan. The inbox is clear of actionable items.',
    });
  }

  // Log the scan activity
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'scan_emails',
    description: `Scanned ${result.emails.length} email(s) for action items`,
    result: `Found ${result.emails.length} emails to analyze`,
    metadata: {
      query: input.query || 'unread',
      count: result.emails.length,
    },
  });

  // Return emails with instructions for the agent to analyze and create tasks
  return JSON.stringify({
    success: true,
    emails: result.emails.map((e) => ({
      from: e.from,
      subject: e.subject,
      body: e.body,
      date: e.date,
      snippet: e.snippet,
    })),
    message: `Found ${result.emails.length} email(s). Analyze each email for action items — look for:
- Requests or asks ("Can you...", "Please...", "Could you...")
- Deadlines or due dates mentioned
- Meeting requests or follow-ups needed
- Deliverables or assignments

For each action item found, use create_task to create a task with:
- A clear title summarizing the action needed
- The email context in the description (who sent it, what they need)
- An appropriate priority (urgent if deadline is soon, high if from a boss/client, medium otherwise)
- A due_date if one is mentioned or can be inferred
- category_id if it fits an existing category
- action_type: "email"
- action_metadata: include the from, and subject fields

After creating each task that requires a reply, use update_task to save a smart reply draft in the ai_result field. The draft should be a professional, helpful reply the user can review and send. Keep it concise and match the tone of the original email.

Skip emails that are purely informational (newsletters, notifications, receipts) unless they require action. Tell the user what tasks you created, from which emails, and mention that reply drafts are available.`,
  });
}

// ── Scheduling & Reminders Handlers ──────────────────────────────────

async function handleSetReminder(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { data, error } = await ctx.userClient
    .from('tasks')
    .update({
      auto_execute_at: input.remind_at,
      is_automatable: true,
      action_type: 'reminder',
    })
    .eq('id', input.task_id)
    .eq('user_id', ctx.userId)
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({
    success: true,
    message: `Reminder set for ${input.remind_at}`,
    task: data,
  });
}

async function handleCreateRecurringTask(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { data: lastTask } = await ctx.userClient
    .from('tasks')
    .select('position')
    .eq('user_id', ctx.userId)
    .eq('status', 'todo')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await ctx.userClient
    .from('tasks')
    .insert({
      user_id: ctx.userId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      status: 'todo',
      position: (lastTask?.position ?? -1) + 1,
      recurrence_pattern: input.recurrence_pattern,
      is_automatable: true,
      action_type: input.action_type || 'recurring',
      action_metadata: input.action_metadata || null,
      ai_generated: true,
    })
    .select()
    .single();

  if (error) return JSON.stringify({ error: error.message });

  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    task_id: data.id,
    action_type: 'create_recurring_task',
    description: `Created recurring task: "${input.title}" (${input.recurrence_pattern})`,
    result: `Pattern: ${input.recurrence_pattern}`,
  });

  return JSON.stringify({
    success: true,
    message: `Recurring task created with pattern: ${input.recurrence_pattern}`,
    task: data,
  });
}

async function handleScheduleOptimizer(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const { data: tasks, error } = await ctx.userClient
    .from('tasks')
    .select('id, title, priority, status, due_date, auto_execute_at')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true });

  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({
    tasks,
    message:
      'Here are the pending tasks sorted by due date. Analyze priorities, deadlines, and suggest an optimal order for the day. Consider urgent tasks first, then by closest due date.',
  });
}

// ── Productivity & Analytics Handlers ────────────────────────────────

async function handleAnalyzeProductivity(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const days = (input.days as number) || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: allTasks } = await ctx.userClient
    .from('tasks')
    .select('status, priority, completed_at, completed_by, created_at')
    .eq('user_id', ctx.userId)
    .gte('created_at', since.toISOString());

  const { data: completedTasks } = await ctx.userClient
    .from('tasks')
    .select('completed_at, completed_by, created_at')
    .eq('user_id', ctx.userId)
    .eq('status', 'done')
    .gte('completed_at', since.toISOString());

  const total = allTasks?.length || 0;
  const completed = completedTasks?.length || 0;
  const byAgent = completedTasks?.filter((t) => t.completed_by === 'agent').length || 0;
  const byUser = completed - byAgent;

  return JSON.stringify({
    period: `Last ${days} days`,
    total_tasks_created: total,
    completed,
    completion_rate: total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%',
    completed_by_user: byUser,
    completed_by_agent: byAgent,
    still_pending: total - completed,
    message: 'Analyze these statistics and provide insights on productivity patterns.',
  });
}

async function handleSuggestTasks(ctx: ToolContext): Promise<string> {
  const { data: tasks } = await ctx.userClient
    .from('tasks')
    .select('id, title, description, priority, status, due_date, category_id')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true });

  const { data: recentDone } = await ctx.userClient
    .from('tasks')
    .select('title, completed_at')
    .eq('user_id', ctx.userId)
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(5);

  return JSON.stringify({
    pending_tasks: tasks,
    recently_completed: recentDone,
    message:
      'Based on the pending tasks, due dates, and recently completed work, suggest what the user should focus on next. Consider priorities and deadlines.',
  });
}

async function handleGetDailySummary(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const date = (input.date as string) || new Date().toISOString().split('T')[0];
  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59Z`;

  const { data: completedToday } = await ctx.userClient
    .from('tasks')
    .select('title, completed_by, completed_at')
    .eq('user_id', ctx.userId)
    .eq('status', 'done')
    .gte('completed_at', dayStart)
    .lte('completed_at', dayEnd);

  const { data: createdToday } = await ctx.userClient
    .from('tasks')
    .select('title, status, priority')
    .eq('user_id', ctx.userId)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  const { data: agentActions } = await supabaseAdmin
    .from('agent_activity')
    .select('action_type, description, result, created_at')
    .eq('user_id', ctx.userId)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd)
    .order('created_at', { ascending: true });

  const { data: remaining } = await ctx.userClient
    .from('tasks')
    .select('title, priority, due_date')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress']);

  return JSON.stringify({
    date,
    completed_today: completedToday,
    created_today: createdToday,
    agent_actions: agentActions,
    remaining_tasks: remaining,
    message:
      'Generate a comprehensive daily summary covering: what was accomplished, what the agent did, and what remains.',
  });
}

// ── Smart Planning Handlers ──────────────────────────────────────────

async function handleFocusMode(ctx: ToolContext): Promise<string> {
  const { data: tasks } = await ctx.userClient
    .from('tasks')
    .select('id, title, description, priority, status, due_date')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true });

  return JSON.stringify({
    tasks,
    message:
      'Pick the single most important task for the user to focus on right now. Consider: urgent priority first, then closest due date, then high priority. Explain why this task should be the focus.',
  });
}

async function handleEstimateTime(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  let query = ctx.userClient
    .from('tasks')
    .select('id, title, description, priority, status')
    .eq('user_id', ctx.userId);

  if (input.task_ids && Array.isArray(input.task_ids)) {
    query = query.in('id', input.task_ids as string[]);
  } else {
    query = query.in('status', ['todo', 'in_progress']);
  }

  const { data: tasks } = await query;
  return JSON.stringify({
    tasks,
    message:
      'Estimate how long each task will take in minutes. Consider the title, description, and priority. Return estimates for each task.',
  });
}

async function handleFindConflicts(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  const startDate =
    (input.start_date as string) || new Date().toISOString();
  const endDate =
    (input.end_date as string) ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tasks } = await ctx.userClient
    .from('tasks')
    .select('id, title, due_date, auto_execute_at, status')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress'])
    .or(`due_date.gte.${startDate},auto_execute_at.gte.${startDate}`)
    .or(`due_date.lte.${endDate},auto_execute_at.lte.${endDate}`);

  return JSON.stringify({
    tasks,
    date_range: { start: startDate, end: endDate },
    message:
      'Check for scheduling conflicts — tasks with overlapping due dates or auto_execute_at times. Report any conflicts found.',
  });
}

// ── Utility Handlers ─────────────────────────────────────────────────

async function handleTranslateText(
  input: Record<string, unknown>,
): Promise<string> {
  // Translation is handled natively by Claude — return the text for it to translate
  return JSON.stringify({
    text: input.text,
    target_language: input.target_language,
    source_language: input.source_language || 'auto-detect',
    message: `Translate the following text to ${input.target_language}: "${input.text}"`,
  });
}

async function handleCheckWeather(
  input: Record<string, unknown>,
): Promise<string> {
  const data = await checkWeather(
    input.location as string,
    (input.units as 'metric' | 'imperial') || 'imperial',
  );
  return JSON.stringify(data);
}

async function handleExportTasks(
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<string> {
  let query = ctx.userClient
    .from('tasks')
    .select('id, title, description, status, priority, due_date, completed_at, created_at, category_id, categories(name)')
    .eq('user_id', ctx.userId)
    .order('status')
    .order('position', { ascending: true });

  if (input.status) query = query.eq('status', input.status);
  if (input.category_id) query = query.eq('category_id', input.category_id);

  const { data: tasks, error } = await query;
  if (error) return JSON.stringify({ error: error.message });

  const rows = (tasks || []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    title: t.title as string,
    description: t.description as string | null,
    status: t.status as string,
    priority: t.priority as string,
    due_date: t.due_date as string | null,
    completed_at: t.completed_at as string | null,
    created_at: t.created_at as string,
    category_name: (t.categories as Record<string, unknown> | null)?.name as string | undefined,
  }));

  const format = input.format as string;
  const content =
    format === 'csv' ? exportTasksCsv(rows) : exportTasksMarkdown(rows);

  return JSON.stringify({
    format,
    content,
    task_count: rows.length,
    message: `Exported ${rows.length} tasks as ${format}. Present the content to the user.`,
  });
}

// ── Morning Briefing Handler ──────────────────────────────────────────

async function handleGenerateMorningBriefing(
  ctx: ToolContext,
): Promise<string> {
  // Load user's briefing topics from profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('briefing_topics, display_name, timezone')
    .eq('id', ctx.userId)
    .single();

  const topics: string[] = profile?.briefing_topics || [];

  if (topics.length === 0) {
    return JSON.stringify({
      success: false,
      message: 'No briefing topics configured. Ask the user to pick their interests in Settings → Morning Briefing.',
    });
  }

  const topicLabels: Record<string, string> = {
    market_news: 'Market & Finance news (stocks, crypto, economy)',
    world_news: 'World News headlines',
    tech: 'Tech & AI news',
    sports: 'Sports scores and headlines',
    weather: 'Weather forecast',
    health: 'Health & Wellness tips',
    science: 'Science discoveries and news',
    entertainment: 'Entertainment and pop culture news',
  };

  const selectedTopics = topics
    .map((t) => topicLabels[t] || t)
    .join(', ');

  // Fetch pending tasks (To Do + In Progress)
  const { data: pendingTasks } = await supabaseAdmin
    .from('tasks')
    .select('title, priority, due_date, status, category_id')
    .eq('user_id', ctx.userId)
    .in('status', ['todo', 'in_progress'])
    .order('priority', { ascending: false })
    .limit(15);

  const taskSummary = pendingTasks && pendingTasks.length > 0
    ? pendingTasks.map((t) =>
        `- [${t.status === 'in_progress' ? 'In Progress' : 'To Do'}] ${t.title} (${t.priority}${t.due_date ? `, due ${t.due_date}` : ''})`
      ).join('\n')
    : 'No pending tasks — your board is clear!';

  // Fetch today's calendar events
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  let calendarSummary = 'No calendar events today.';
  try {
    const calResult = await readCalendarEvents(ctx.userId, {
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
      maxResults: 10,
    });
    if (calResult.success && calResult.events && calResult.events.length > 0) {
      calendarSummary = calResult.events.map((e) =>
        `- ${e.title} (${new Date(e.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(e.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}${e.location ? `, ${e.location}` : ''})`
      ).join('\n');
    }
  } catch {
    calendarSummary = 'Could not load calendar (Google account may not be connected).';
  }

  // Fetch overnight agent activity (last 12 hours)
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString();
  const { data: overnightActivity } = await supabaseAdmin
    .from('agent_activity')
    .select('action_type, description, created_at')
    .eq('user_id', ctx.userId)
    .gte('created_at', twelveHoursAgo)
    .neq('action_type', 'morning_briefing')
    .order('created_at', { ascending: false })
    .limit(10);

  const activitySummary = overnightActivity && overnightActivity.length > 0
    ? overnightActivity.map((a) => `- ${a.description}`).join('\n')
    : 'No overnight activity.';

  // Log the briefing generation
  await supabaseAdmin.from('agent_activity').insert({
    user_id: ctx.userId,
    action_type: 'morning_briefing',
    description: `Generating morning briefing with topics: ${topics.join(', ')}`,
    result: 'in_progress',
  });

  return JSON.stringify({
    success: true,
    topics: selectedTopics,
    user_name: profile?.display_name || 'there',
    timezone: profile?.timezone || 'UTC',
    pending_tasks: taskSummary,
    todays_calendar: calendarSummary,
    overnight_activity: activitySummary,
    message: `Generate a personalized morning briefing for the user. Structure it as:

1. **Good morning greeting** using their name
2. **Your Day at a Glance** — summarize their pending tasks and today's calendar events (data provided below)
3. **Overnight Activity** — if the agent did anything overnight (created tasks from emails, etc.), highlight what's new
4. **News & Updates** — for each of their selected topics (${selectedTopics}), use web_search to find the latest info. Keep each topic to 2-3 bullet points.
5. **Tip of the Day** — end with a motivational note or productivity tip

PENDING TASKS:\n${taskSummary}

TODAY'S CALENDAR:\n${calendarSummary}

OVERNIGHT AGENT ACTIVITY:\n${activitySummary}

Present everything in a clean, scannable format with headers and bullet points.`,
  });
}
