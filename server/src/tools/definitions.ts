import type Anthropic from '@anthropic-ai/sdk';

type Tool = Anthropic.Tool;

// ── Task Management (7) ──────────────────────────────────────────────

const list_tasks: Tool = {
  name: 'list_tasks',
  description:
    'List tasks with optional filters. Returns tasks sorted by position. Use this to see what tasks exist before creating new ones.',
  input_schema: {
    type: 'object' as const,
    properties: {
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'done'],
        description: 'Filter by status',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        description: 'Filter by priority',
      },
      category_id: {
        type: 'string',
        description: 'Filter by category UUID',
      },
      limit: {
        type: 'number',
        description: 'Max number of tasks to return (default 50)',
      },
    },
    required: [],
  },
};

const create_task: Tool = {
  name: 'create_task',
  description:
    'Create a new task. Set is_automatable=true and action_type if the agent should auto-execute this task (e.g. sending an email at a scheduled time).',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Task title (required)' },
      description: { type: 'string', description: 'Task description' },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
        description: 'Priority level (default: medium)',
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'done'],
        description: 'Initial status (default: todo)',
      },
      category_id: { type: 'string', description: 'Category UUID' },
      due_date: {
        type: 'string',
        description: 'Due date in ISO 8601 format (e.g. 2026-03-25T17:00:00Z)',
      },
      is_automatable: {
        type: 'boolean',
        description: 'Whether the agent can auto-execute this task',
      },
      auto_execute_at: {
        type: 'string',
        description:
          'When the agent should auto-execute if user hasn\'t done it (ISO 8601)',
      },
      action_type: {
        type: 'string',
        enum: [
          'email',
          'calendar_event',
          'research',
          'document',
          'reminder',
          'recurring',
        ],
        description: 'Type of automated action',
      },
      action_metadata: {
        type: 'object',
        description:
          'Action-specific data (e.g. {to, subject, body} for email)',
      },
    },
    required: ['title'],
  },
};

const update_task: Tool = {
  name: 'update_task',
  description: 'Update an existing task. Only include the fields you want to change.',
  input_schema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Task UUID (required)' },
      title: { type: 'string' },
      description: { type: 'string' },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'done'],
      },
      category_id: { type: 'string' },
      due_date: { type: 'string' },
      is_automatable: { type: 'boolean' },
      auto_execute_at: { type: 'string' },
      action_type: {
        type: 'string',
        enum: [
          'email',
          'calendar_event',
          'research',
          'document',
          'reminder',
          'recurring',
        ],
      },
      action_metadata: { type: 'object' },
    },
    required: ['id'],
  },
};

const complete_task: Tool = {
  name: 'complete_task',
  description: 'Mark a task as done.',
  input_schema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Task UUID' },
    },
    required: ['id'],
  },
};

const delete_task: Tool = {
  name: 'delete_task',
  description: 'Permanently delete a task. Use with caution — ask the user for confirmation first.',
  input_schema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Task UUID' },
    },
    required: ['id'],
  },
};

const create_category: Tool = {
  name: 'create_category',
  description: 'Create a new category for organizing tasks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Category name' },
      color: {
        type: 'string',
        description: 'Hex color (e.g. #6366f1). Defaults to indigo.',
      },
    },
    required: ['name'],
  },
};

const break_down_task: Tool = {
  name: 'break_down_task',
  description:
    'Break a complex task into smaller subtasks. Creates subtasks linked to the parent via parent_task_id.',
  input_schema: {
    type: 'object' as const,
    properties: {
      id: { type: 'string', description: 'Parent task UUID' },
      subtasks: {
        type: 'array',
        description: 'List of subtasks to create',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
            },
          },
          required: ['title'],
        },
      },
    },
    required: ['id', 'subtasks'],
  },
};

// ── Real-World Actions (7) ───────────────────────────────────────────

const read_emails: Tool = {
  name: 'read_emails',
  description:
    'Read emails from the user\'s Gmail inbox. Can search, filter unread, or get recent messages. Use this to check for actionable emails that could become tasks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Gmail search query (e.g. "from:boss@company.com", "subject:invoice", "is:important"). Leave empty for recent emails.',
      },
      max_results: {
        type: 'number',
        description: 'Number of emails to return (default 10, max 20)',
      },
      unread_only: {
        type: 'boolean',
        description: 'Only return unread emails (default false)',
      },
    },
    required: [],
  },
};

