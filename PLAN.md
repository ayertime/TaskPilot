# TaskPilot — AI-Powered To Do App

## Context
First intern project — building **TaskPilot**, a To Do app where an AI agent doesn't just track tasks, it *does* them. The agent proactively executes scheduled tasks (sends emails, creates calendar events, does research, generates documents) if the user hasn't done them by the due time. It also reports what it accomplished. Due **March 25, 2026**.

## Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express 5 + TypeScript
- **Database**: Supabase (PostgreSQL + built-in Auth + Realtime)
- **AI**: Claude API (Anthropic SDK) with tool-use
- **Auth**: Google + Microsoft + Yahoo OAuth + email/password via Supabase Auth
- **UI**: shadcn/ui + Tailwind CSS v4 + Motion (animations) + dnd-kit (drag-and-drop)
- **Search**: Tavily API (web search for research tasks)
- **Weather**: OpenWeatherMap API (free tier — for outdoor task planning)
- **Scheduling**: node-cron (background task scheduler)

## Project Structure
```
To Do Project/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── auth/          # LoginPage, AuthCallback, ProtectedRoute
│   │   │   ├── dashboard/     # TaskBoard, TaskCard, TaskColumn, TaskForm
│   │   │   ├── chat/          # ChatPanel, ChatMessage, ChatInput
│   │   │   ├── activity/      # ActivityLog, ActivityItem
│   │   │   ├── settings/      # ProfileSettings, AppearanceSettings
│   │   │   └── layout/        # AppLayout, Sidebar, Header
│   │   ├── hooks/             # useAuth, useTasks, useChat, useActivity
│   │   ├── lib/               # supabaseClient.ts, api.ts
│   │   └── types/
│   └── package.json
├── server/                    # Node.js backend (Express)
│   ├── src/
│   │   ├── routes/            # tasks.ts, chat.ts, activity.ts, profile.ts
│   │   ├── services/
│   │   │   ├── ai-agent.ts        # Claude tool-use loop
│   │   │   ├── task-service.ts    # Task CRUD
│   │   │   ├── email-service.ts   # Gmail API + Microsoft Graph
│   │   │   ├── calendar-service.ts # Google Calendar + Outlook Calendar
│   │   │   ├── search-service.ts  # Tavily web search
│   │   │   ├── weather-service.ts # OpenWeatherMap API
│   │   │   ├── export-service.ts  # CSV/markdown export
│   │   │   ├── scheduler.ts       # Proactive task execution + recurring tasks (node-cron)
│   │   │   └── supabase.ts
│   │   ├── tools/             # AI agent tool definitions
│   │   └── middleware/        # auth.ts (JWT verification)
│   └── package.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── .env.example
```

## Database Schema (Supabase)

