# Product Requirements Document: TaskPilot

**Version:** 1.0
**Author:** Philip Civitello
**Date:** March 2026
**Status:** In Development

---

## 1. Overview

### 1.1 Product Summary

TaskPilot is an AI-powered task management application that goes beyond traditional to-do lists. It features an autonomous AI agent that can proactively execute tasks on the user's behalf — sending emails, creating calendar events, performing web research, generating documents, and more. The agent monitors scheduled tasks and automatically completes them when the time comes, ensuring users never miss a deadline.

### 1.2 Problem Statement

Existing task management tools are passive. They remind users what to do, but the user still has to do everything manually. Users forget tasks, miss deadlines, and waste time on repetitive work like sending routine emails or scheduling meetings.

### 1.3 Solution

TaskPilot bridges the gap between planning and execution. Users describe what needs to happen, and the AI agent handles the rest — autonomously sending emails, creating calendar events, researching topics, and generating documents. The agent runs on a scheduler, proactively completing overdue tasks without user intervention.

### 1.4 Target Users

- Professionals managing complex workflows across email, calendar, and tasks
- Users who want AI assistance beyond simple chatbots
- Anyone who needs help staying on top of deadlines and recurring responsibilities

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS v4, shadcn/ui, Motion |
| State Management | TanStack React Query v5 |
| Drag & Drop | @dnd-kit |
| Backend | Node.js, Fastify 5, TypeScript |
| Database | Supabase (PostgreSQL) with Row Level Security |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Authentication | Supabase Auth (Google, Microsoft, Yahoo OAuth + email/password) |
| Scheduling | node-cron (1-minute intervals) |
| Validation | Zod |

### 2.2 External API Integrations

| Service | Purpose | Tier |
|---------|---------|------|
| Anthropic Claude API | AI agent reasoning and tool use | API key |
| Tavily API | Real-time web search | Free (1,000/month) |
| OpenWeatherMap API | Weather data for outdoor task planning | Free (1,000/day) |
| Gmail API | Send emails via Google OAuth | OAuth |
| Microsoft Graph API | Send emails and create Outlook events | OAuth |
| Google Calendar API | Create Google Calendar events | OAuth |

### 2.3 System Architecture

```
Client (React + Vite)
  |
  |-- Supabase Auth (OAuth / Email)
  |-- REST API calls (Bearer JWT)
  |-- SSE streaming (AI chat responses)
  |
Server (Fastify)
  |
  |-- Auth Middleware (JWT verification)
  |-- Route Handlers (tasks, categories, chat, activity, profile)
  |-- AI Agent Service (Claude API + 24 tools)
  |-- Proactive Scheduler (node-cron, every 60s)
  |-- External Services (email, calendar, search, weather)
  |
Supabase (PostgreSQL)
  |
  |-- Row Level Security (user data isolation)
  |-- Realtime subscriptions (live UI updates)
  |-- Auto-generated profiles on signup
```

---

## 3. Features

### 3.1 Task Management

**Kanban Board**
- Three-column layout: To Do, In Progress, Done
- Drag-and-drop reordering within and between columns via @dnd-kit
- Animated card transitions with Motion
- Position persistence across sessions

**Task Properties**
- Title, description, priority (low / medium / high / urgent)
- Due date with timezone awareness
- Category assignment (with color and icon)
- Subtask hierarchy (parent-child relationships)
- Recurrence patterns: daily, weekly (with day selection), monthly (with date)
- Auto-execute scheduling (specific date/time for agent execution)

**Filtering and Search**
- Filter by status, priority, and category
- Search tasks by title
- Combined filters supported

**Task Detail Modal**
- Tabbed view: Details, AI Result, Subtasks
- Auto-pilot toggle with scheduled time picker
- View AI-generated research and documents
- Browse subtasks created by the break_down_task tool

### 3.2 AI Agent (Interactive Mode)

**Chat Interface**
- Slide-out panel activated via Ctrl+K
- Real-time streaming responses via Server-Sent Events
- Persistent chat history (last 50 messages for context)
- Suggested prompt carousel for common actions
- Clear history option

**Tool-Use Loop**
- Claude receives user message + full tool definitions
- Agent calls tools as needed, receives results, and continues reasoning
- Maximum 10 tool rounds per request to prevent runaway loops
- Dynamic system prompt includes user name, timezone, and current time