const read_calendar: Tool = {
  name: 'read_calendar',
  description:
    'Read upcoming events from the user\'s Google Calendar. Use this to check what\'s on the schedule, find free time, or create tasks from upcoming events.',
  input_schema: {
    type: 'object' as const,
    properties: {
      time_min: {
        type: 'string',
        description: 'Start of time range (ISO 8601, defaults to now)',
      },
      time_max: {
        type: 'string',
        description: 'End of time range (ISO 8601, defaults to 7 days from now)',
      },
      max_results: {
        type: 'number',
        description: 'Number of events to return (default 15, max 50)',
      },
      query: {
        type: 'string',
        description: 'Search query to filter events by title/description',
      },
    },
    required: [],
  },
};

const send_email: Tool = {
  name: 'send_email',
  description:
    'Send an email via the user\'s connected Gmail or Microsoft account. If scheduling for later, create a task with action_type="email" instead.',
  input_schema: {
    type: 'object' as const,
    properties: {
      to: { type: 'string', description: 'Recipient email address' },
      subject: { type: 'string', description: 'Email subject line' },
      body: { type: 'string', description: 'Email body (plain text)' },
      cc: { type: 'string', description: 'CC email address' },
      bcc: { type: 'string', description: 'BCC email address' },
    },
    required: ['to', 'subject', 'body'],
  },
};

const create_calendar_event: Tool = {
  name: 'create_calendar_event',
  description:
    'Create a calendar event in the user\'s connected Google or Outlook calendar.',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Event title' },
      start_time: {
        type: 'string',
        description: 'Start time in ISO 8601 format',
      },
      end_time: {
        type: 'string',
        description: 'End time in ISO 8601 format',
      },
      description: { type: 'string', description: 'Event description' },
      location: { type: 'string', description: 'Event location' },
      attendees: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of attendee email addresses',
      },
    },
    required: ['title', 'start_time', 'end_time'],
  },
};

const web_search: Tool = {
  name: 'web_search',
  description:
    'Search the internet for real-time information using Tavily. Use this for research tasks, fact-checking, or finding up-to-date information.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Search query' },
      num_results: {
        type: 'number',
        description: 'Number of results to return (default 5, max 10)',
      },
    },
    required: ['query'],
  },
};

const generate_document: Tool = {
  name: 'generate_document',
  description:
    'Generate a text document (e.g. report, summary, draft) and attach it to a task as ai_result.',
  input_schema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'Task UUID to attach the document to',
      },
      prompt: {
        type: 'string',
        description: 'What to generate (e.g. "Write a project status report")',
      },
      format: {
        type: 'string',
        enum: ['markdown', 'text'],
        description: 'Output format (default: markdown)',
      },
    },
    required: ['task_id', 'prompt'],
  },
};

const summarize_url: Tool = {
  name: 'summarize_url',
  description: 'Fetch a URL and return a concise summary of its content.',
  input_schema: {
    type: 'object' as const,
    properties: {
      url: { type: 'string', description: 'The URL to fetch and summarize' },
    },
    required: ['url'],
  },
};

const scan_emails_for_tasks: Tool = {
  name: 'scan_emails_for_tasks',
  description:
    'Scan the user\'s recent emails and identify action items that should become tasks. Reads emails, then you should analyze them and create tasks for any actionable items found. Use this when the user asks to turn emails into tasks or wants to catch up on action items from their inbox.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Gmail search query to filter emails (e.g. "is:important", "from:boss@company.com"). Leave empty for recent unread emails.',
      },
      max_results: {
        type: 'number',
        description: 'Number of emails to scan (default 10, max 20)',
      },
    },
    required: [],
  },
};

// ── Scheduling & Reminders (3) ───────────────────────────────────────

const set_reminder: Tool = {
  name: 'set_reminder',
  description:
    'Set a reminder for a task at a specific time. Creates or updates the auto_execute_at field.',
  input_schema: {
    type: 'object' as const,
    properties: {
      task_id: { type: 'string', description: 'Task UUID' },
      remind_at: {
        type: 'string',
        description: 'When to remind (ISO 8601 format)',
      },
    },
    required: ['task_id', 'remind_at'],
  },
};

const create_recurring_task: Tool = {
  name: 'create_recurring_task',
  description:
    'Create a task that repeats on a schedule. Pattern examples: "daily", "weekly:mon,wed,fri", "monthly:15".',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string' },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'urgent'],
      },
      recurrence_pattern: {
        type: 'string',
        description:
          'Recurrence pattern: "daily", "weekly:mon,wed,fri", "monthly:15"',
      },
      action_type: {
        type: 'string',
        enum: [
          'email',
          'calendar_event',
          'research',
          'document',
          'reminder',
          'recurring',
        ],
      },
      action_metadata: { type: 'object' },
    },
    required: ['title', 'recurrence_pattern'],
  },
};

const schedule_optimizer: Tool = {
  name: 'schedule_optimizer',
  description:
    'Analyze all pending tasks and suggest an optimal order for the day based on priority, due dates, and estimated effort.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date: {
        type: 'string',
        description: 'Date to optimize (ISO 8601, defaults to today)',
      },
    },
    required: [],
  },
};

