export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
  custom_avatar_url: string | null;
  theme: 'light' | 'dark' | 'system';
  accent_color: string;
  timezone: string;
  provider: string | null;
  has_seen_tutorial: boolean;
  sync_enabled: boolean;
  sync_interval: string;
  briefing_topics: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  position: number;
  is_automatable: boolean;
  auto_execute_at: string | null;
  ai_generated: boolean;
  ai_result: string | null;
  action_type: string | null;
  action_metadata: Record<string, unknown> | null;
  recurrence_pattern: string | null;
  completed_at: string | null;
  completed_by: 'user' | 'agent' | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls: unknown[] | null;
  created_at: string;
}

export interface AgentActivity {
  id: string;
  user_id: string;
  task_id: string | null;
  action_type: string;
  description: string;
  result: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isUnread: boolean;
  labels: string[];
  hasReplied?: boolean;
}

export interface EmailDraft {
  id: string;
  user_id: string;
  task_id: string | null;
  to_address: string;
  subject: string;
  body: string;
  cc: string | null;
  bcc: string | null;
  status: 'pending_review' | 'sent' | 'cancelled';
  review_deadline: string;
  sent_at: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string | null;
  location: string | null;
  attendees: string[];
  status: string;
  htmlLink: string;
}
