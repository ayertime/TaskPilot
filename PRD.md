# Product Requirements Document: TaskPilot

**Version:** 1.0
**Author:** PJ C
**Date:** March 2026
**Status:** Released (v1.0)

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
| AI | Anthropic Claude API (claude-haiku-4-5); local model planned (Llama 3.1 8B via Ollama on Raspberry Pi 5) |
| Authentication | Supabase Auth (Google OAuth + email/password; Microsoft, Yahoo, Slack coming soon) |
| Scheduling | node-cron (1-minute intervals) |
| Validation | Zod |

### 2.2 External API Integrations

| Service | Purpose | Tier |
|---------|---------|------|
| Anthropic Claude API | AI agent reasoning and tool use | API key |
| Tavily API | Real-time web search | Free (1,000/month) |
| OpenWeatherMap API | Weather data for outdoor task planning | Free (1,000/day) |
| Gmail API | Send emails and read inbox via Google OAuth | OAuth (free) |
| Google Calendar API | Create and read Google Calendar events | OAuth (free) |
| Microsoft Graph API | Send emails and create Outlook events (coming soon) | OAuth |

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
  |-- AI Agent Service (Claude API + 26 tools)
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
- Three-column layout: Not Started, In Progress, Completed
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

**Time Remaining Countdown**
- Color-coded countdown on task cards: green (>1hr), yellow (40min-1hr), red (<40min)
- Blinking red glow when under 10 minutes
- Live seconds countdown (59, 58, 57...) when under 1 minute with flashing red

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
- Scheduler-initiated agent calls are excluded from chat history (`saveToHistory: false`) to keep the chat clean
- Suggested prompt carousel for common actions
- Clear history option
- **Live tool visualization**: When the agent uses tools, the UI shows animated cards with tool-specific icons, contextual details (e.g., search queries, email recipients), spinning loaders while executing, green checkmarks on completion, and expandable result panels

**Content Policy**
- The agent is restricted to task management and productivity topics only
- Refuses political, sexual, offensive, violent, illegal, and controversial content
- Politely redirects off-topic requests back to task management

**Daily Cost Guardrail**
- Tracks token usage and estimated cost per day
- Blocks new requests once the daily limit ($1.00) is reached
- Resets automatically at midnight
- Configurable limit for production deployment

**Tool-Use Loop**
- Claude receives user message + full tool definitions
- Agent calls tools as needed, receives results, and continues reasoning
- Maximum 10 tool rounds per request to prevent runaway loops
- Dynamic system prompt includes user name, timezone, and current time

**Task Creation Form**
- Three-section layout: Task Info, Settings, Agent Action
- Visual action picker with clickable icon cards (None, Email, Calendar, Research, Document, Reminder)
- Dynamic metadata panels: email fields (To, Subject, Body), calendar fields (Start, End, Location)
- Auto-pilot enabled by default for all new tasks

### 3.3 AI Agent Tools (26 Total)

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

**Real-World Actions (7)**

| Tool | Description |
|------|-------------|
| read_emails | Read Gmail inbox with search, filter unread, and create tasks from actionable emails |
| read_calendar | Read upcoming Google Calendar events, find free time, create tasks from meetings |
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
4. **Smart classification gate**: Skips tasks with no `action_type` or `action_type = 'manual'` — only user can complete physical tasks
5. **Sent email detection**: Before executing email tasks, checks Gmail sent folder to see if the user already sent it manually (prevents duplicate emails)
6. For each task, builds a prompt based on action_type and calls the AI agent
7. Agent determines the appropriate tool and executes the action
8. Task is marked complete with `completed_by = 'agent'`
9. Action is logged in the agent_activity table

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
- Google OAuth (with gmail.send, gmail.readonly, calendar.events scopes)
- Microsoft OAuth (coming soon)
- Yahoo OAuth (coming soon)
- Slack (coming soon)
- Email and password signup with email confirmation
- Duplicate email detection on signup (friendly error message)

**OAuth Token Management**
- Access tokens refreshed automatically when expired (via refresh token + client credentials)
- Tokens encrypted at rest with AES-256-GCM and stored in profiles table
- Managed by a centralized oauth-token-service with backward compatibility (auto-detects plaintext vs encrypted)
- AuthCallback page captures provider tokens via onAuthStateChange (only reliable source during OAuth redirect)
- Identity linking via linkIdentity (connect Google to existing email/password account without changing primary email)
- Disconnect button in Settings to unlink a connected Google account
- Provider detection uses app_metadata.providers array (not app_metadata.provider) for linked identities