### 3.3 AI Agent Tools (24 Total)

**Task Management (7)**

| Tool | Description |
|------|-------------|
| list_tasks | Query tasks with filters (status, priority, category, limit) |
| create_task | Create tasks with full metadata including automation settings |
| update_task | Partial updates to any task field |
| complete_task | Mark done with completed_by='agent' attribution |
| delete_task | Remove tasks permanently |
| create_category | Add new categories with color and icon |
| break_down_task | Decompose complex tasks into subtasks |

**Real-World Actions (5)**

| Tool | Description |
|------|-------------|
| send_email | Send via Gmail or Microsoft Graph (supports to, cc, bcc) |
| create_calendar_event | Create events in Google Calendar or Outlook |
| web_search | Real-time search via Tavily API (up to 10 results) |
| generate_document | AI-generated reports and summaries in markdown |
| summarize_url | Fetch and summarize any web page |

**Scheduling (3)**

| Tool | Description |
|------|-------------|
| set_reminder | Schedule agent execution time on tasks |
| create_recurring_task | Create repeating tasks (daily, weekly, monthly patterns) |
| schedule_optimizer | Analyze and suggest optimal task ordering |

**Productivity (3)**

| Tool | Description |
|------|-------------|
| analyze_productivity | Completion statistics over configurable date range |
| suggest_tasks | AI recommendations for what to work on next |
| get_daily_summary | Comprehensive report of completions and pending work |

**Smart Planning (3)**

| Tool | Description |
|------|-------------|
| focus_mode | Identify the single most important task right now |
| estimate_time | Duration estimates based on task complexity |
| find_conflicts | Detect scheduling overlaps in upcoming tasks |

**Utility (3)**

| Tool | Description |
|------|-------------|
| translate_text | Translate between languages (auto-detect source) |
| check_weather | Current weather via OpenWeatherMap for planning |
| export_tasks | Export to CSV or markdown with filters |

### 3.4 Proactive Agent (Autonomous Mode)

The scheduler is the core differentiating feature of TaskPilot.

**How It Works**
1. Runs every 60 seconds via node-cron
2. Queries tasks where `is_automatable = true`, `status != 'done'`, and `auto_execute_at <= now()`
3. Processes up to 5 tasks per cycle to prevent overload
4. For each task, builds a prompt based on action_type and calls the AI agent
5. Agent determines the appropriate tool and executes the action
6. Task is marked complete with `completed_by = 'agent'`
7. Action is logged in the agent_activity table

**Supported Autonomous Actions**

| Action Type | What the Agent Does |
|-------------|-------------------|
| email | Sends email via Gmail or Outlook using stored metadata |
| calendar_event | Creates calendar event with specified details |
| research | Performs web search and saves findings to the task |
| document | Generates a document and attaches it to the task |
| reminder | Logs the reminder and marks the task complete |
| recurring | Completes current instance and creates the next one |

**Recurrence Engine**
- Parses patterns: `"daily"`, `"weekly:mon,wed,fri"`, `"monthly:15"`
- Automatically creates next task instance with same metadata
- Preserves category, priority, and action settings

### 3.5 Authentication

**Supported Providers**
- Google OAuth (with gmail.send + calendar.events scopes)
- Microsoft OAuth (with Mail.Send + Calendars.ReadWrite scopes)
- Yahoo OAuth
- Email and password signup with email confirmation

**Security**
- JWT-based session management via Supabase
- Row Level Security on all database tables
- Users can only access their own data
- OAuth tokens stored securely for API access (email, calendar)
- Protected routes redirect unauthenticated users to login

### 3.6 User Customization

- Display name
- Custom avatar upload
- Accent color (applies globally to UI)
- Theme: light, dark, or system
- Timezone (used for scheduling accuracy)

### 3.7 Activity Log

- Chronological record of all agent actions
- Grouped by date
- Links to related tasks
- Daily summary with action breakdown by type
- Provides full transparency into what the agent did and why

### 3.8 Dashboard and Analytics

- **Task Stats Bar**: Animated counters for total, in progress, completed, and overdue
- **Productivity Dashboard**: Completion rates, agent vs. user task completion, trends

