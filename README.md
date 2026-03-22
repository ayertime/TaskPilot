# TaskPilot

> AI-powered To Do app that doesn't just track tasks — it does them.

TaskPilot is an intelligent task management app with an AI agent powered by Claude. The agent can manage your tasks, send emails, create calendar events, do research, and proactively complete tasks you might miss.

## Features

### Sprint 1: Foundation
- Google, Microsoft, Yahoo OAuth login
- Email/password registration and login
- Supabase authentication with Row Level Security
- Fastify API server with JWT verification
- Project scaffolding with React + TypeScript + Vite

### Sprint 2: Task Management + User Customization
- 3-column Kanban board (To Do / In Progress / Done)
- Full task CRUD with Zod-validated API endpoints
- Task cards with priority colors, due dates, category badges, and auto-pilot indicators
- Category management (create, delete) with color-coded sidebar
- Profile settings page (display name, theme, accent color, timezone)
- Dark mode toggle with instant theme switching
- Sidebar navigation with task and settings views
- Supabase Realtime subscription for live task updates
- Toast notifications for all actions (sonner)
- Overdue task highlighting

### Sprint 3: Drag-and-Drop + Polish
- Drag-and-drop task cards between columns and within columns (dnd-kit)
- Drag overlay with rotation effect and drop target highlighting
- TaskStats bar with animated counters (total, in progress, completed, overdue)
- Motion-animated column entrances and header transitions
- User accent color applied globally (buttons, links, focus rings)
- Overdue task background highlighting
- Dark mode visual polish throughout

### Sprint 4: AI Agent
- AI agent powered by Claude with 24 tools and tool-use loop
- Chat panel (slide-out) with SSE streaming responses
- Keyboard shortcut (Ctrl+K) to open AI chat
- **Task Management tools**: list, create, update, complete, delete tasks + create categories + break down tasks into subtasks
- **Email**: send emails via Gmail API or Microsoft Graph (requires connected OAuth account)
- **Calendar**: create events via Google Calendar or Outlook Calendar API
- **Web Search**: real-time internet search via Tavily API
- **Document Generation**: AI-generated reports/summaries attached to tasks
- **URL Summarization**: fetch and summarize any web page
- **Reminders**: set timed reminders on tasks
- **Recurring Tasks**: create tasks with daily/weekly/monthly recurrence patterns
- **Schedule Optimizer**: AI analyzes tasks and suggests optimal daily ordering
- **Productivity Analytics**: completion rate, busiest days, agent vs user stats
- **Task Suggestions**: AI proactively suggests what to work on next
- **Daily Summary**: comprehensive report of what was accomplished
- **Focus Mode**: AI picks the single most important task right now
- **Time Estimates**: AI estimates duration for each task
- **Conflict Detection**: find scheduling overlaps between tasks
- **Translation**: translate text between languages
- **Weather**: check weather for outdoor task planning (OpenWeatherMap)
- **Export**: export tasks as CSV or formatted markdown
- Activity logging for all agent actions

### Sprint 5: Proactive Agent + Activity Log (Current)
- **Proactive task execution**: node-cron scheduler runs every minute, auto-executes overdue automatable tasks
- **Recurring task generation**: automatically creates next instances of recurring tasks (daily, weekly, monthly)
- **Activity Log page**: full history of everything TaskPilot has done, grouped by date
- **Activity Log sidebar navigation**: quick access to agent activity from the sidebar
- **TaskDetailModal**: click any task card to view details, AI results, subtasks, and auto-pilot settings
  - **Details tab**: description, due date, recurrence, completion info, auto-pilot toggle with scheduled time
  - **AI Result tab**: view AI-generated content (research, documents) attached to tasks
  - **Subtasks tab**: view subtasks created by the AI agent's break_down_task tool
- **Auto-pilot toggle**: enable/disable auto-execution per task with scheduled time picker
- **Real-time toast notifications**: instant notification when TaskPilot auto-completes a task
- **Expanded activity logging**: agent actions for task creation, completion, web search, recurring tasks, and auto-execution are all logged
- **Sparkle indicator**: AI-generated content badge on task cards
- **Onboarding**: automatic default categories (Work, Personal, Health, Learning) for new users

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, shadcn/ui, Tailwind CSS v4, TanStack Query |
| Backend | Node.js, Fastify, TypeScript |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (Anthropic) with tool-use (24 tools) |
| Auth | Supabase Auth (Google, Microsoft, Yahoo, email/password) |
| Search | Tavily API (web search) |
| Weather | OpenWeatherMap API |
| Scheduler | node-cron (proactive task execution) |
| UI/UX | motion (animations), @dnd-kit (drag-and-drop), Lucide icons |

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- OAuth credentials for Google, Microsoft, and/or Yahoo (optional for dev)

### Environment Variables

Copy the example env files and fill in your values:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

**Client (.env):**
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `VITE_API_URL` — API server URL (default: `http://localhost:3001`)

**Server (.env):**
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Your Supabase service role key (from Settings > API)
- `ANTHROPIC_API_KEY` — Your Anthropic API key (for Claude AI agent)
- `TAVILY_API_KEY` — Your Tavily API key (for web search, optional)
- `OPENWEATHERMAP_API_KEY` — Your OpenWeatherMap API key (for weather, optional)

### Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Configure OAuth providers in Authentication > Providers (Google, Microsoft, Yahoo)

### Installation

```bash
# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Running Locally

```bash
# Terminal 1: Start the API server
cd server && npm run dev

# Terminal 2: Start the frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Sprint Progress
- [x] Sprint 1: Foundation (auth, project setup)
- [x] Sprint 2: Task Management + User Customization (Kanban board, CRUD, categories, profile settings)
- [x] Sprint 3: Drag-and-Drop + Polish (dnd-kit, motion animations, accent color, TaskStats)
- [x] Sprint 4: AI Agent (24 tools, chat panel, SSE streaming)
- [x] Sprint 5: Proactive Agent + Activity Log (scheduler, activity UI, task detail modal, onboarding)

## License

MIT