**Security**
- JWT-based session management via Supabase
- Row Level Security on all database tables
- Users can only access their own data
- OAuth tokens encrypted at rest with AES-256-GCM (application-layer encryption)
- SSRF protection on web search tool (blocks private IPs, IPv6 loopback, RFC 1918 ranges)
- Protected routes redirect unauthenticated users to login
- Forgot password flow with email reset link and inline password update form

### 3.6 User Customization

- Display name
- Custom avatar upload
- Accent color (applies globally to UI)
- Theme: light, dark, or system
- Timezone (dropdown of all IANA timezones, used for scheduling and header clock)
- Smart Sync toggle (enable/disable automatic email and calendar syncing)
- Sync interval (1h, 3h, 5h, 12h, or once a day)
- Google account connect/disconnect/reconnect in Settings
- Delete account with full data cleanup and redirect to login

### 3.7 Activity Log

- Chronological record of all agent actions
- Grouped by date
- Links to related tasks
- Daily summary with action breakdown by type
- Provides full transparency into what the agent did and why
- **Expandable activity details**: Click any activity to see full context (email content, calendar event details, search queries) stored in a JSONB metadata column
- **Live agent working indicator**: Pulsing "Agent Working" badge appears in real time when the agent is executing actions
- **Progress steps**: Agent logs intermediate steps (e.g., "Composing email...") before final actions, visible in real time via Supabase Realtime

### 3.7.1 In-App Email View

- Dedicated Email page accessible from sidebar navigation
- **Inbox tab**: View recent emails from connected Gmail account
- **Sent tab**: View sent emails
- Expandable email cards showing full headers (from, to, date) and body
- Unread email indicators with "New" badge
- **Reply detection badges**: Green "Replied" badge with reply icon on emails that have been responded to (via Gmail Threads API)
- **Email action banner**: Collapsible banner at top of Email page showing emails needing a reply (amber) and already-replied emails (faded/strikethrough), with counts for each state
- Graceful fallback message when email account is not connected
- Uses existing Gmail API integration (no additional API costs)

### 3.7.2 In-App Calendar View

- Dedicated Calendar page accessible from sidebar navigation
- **Weekly calendar grid** (desktop): Time-slot grid with days across the top and hours on the left axis, showing events and tasks as positioned blocks within the grid
  - "Today" column indicator and current time line
  - Week navigation bar with prev/next arrows and current week range
- **Timeline list** (mobile): Events and tasks sorted by time, grouped by day (Today, Tomorrow, or date)
- **Unified view**: Google Calendar events, TaskPilot tasks with due dates, and actionable emails displayed together
- **Event cards**: Time column, duration, color bars, location, attendees, and deep links to Google Calendar
- **Task cards**: Priority-colored bars (red=urgent, orange=high, yellow=medium, blue=low), "Task" badge, overdue indicators
- **Email blocks on calendar**: Actionable emails from inbox shown on calendar; replied emails rendered with strikethrough sender name, faded/muted colors, and green checkmark
- "Now" badge on currently active events
- Past events shown with reduced opacity
- Graceful fallback when Google Calendar is not connected (tasks still display)

### 3.8 New-User Tutorial

- Auto-playing animated slideshow modal for first-time users
- 10 slides using real content from the landing page (features, icons, how-it-works steps)
- Auto-advances every 4.5 seconds, pausable on hover
- Smooth cross-fade transitions and staggered element reveals via Motion
- Progress bar, dot navigation, arrow key support, and skip button
- Final slide with CTA buttons: "Create a Task" and "Open AI Chat (Ctrl+K)"
- First-time detection via localStorage + `has_seen_tutorial` column in profiles table
- Re-watchable from Settings > Help > "Watch Again"
- No conflict with Welcome Back Modal (mutually exclusive by design)

### 3.9 Welcome Back Modal

- Appears when user returns after 1+ hour away (tracked via localStorage)
- Shows away duration, overdue tasks, agent activity, top priority tasks, and tasks due in 24 hours
- "All clear" state with green checkmark if nothing pending
- Dismissed per session (sessionStorage) to prevent repeat display

### 3.10 Smart Sync (Email & Calendar Integration)

- Automatically reads Gmail inbox and Google Calendar on a configurable interval
- AI agent analyzes emails and creates tasks only for actionable ones (ignores newsletters, marketing, notifications)
- Creates preparation tasks from upcoming calendar events (meetings, appointments)
- Deduplication via gmail_id/gcal_id in action_metadata prevents duplicate task creation
- User-configurable: toggle on/off and set sync interval in Settings
- On-demand sync available via chat ("check my email", "what's on my calendar")