### 3.9 UI/UX

- Responsive design (mobile and desktop)
- Landing page at `/` for unauthenticated visitors
- Dark mode with system preference detection
- Smooth animations via Motion library
- Toast notifications via Sonner
- Keyboard shortcut (Ctrl+K) for quick chat access

---

## 4. Database Schema

### 4.1 Tables

**profiles** — User settings and OAuth tokens
- id, email, full_name, avatar_url, display_name, custom_avatar_url
- theme, accent_color, timezone
- provider, provider_token, provider_refresh_token

**tasks** — Core task data
- id, user_id, category_id, parent_task_id
- title, description, status, priority, due_date, position
- is_automatable, auto_execute_at, action_type, action_metadata
- recurrence_pattern, ai_generated, ai_result
- completed_at, completed_by

**categories** — User-defined task groups
- id, user_id, name, color, icon

**chat_messages** — Conversation history
- id, user_id, role, content, tool_calls

**agent_activity** — Audit log of agent actions
- id, user_id, task_id, action_type, description, result

### 4.2 Security

- Row Level Security enabled on all tables
- Cascading deletes maintain referential integrity
- Automatic profile creation on user signup via database trigger
- Automatic timestamp updates via triggers

---

## 5. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/tasks | List tasks (filterable) |
| POST | /api/tasks | Create task |
| PATCH | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| PATCH | /api/tasks/:id/complete | Complete task |
| PATCH | /api/tasks/reorder | Batch reorder (drag-and-drop) |
| GET | /api/categories | List categories |
| POST | /api/categories | Create category |
| PATCH | /api/categories/:id | Update category |
| DELETE | /api/categories/:id | Delete category |
| POST | /api/categories/seed | Create default categories |
| POST | /api/chat | Send message to AI agent (SSE) |
| GET | /api/chat/history | Get chat history |
| DELETE | /api/chat/history | Clear chat history |
| GET | /api/activity | Get activity log |
| GET | /api/activity/summary | Today's activity summary |
| GET | /api/profile | Get user profile |
| PATCH | /api/profile | Update profile |

All endpoints except /api/health require JWT authentication.

---

## 6. Development and Deployment

### 6.1 Sprint History

| Sprint | Focus |
|--------|-------|
| 1 | Foundation: project setup, Supabase schema, authentication |
| 2 | Task management, categories, profile settings, Kanban board |
| 3 | Drag-and-drop, animations, TaskStats, accent color customization |
| 4 | AI agent with 24 tools, chat panel, SSE streaming |
| 5 | Proactive scheduler, activity log, task detail modal, onboarding |

### 6.2 Deployment

| Component | Platform |
|-----------|----------|
| Frontend | Vercel |
| Backend | Railway (persistent process for scheduler) |
| Database | Supabase (hosted PostgreSQL) |

### 6.3 Environment Variables

**Server**
- SUPABASE_URL, SUPABASE_SERVICE_KEY
- ANTHROPIC_API_KEY
- TAVILY_API_KEY
- OPENWEATHERMAP_API_KEY

**Client**
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- VITE_API_URL

---

## 7. Smart Autonomy Model

The agent uses a decision framework to determine what requires user confirmation versus what it can execute independently:

| Category | Examples | Behavior |
|----------|----------|----------|
| Auto-executable | Email, calendar events, research, documents, reminders | Agent acts without asking |
| Not auto-executable | Physical tasks (buy groceries, go to gym) | Agent notifies but cannot act |
| User-configurable | Any task | User can toggle auto-pilot per task |

This ensures the agent is helpful without overstepping — it handles digital actions autonomously while clearly communicating what it cannot do.

---

## 8. Non-Functional Requirements

- **Performance**: Fastify chosen for high-throughput request handling
- **Type Safety**: Full TypeScript across client, server, and shared types with Zod validation
- **Data Isolation**: Row Level Security ensures multi-tenant safety
- **Rate Limiting**: Scheduler processes max 5 tasks per cycle; agent limited to 10 tool rounds per request
- **Graceful Degradation**: External APIs (Tavily, OpenWeatherMap) return fallback messages when keys are not configured
- **Accessibility**: @dnd-kit provides keyboard-accessible drag-and-drop