// ── Productivity & Analytics (3) ─────────────────────────────────────

const analyze_productivity: Tool = {
  name: 'analyze_productivity',
  description:
    'Analyze task completion patterns — completion rate, busiest days, average time to complete, and insights.',
  input_schema: {
    type: 'object' as const,
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to analyze (default 7)',
      },
    },
    required: [],
  },
};

const suggest_tasks: Tool = {
  name: 'suggest_tasks',
  description:
    'Look at existing tasks and context to proactively suggest what the user should do next.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

const get_daily_summary: Tool = {
  name: 'get_daily_summary',
  description:
    'Generate a summary of the day: what the agent did, what the user did, and what remains.',
  input_schema: {
    type: 'object' as const,
    properties: {
      date: {
        type: 'string',
        description: 'Date for summary (ISO 8601, defaults to today)',
      },
    },
    required: [],
  },
};

// ── Smart Planning (3) ───────────────────────────────────────────────

const focus_mode: Tool = {
  name: 'focus_mode',
  description:
    '"What should I focus on right now?" — picks the single most important task based on priority, due date, and context.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

const estimate_time: Tool = {
  name: 'estimate_time',
  description:
    'Estimate how long each task will take and return time estimates.',
  input_schema: {
    type: 'object' as const,
    properties: {
      task_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Task UUIDs to estimate (defaults to all pending tasks)',
      },
    },
    required: [],
  },
};

const find_conflicts: Tool = {
  name: 'find_conflicts',
  description:
    'Detect scheduling conflicts between tasks based on due dates and auto_execute_at times.',
  input_schema: {
    type: 'object' as const,
    properties: {
      start_date: {
        type: 'string',
        description: 'Start of range (ISO 8601, defaults to today)',
      },
      end_date: {
        type: 'string',
        description: 'End of range (ISO 8601, defaults to 7 days from now)',
      },
    },
    required: [],
  },
};

// ── Utility (3) ──────────────────────────────────────────────────────

const translate_text: Tool = {
  name: 'translate_text',
  description: 'Translate text between languages.',
  input_schema: {
    type: 'object' as const,
    properties: {
      text: { type: 'string', description: 'Text to translate' },
      target_language: {
        type: 'string',
        description: 'Target language (e.g. "Spanish", "French", "Japanese")',
      },
      source_language: {
        type: 'string',
        description: 'Source language (auto-detected if omitted)',
      },
    },
    required: ['text', 'target_language'],
  },
};

const check_weather: Tool = {
  name: 'check_weather',
  description:
    'Check current weather for a location. Useful for planning outdoor tasks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      location: {
        type: 'string',
        description: 'City name (e.g. "New York", "London, UK")',
      },
      units: {
        type: 'string',
        enum: ['metric', 'imperial'],
        description: 'Temperature units (default: imperial)',
      },
    },
    required: ['location'],
  },
};

const export_tasks: Tool = {
  name: 'export_tasks',
  description: 'Export tasks as CSV or formatted markdown.',
  input_schema: {
    type: 'object' as const,
    properties: {
      format: {
        type: 'string',
        enum: ['csv', 'markdown'],
        description: 'Export format',
      },
      status: {
        type: 'string',
        enum: ['todo', 'in_progress', 'done'],
        description: 'Filter by status',
      },
      category_id: {
        type: 'string',
        description: 'Filter by category UUID',
      },
    },
    required: ['format'],
  },
};

// ── Briefing ─────────────────────────────────────────────────────────

const generate_morning_briefing: Tool = {
  name: 'generate_morning_briefing',
  description:
    'Generate a personalized morning briefing based on the user\'s selected interests (market news, sports, world news, tech, weather, etc.). Uses web_search under the hood to gather fresh information. The agent should present the briefing in a clean, scannable format.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

// ── Export ────────────────────────────────────────────────────────────

export const allTools: Tool[] = [
  // Task Management
  list_tasks,
  create_task,
  update_task,
  complete_task,
  delete_task,
  create_category,
  break_down_task,
  // Real-World Actions
  read_emails,
  read_calendar,
  send_email,
  create_calendar_event,
  web_search,
  generate_document,
  summarize_url,
  scan_emails_for_tasks,
  // Scheduling & Reminders
  set_reminder,
  create_recurring_task,
  schedule_optimizer,
  // Productivity & Analytics
  analyze_productivity,
  suggest_tasks,
  get_daily_summary,
  // Smart Planning
  focus_mode,
  estimate_time,
  find_conflicts,
  // Utility
  translate_text,
  check_weather,
  export_tasks,
  // Briefing
  generate_morning_briefing,
];