### 3.11 Dashboard and Analytics

- **Live Clock**: User's current time and date displayed in header, updated every second, uses profile timezone
- **Task Stats Bar**: Animated counters for total, in progress, completed, and overdue
- **Overdue glow**: Overdue stat card and task cards pulse with a red glow effect to draw attention
- **Real-time overdue detection**: Stats bar re-evaluates every 30 seconds so overdue counts update without a page refresh
- **Productivity Dashboard**: Completion rates, agent vs. user task completion, trends

### 3.12 Browser Notifications

- Uses the browser Notification API (not web push / VAPID)
- Fires `new Notification()` when the AI agent completes a task via realtime handler
- Only shows browser notification when tab is NOT focused (`!document.hasFocus()`)
- In-app Sonner toast handles the focused case
- Permission requested on first app load (only if not already denied)
- User can toggle notifications on/off in Settings (localStorage-based, no DB column)
- Shows helper text if browser has blocked notifications

### 3.13 Progressive Web App (PWA)

- Installable on any device (phone, tablet, desktop) via `vite-plugin-pwa`
- Service worker with `autoUpdate` registration (silent updates)
- Manifest with app name, theme color, and icons (192x192, 512x512)
- Runtime caching: `NetworkFirst` for Supabase and API routes, cache-first for static assets
- Apple PWA meta tags for iOS support

### 3.14 Mobile Real-Time Updates

- **Visibility change detection**: When the app returns to foreground (phone unlocked, tab switched back), all task and activity queries are automatically refetched
- **Instant overdue transitions**: `setTimeout` timers fire at the exact moment each task's due date passes, updating the UI without requiring a refresh
- **Refetch on window focus**: TanStack Query configured with `refetchOnWindowFocus: 'always'` for immediate data freshness

### 3.15 Task Cleanup

- **Clear completed button**: Manual bulk-delete of all completed tasks from the dashboard
- **Midnight auto-cleanup**: Cron job at 00:00 UTC permanently deletes all tasks with status `done`

### 3.16 UI/UX

- Responsive design (mobile and desktop)
- Landing page at `/` for unauthenticated visitors
- Dark mode with system preference detection
- Smooth animations via Motion library
- Toast notifications via Sonner
- Browser notifications for background agent activity
- Keyboard shortcut (Ctrl+K) for quick chat access
- Sidebar navigation with Tasks, Email, Calendar, Activity, and Settings pages
- List view alongside Kanban board with view toggle (persisted to localStorage)
- Tinted neutral color palette (blue-hued OKLCH) for polished, non-template appearance
- Glassmorphism header and sidebar with backdrop blur
- Markdown rendering in AI chat messages
- Installable PWA for native app experience

---

## 4. Database Schema

### 4.1 Tables

**profiles** — User settings and OAuth tokens
- id, email, full_name, avatar_url, display_name, custom_avatar_url
- theme, accent_color, timezone
- provider, provider_token, provider_refresh_token
- sync_enabled, sync_interval
- has_seen_tutorial

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

**email_drafts** — Draft-first email sending with review window
- id, user_id, task_id
- to_address, subject, body, cc, bcc
- status (pending_review / sent / cancelled), review_deadline, sent_at

**agent_activity** — Audit log of agent actions
- id, user_id, task_id, action_type, description, result, metadata (JSONB)

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
| POST | /api/tasks/:id/complete | Complete task |
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
| DELETE | /api/tasks/completed | Clear all completed tasks |
| GET | /api/emails | Read inbox emails via Gmail API |
| GET | /api/emails/sent | Read sent emails via Gmail API |
| GET | /api/calendar | Read calendar events via Google Calendar API |
| GET | /api/drafts | List pending email drafts |
| POST | /api/drafts/:id/send | Manually send a draft now |
| POST | /api/drafts/:id/cancel | Cancel a draft |
| PATCH | /api/drafts/:id | Edit draft content |
| GET | /api/profile | Get user profile |
| PATCH | /api/profile | Update profile |
| GET | /api/profile/oauth-status | Check OAuth connection status |
| POST | /api/profile/oauth-tokens | Save OAuth provider tokens |

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
| 6 | Google OAuth, Gmail/Calendar integration, Smart Sync, token refresh, time countdown, welcome-back modal, dark mode fix, task form redesign |
| 7 | UI polish (tinted neutrals, glassmorphism, list view), new-user tutorial, chat cleanup (scheduler messages hidden), drag-and-drop performance fixes |
| 8 | Browser notifications (Notification API), PWA (vite-plugin-pwa, installable on all devices), polished README, deployment (Vercel + Railway) |
| 9 | Real-time agent monitoring (live progress steps, expandable activity details), in-app Email and Calendar views, weekly calendar grid, tasks on calendar, email reply detection badges, email action banner, smart task classification (manual vs automatable), sent email detection, replied email rendering on calendar, mobile real-time updates, clear completed tasks, UI polish (task form redesign, sidebar, landing page mobile fixes), updated landing page and tutorial with new features |
| 10 | Security hardening (AES-256-GCM token encryption, SSRF protection, input validation), forgot password flow, duplicate email signup detection, Google identity linking (linkIdentity instead of signInWithOAuth), disconnect Google button, optimistic task creation dialog, column rename (Not Started/Completed), delete account improvements, tutorial reset on account recreation, v1.0 release tag |