**`profiles`** — extends Supabase auth.users (auto-created via trigger)
- id (UUID, FK to auth.users), email, full_name, avatar_url
- display_name (text — user-customizable name)
- custom_avatar_url (text — user-uploaded or chosen avatar)
- theme (text — 'light'/'dark'/'system')
- accent_color (text — user's preferred accent color hex)
- timezone (text — for correct scheduled task execution)
- provider (google/azure/email — which OAuth they used)
- provider_token, provider_refresh_token (for Gmail/Graph/Calendar API calls)
- created_at, updated_at

**`categories`** — task groupings
- id, user_id, name, color, icon, created_at

**`tasks`** — core to-do items
- id, user_id, category_id, parent_task_id (for subtasks)
- title, description, status (todo/in_progress/done), priority (low/medium/high/urgent)
- due_date (TIMESTAMPTZ — includes time for scheduled execution)
- position (drag-and-drop ordering)
- is_automatable (bool) — can the agent auto-execute this?
- auto_execute_at (TIMESTAMPTZ) — when should the agent auto-execute if not done?
- ai_generated (bool), ai_result (text — AI-produced content)
- action_type (enum: null/email/calendar_event/research/document/reminder/recurring)
- action_metadata (JSONB — e.g., {to: "dan@email.com", subject: "..."} for emails)
- recurrence_pattern (text — e.g., "daily", "weekly:mon,wed,fri", "monthly:15")
- completed_at, completed_by (user/agent), created_at, updated_at

**`chat_messages`** — AI conversation history
- id, user_id, role (user/assistant), content, tool_calls (JSONB), created_at

**`agent_activity`** — log of everything the agent did autonomously
- id, user_id, task_id (FK), action_type, description, result, created_at

All tables have Row Level Security: users only access their own data.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PATCH/DELETE | `/api/tasks` | Task CRUD |
| PATCH | `/api/tasks/:id/complete` | Mark complete |
| PATCH | `/api/tasks/reorder` | Batch position update (drag-and-drop) |
| GET/POST/PATCH/DELETE | `/api/categories` | Category CRUD |
| POST | `/api/chat` | Send message to AI agent (SSE streaming response) |
| GET/DELETE | `/api/chat/history` | Chat history |
| GET | `/api/activity` | Agent activity log (what the agent did today) |
| GET | `/api/activity/summary` | AI-generated daily summary |
| GET/PATCH | `/api/profile` | Get/update user profile (name, avatar, theme, timezone) |
| POST | `/api/profile/avatar` | Upload custom avatar |

All endpoints require Supabase JWT in Authorization header.

## AI Agent Architecture

### Interactive Mode (Chat)
When a user sends a chat message:
1. Server loads chat history + sends to Claude with tool definitions
2. Claude responds — if it calls tools, server executes them and loops back
3. Final text response streams to client via SSE
4. Tasks appear on the Kanban board in real-time (Supabase Realtime)

### Proactive Mode (Scheduler)
Background process (node-cron, runs every minute):
1. Query tasks where `auto_execute_at <= now()` AND `status != 'done'`
2. For each overdue automatable task, call the AI agent to execute it
3. Agent determines the right tool based on `action_type` and `action_metadata`
4. Log the action to `agent_activity` table
5. Mark task as completed with `completed_by = 'agent'`
6. Push real-time notification to user via Supabase Realtime

### Smart Autonomy Logic
When creating a task, the agent determines:
- **Auto-executable**: email, calendar event, research, document generation, reminders
- **Not auto-executable**: physical tasks (buy groceries), tasks requiring human judgment
- The agent sets `is_automatable`, `action_type`, `action_metadata`, and `auto_execute_at` accordingly
- User can override: toggle auto-execution on/off per task in the UI

### AI Tools (24 total)

**Task Management (7):**
- `list_tasks` — query tasks with filters
- `create_task` — add new tasks (with auto-execution metadata)
- `update_task` — modify task properties
- `complete_task` — mark done
- `delete_task` — remove tasks
- `create_category` — organize with categories
- `break_down_task` — split complex tasks into subtasks

**Real-World Actions (5):**
- `send_email` — send via Gmail API or Microsoft Graph (based on user's OAuth provider)
- `create_calendar_event` — create event via Google Calendar or Outlook Calendar API
- `web_search` — search the internet via Tavily API for real-time research
- `generate_document` — create text/markdown content and attach to task
- `summarize_url` — fetch a URL and summarize its content (uses web fetch + Claude)

**Scheduling & Reminders (3):**
- `set_reminder` — schedule a notification/alert for a specific time
- `create_recurring_task` — create a task that repeats (daily, weekly, monthly) with recurrence pattern
- `schedule_optimizer` — AI analyzes all tasks and suggests optimal ordering/scheduling for the day

**Productivity & Analytics (3):**
- `analyze_productivity` — analyze task completion patterns (completion rate, busiest days, avg time to complete) and return insights
- `suggest_tasks` — AI looks at existing tasks, calendar, and context to proactively suggest what to do next
- `get_daily_summary` — generate a summary of what the agent did today + what the user did + what's left

**Smart Planning (3):**
- `focus_mode` — "What should I focus on right now?" — AI picks the single most important task based on priority, due date, and context
- `estimate_time` — estimate how long each task will take and add time estimates to tasks
- `find_conflicts` — detect scheduling conflicts between tasks and calendar events

**Utility (3):**
- `translate_text` — translate text between languages (Claude handles natively)
- `check_weather` — check weather via OpenWeatherMap API (useful for outdoor task planning — "should I go for a run today?")
- `export_tasks` — export tasks as CSV or formatted markdown for sharing/reporting

Model: `claude-sonnet-4-20250514` (fast enough for chat, smart enough for tool-use).

## Auth Flow

1. Login/signup page with "Continue with Google", "Continue with Microsoft", "Continue with Yahoo", and regular email/password registration + login
2. OAuth via `supabase.auth.signInWithOAuth()` → redirects to `/auth/callback`
3. **Google OAuth scopes**: `gmail.send`, `calendar.events` (for email + calendar)
4. **Microsoft OAuth scopes**: `Mail.Send`, `Calendars.ReadWrite` (for email + calendar)
5. **Yahoo OAuth**: Basic profile + email access
6. Backend verifies JWT via `supabase.auth.getUser(token)` middleware
7. Store provider tokens in `profiles` table for API calls
8. Session auto-persisted by Supabase client

## Key Frontend Components

- **LoginPage** — Google/Microsoft/Yahoo OAuth buttons + email/password signup & login form, TaskPilot branding
- **AppLayout** — Header + collapsible Sidebar + main content
- **TaskBoard** — 3-column Kanban (To Do / In Progress / Done) with dnd-kit drag-and-drop
- **TaskCard** — Priority-colored border, due date, category badge, auto-pilot icon for automatable tasks, sparkle icon for AI results
- **TaskDetailModal** — Edit task + view subtasks + view AI result + toggle auto-execution
- **ChatPanel** — Slide-out right panel with message bubbles, typing indicator, SSE streaming
- **ActivityLog** — Panel/tab showing what the agent did (with timestamps and task links)
- **TaskStats** — Animated counters (total, completed, agent-completed, overdue)
- **ProfileSettings** — Edit display name, upload/choose avatar, select accent color, set timezone
- **AppearanceSettings** — Theme toggle (light/dark/system), accent color picker

## UI Polish (What Makes It Impressive)

- shadcn/ui + Tailwind for professional look out of the box
- Motion animations: card entrance, layout transitions, completion effect
- Drag-and-drop with ghost overlay and drop target highlighting
- Dark mode toggle with smooth transition
- Real-time sync: AI creates/completes a task → board updates instantly
- Auto-pilot icon on cards that the agent will handle
- Activity feed showing agent actions in real-time
- Skeleton loaders, toast notifications (sonner), keyboard shortcuts (Ctrl+K for AI chat)
- Toast notification when the agent auto-completes a task: "TaskPilot sent your email to Dan"

## Git & Deployment Workflow

### GitHub
- Initialize git repo + create GitHub remote at start of Sprint 1
- After each sprint: commit all changes, push to GitHub with tagged release
- Tags: `sprint-1`, `sprint-2`, `sprint-3`, `sprint-4`, `sprint-5`
- README.md updated after each sprint with: what was built, setup instructions, environment variables needed

### Vercel Deployment
- **Frontend (client/)**: Deploy on Vercel — auto-deploys from `main` branch on GitHub
  - Vite React app builds with `npm run build` in `client/`
  - Environment vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- **Backend (server/)**: Deploy on Vercel Serverless Functions OR Railway/Render
  - Option A: Restructure Express routes as Vercel serverless functions in `api/` folder
  - Option B: Deploy Express to Railway (free tier) — better for the scheduler (needs persistent process)
  - Recommendation: **Railway for backend** since node-cron scheduler needs a long-running process
  - Environment vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`, `OPENWEATHERMAP_API_KEY`

### README Structure
```
# TaskPilot
> AI-powered To Do app that doesn't just track tasks — it does them.

## Features (updated each sprint)
## Demo
## Getting Started
### Prerequisites
### Environment Variables
### Installation
### Running Locally
## Sprint Progress
- [x] Sprint 1: Foundation (auth, project setup)
- [ ] Sprint 2: Task Management (CRUD, Kanban board)
- ...
## Deployment
## Tech Stack
```

## Implementation Order (Sprints)

### Sprint 1: Foundation
- Initialize git repo + GitHub remote
- Initialize Vite + React + TypeScript client
- Initialize Express + TypeScript server
- Install all dependencies, set up shadcn/ui + Tailwind
- Run migration SQL in Supabase
- Build auth flow: LoginPage → OAuth → AuthCallback → ProtectedRoute
- Set up Express with auth middleware
- Write initial README with setup instructions
- Copy PLAN.md into project folder
- **Goal**: Can log in and see a blank dashboard
- **Git**: Commit, tag `sprint-1`, push to GitHub
- **Your Action Items (before/during Sprint 1):**
  1. Create a Supabase project at https://supabase.com → get Project URL + anon key + service role key
  2. Create a GitHub repo for TaskPilot
  3. Set up Google OAuth: Go to Google Cloud Console → create OAuth 2.0 credentials → add scopes (`gmail.send`, `calendar.events`) → copy Client ID + Secret
  4. Set up Microsoft OAuth: Go to Azure Entra ID → register app → add API permissions (`Mail.Send`, `Calendars.ReadWrite`) → copy Client ID + Secret
  5. Set up Yahoo OAuth: Go to Yahoo Developer → create app → copy Client ID + Secret
  6. In Supabase Dashboard → Authentication → Providers: enable Google, Azure (Microsoft), and Yahoo with the credentials from above
  7. Set redirect URL in all OAuth providers to: `http://localhost:5173/auth/callback`
  8. Run the migration SQL I provide in Supabase SQL Editor
  9. Create a `.env` file with all API keys (I'll provide the template)

### Sprint 2: Task Management + User Customization
- Backend: All task + category + profile CRUD endpoints with Zod validation
- Frontend: AppLayout, Header, Sidebar, TaskBoard, TaskCard, TaskForm
- Profile settings page (display name, avatar, appearance, timezone)
- Wire up with useTasks hook + Supabase real-time subscription
- Update README with Sprint 2 features
- **Goal**: Full task CRUD working on a styled Kanban board + user customization
- **Git**: Commit, tag `sprint-2`, push to GitHub
- **Your Action Items:**
  1. Enable Realtime on the `tasks` table in Supabase Dashboard → Database → Replication
  2. Enable Supabase Storage (for avatar uploads) → create a `avatars` bucket (public)

### Sprint 3: Drag-and-Drop + Polish
- Integrate dnd-kit for drag-and-drop between/within columns
- Add Motion animations throughout
- TaskStats, priority colors, due date formatting, toasts, dark mode
- User's accent color applied throughout the UI
- Update README with Sprint 3 features
- **Goal**: Looks and feels impressive
- **Git**: Commit, tag `sprint-3`, push to GitHub
- **Your Action Items:** None — this sprint is all code

### Sprint 4: AI Agent (Interactive) + All 24 Tools
- Backend: ai-agent.ts with Claude tool-use loop + SSE streaming
- Build all 24 tool definitions and execution handlers
- Build email-service.ts (Gmail API + Microsoft Graph)
- Build calendar-service.ts (Google Calendar + Outlook)
- Build search-service.ts (Tavily API)
- Build weather-service.ts (OpenWeatherMap API)
- Build export-service.ts (CSV/markdown generation)
- Claude-native tools (translate, suggest, analyze, focus, estimate, conflicts) need no external service
- Frontend: ChatPanel, ChatMessages, ChatInput with SSE client + typing indicator
- Update README with Sprint 4 features + all agent capabilities
- **Goal**: Can chat with AI, it manages tasks and executes all 24 tool types
- **Git**: Commit, tag `sprint-4`, push to GitHub
- **Your Action Items (before Sprint 4):**
  1. Get an Anthropic API key at https://console.anthropic.com → add to `.env` as `ANTHROPIC_API_KEY`
  2. Get a Tavily API key at https://tavily.com (free tier) → add to `.env` as `TAVILY_API_KEY`
  3. Get an OpenWeatherMap API key at https://openweathermap.org/api (free tier) → add to `.env` as `OPENWEATHERMAP_API_KEY`
  4. Enable Google Calendar API in Google Cloud Console (same project as OAuth)
  5. Enable Gmail API in Google Cloud Console (same project as OAuth)

### Sprint 5: Proactive Agent + Activity Log + Deployment
- Build scheduler.ts with node-cron:
  - Auto-execute overdue automatable tasks
  - Create next instances of recurring tasks
  - Send reminders at scheduled times
- Build agent_activity logging for all autonomous actions
- Frontend: ActivityLog panel, auto-pilot indicators on TaskCards
- TaskDetailModal: AI result panel + auto-execution toggle + recurring task settings
- Productivity dashboard (analyze_productivity visualization)
- Toast notifications for agent actions
- Daily summary endpoint
- Onboarding (seed default categories), empty states, keyboard shortcuts
- Bug fixes, test all auth flows (Google, Microsoft, Yahoo, email)
- Set up Vercel deployment (frontend) + Railway deployment (backend)
- Final README with full setup, deployment, and demo instructions
- **Goal**: Demo-ready — deployed, agent proactively completes tasks, reports what it did
- **Git**: Commit, tag `sprint-5`, push to GitHub
- **Your Action Items:**
  1. Connect GitHub repo to Vercel at https://vercel.com → import project → set root directory to `client/`
  2. Add environment variables in Vercel dashboard (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL)
  3. Deploy backend to Railway at https://railway.app → connect GitHub repo → set root directory to `server/`
  4. Add environment variables in Railway (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, TAVILY_API_KEY, OPENWEATHERMAP_API_KEY)
  5. Update Supabase OAuth redirect URLs to include the production Vercel URL
  6. Update CORS settings in Express to allow the Vercel domain

## Verification
- Test all 4 auth methods (Google, Microsoft, Yahoo, email)
- Create/edit/delete/complete tasks manually
- Drag tasks between columns
- **Task management tools**: add a task, list tasks, prioritize tasks, break down a task
- **Email**: "Email Dan at dan@email.com at 5 PM about the meeting" → auto-sends at 5 PM
- **Calendar**: "Create a team standup tomorrow at 9 AM" → verify event created
- **Web search**: "Research the best React libraries" → verify real search results attached
- **URL summary**: "Summarize this article: [url]" → verify content fetched and summarized
- **Weather**: "Should I go for a run today?" → verify weather data used
- **Translate**: "Translate my meeting notes to Spanish" → verify translation
- **Recurring**: "Remind me to exercise every Monday and Wednesday" → verify recurring task
- **Schedule optimizer**: "Organize my day" → verify AI reschedules tasks
- **Productivity**: "How productive was I this week?" → verify analytics
- **Export**: "Export my tasks as CSV" → verify downloadable file
- **Daily summary**: "What did you do today?" → verify comprehensive report
- **Proactive execution**: Wait for scheduled time → verify agent auto-executes and logs
- Verify real-time: agent completes a task → Kanban board updates + toast appears
- Test dark mode toggle
- Check RLS prevents accessing other users' data