### 6.2 Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://task-pilot-self.vercel.app |
| Backend | Railway (persistent process for scheduler) | https://taskpilot-production-b46b.up.railway.app |
| Database | Supabase (hosted PostgreSQL) | — |

### 6.3 Environment Variables

**Server**
- SUPABASE_URL, SUPABASE_SERVICE_KEY
- ANTHROPIC_API_KEY
- TAVILY_API_KEY
- OPENWEATHERMAP_API_KEY
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (for token refresh)
- TOKEN_ENCRYPTION_KEY (64-char hex string for AES-256-GCM token encryption)

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

### 7.1 Smart Task Classification

Tasks are automatically classified at creation time (both via REST API and agent tool) using a keyword-based classifier:

| Classification | Keywords | Result |
|----------------|----------|--------|
| Email | email, send, reply to, forward, mail | `is_automatable: true`, `action_type: 'email'` |
| Calendar | schedule, meeting, book, appointment | `is_automatable: true`, `action_type: 'calendar_event'` |
| Research | research, look up, search for, investigate | `is_automatable: true`, `action_type: 'research'` |
| Document | write, draft, generate report, summarize | `is_automatable: true`, `action_type: 'document'` |
| Reminder | remind, reminder, don't forget | `is_automatable: true`, `action_type: 'reminder'` |
| Manual | gym, workout, grocery, cook, clean, haircut, dentist, etc. | `is_automatable: false`, `action_type: null` |
| Unknown | No keyword match | `is_automatable: false`, `action_type: null` |

Manual keywords are checked first to ensure physical tasks are never auto-piloted. The classifier is a placeholder — will be replaced by a local AI model (Llama 3.1 8B on Ollama) for smarter classification.

### 7.2 Draft-First Email Sending

When the scheduler/auto-pilot sends emails on the user's behalf, it uses a **draft-first** approach instead of sending directly:

1. Agent composes the email and creates a **draft** with a 1-hour review window
2. User is notified via activity log and sees the draft on the Email page
3. User can **review, edit, send now, or cancel** the draft
4. If the user doesn't act within the review window, the email **auto-sends**

This ensures:
- Emails always get sent (core auto-pilot value preserved)
- User has a safety net to catch bad content or wrong context
- Interactive chat emails still send immediately (only auto-pilot uses drafts)

| Mode | Trigger | Behavior |
|------|---------|----------|
| Interactive (chat) | User asks agent to send | Sends immediately |
| Auto-pilot (scheduler) | Scheduled task fires | Creates draft → auto-sends after 1 hour |

The `email_drafts` table tracks draft status (`pending_review`, `sent`, `cancelled`), review deadline, and associated task. A cron job every 5 minutes checks for expired drafts and auto-sends them.

This ensures the agent is helpful without overstepping — it handles digital actions autonomously while clearly communicating what it cannot do.

---

## 8. Non-Functional Requirements

- **Performance**: Fastify chosen for high-throughput request handling
- **Type Safety**: Full TypeScript across client, server, and shared types with Zod validation
- **Data Isolation**: Row Level Security ensures multi-tenant safety
- **Rate Limiting**: Scheduler processes max 5 tasks per cycle; agent limited to 10 tool rounds per request
- **Graceful Degradation**: External APIs (Tavily, OpenWeatherMap) return fallback messages when keys are not configured
- **Accessibility**: @dnd-kit provides keyboard-accessible drag-and-drop
