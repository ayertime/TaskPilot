# TaskPilot

> AI-powered task management that doesn't just track tasks — it does them.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Claude AI](https://img.shields.io/badge/Claude-Haiku_4.5-D97706?logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)

TaskPilot is an intelligent task management app with an autonomous AI agent powered by Claude. The agent manages your tasks, sends emails, creates calendar events, performs web research, generates documents, and proactively completes tasks on a schedule — so you never miss a deadline.

---

## Key Features

- **Autonomous AI Agent** — 26 tools including email, calendar, web search, document generation, and more
- **Kanban Board** — Drag-and-drop task management with three columns (To Do, In Progress, Done)
- **Auto-Pilot Mode** — Schedule tasks for automatic execution; the agent handles them without intervention
- **Gmail & Calendar Integration** — Read inbox, send emails, and create events via Google OAuth
- **Smart Sync** — Automatically checks your email and calendar for actionable items on a configurable interval
- **Browser Notifications** — Get notified when the agent completes tasks in the background
- **Installable PWA** — Install on any device for a native app experience
- **Dark Mode** — Full dark theme with system preference detection
- **Interactive Tutorial** — Animated walkthrough for new users using real app content

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui |
| State | TanStack React Query v5, Supabase Realtime |
| Drag & Drop | @dnd-kit with sortable lists |
| Animations | Motion (Framer Motion) |
| Backend | Node.js, Fastify 5, TypeScript |
| Database | Supabase (PostgreSQL) with Row Level Security |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Scheduling | node-cron (1-minute intervals) |
| Validation | Zod (shared client/server schemas) |

### External APIs

| Service | Purpose |
|---------|---------|
| Anthropic Claude | AI agent reasoning and tool use |
| Tavily | Real-time web search (1,000/month free) |
| OpenWeatherMap | Weather data for outdoor task planning |
| Gmail API | Send and read emails via Google OAuth |
| Google Calendar API | Create and read calendar events |

---

## AI Agent Tools

<details>
<summary><strong>26 tools across 6 categories</strong> (click to expand)</summary>

### Task Management (7)
| Tool | Description |
|------|-------------|
| `list_tasks` | Query tasks with filters (status, priority, category) |
| `create_task` | Create tasks with full metadata and automation settings |
| `update_task` | Partial updates to any task field |
| `complete_task` | Mark done with `completed_by='agent'` attribution |
| `delete_task` | Remove tasks permanently |
| `create_category` | Add categories with color and icon |
| `break_down_task` | Decompose complex tasks into subtasks |

### Real-World Actions (7)
| Tool | Description |
|------|-------------|
| `read_emails` | Read Gmail inbox, filter unread, create tasks from actionable emails |
| `read_calendar` | Read upcoming events, find free time, create prep tasks |
| `send_email` | Send via Gmail (supports to, cc, bcc) |
| `create_calendar_event` | Create events in Google Calendar |
| `web_search` | Real-time search via Tavily (up to 10 results) |
| `generate_document` | AI-generated reports and summaries in markdown |
| `summarize_url` | Fetch and summarize any web page |

### Scheduling (3)
| Tool | Description |
|------|-------------|
| `set_reminder` | Schedule agent execution time on tasks |
| `create_recurring_task` | Daily, weekly (with day selection), monthly patterns |
| `schedule_optimizer` | Analyze and suggest optimal task ordering |

### Productivity (3)
| Tool | Description |
|------|-------------|
| `analyze_productivity` | Completion stats over configurable date range |
| `suggest_tasks` | AI recommendations for what to work on next |
| `get_daily_summary` | Report of completions and pending work |

### Smart Planning (3)
| Tool | Description |
|------|-------------|
| `focus_mode` | Identify the single most important task right now |
| `estimate_time` | Duration estimates based on task complexity |
| `find_conflicts` | Detect scheduling overlaps |

### Utility (3)
| Tool | Description |
|------|-------------|
| `translate_text` | Translate between languages (auto-detect source) |
| `check_weather` | Current weather via OpenWeatherMap |
| `export_tasks` | Export to CSV or markdown with filters |

</details>

---

## How It Works

1. **Create a Task** — Add tasks with a title, priority, due date, category, and optional agent action (email, calendar event, research, document, reminder)
2. **Enable Auto-Pilot** — Toggle auto-pilot and set a scheduled time. The agent will execute the action automatically when the time comes.
3. **Agent Executes** — The proactive scheduler (runs every 60s) picks up due tasks, calls the AI agent, executes the action, and marks it complete. You get a notification.

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com/) for the AI agent
- Google OAuth credentials (optional, for email/calendar)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/taskpilot.git
cd taskpilot

# Install client
cd client && npm install

# Install server
cd ../server && npm install
```

### 2. Environment Variables

**Client** (`client/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
```

**Server** (`server/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key          # optional
OPENWEATHERMAP_API_KEY=your_owm_key     # optional
GOOGLE_CLIENT_ID=your_google_client_id  # optional, for token refresh
GOOGLE_CLIENT_SECRET=your_google_secret # optional, for token refresh
```

### 3. Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in SQL Editor: `supabase/migrations/001_initial_schema.sql`
3. Enable Google OAuth in Authentication > Providers (optional)

### 4. Run

```bash
# Terminal 1: API server
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

---

## Project Structure

```
taskpilot/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components (dashboard, chat, settings, onboarding)
│   │   ├── hooks/           # Custom hooks (useTasks, useProfile, useAuth, useCategories)
│   │   ├── lib/             # Utilities (api, supabase, theme, notifications)
│   │   └── types/           # Shared TypeScript types
│   └── index.html
├── server/                  # Fastify backend
│   └── src/
│       ├── routes/          # API route handlers
│       └── services/        # AI agent, scheduler, external APIs
├── shared/                  # Shared types and utilities
├── supabase/                # Database migrations
└── PRD.md                   # Full product requirements document
```

---

## Sprint History

| Sprint | Focus |
|--------|-------|
| 1 | Foundation — project setup, Supabase schema, authentication |
| 2 | Task management — Kanban board, CRUD, categories, profile settings |
| 3 | Polish — drag-and-drop, animations, TaskStats, accent color |
| 4 | AI agent — 24 tools, chat panel, SSE streaming |
| 5 | Proactive agent — scheduler, activity log, task detail modal, onboarding |
| 6 | Integrations — Google OAuth, Gmail/Calendar, Smart Sync, token refresh, welcome-back modal |
| 7 | UI polish — tinted neutrals, glassmorphism, list view, tutorial, chat cleanup, drag-and-drop fixes |
| 8 | Finishing touches — browser notifications, PWA, README |

---

## Deployment

| Component | Platform |
|-----------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Railway](https://railway.app) (persistent process for scheduler) |
| Database | [Supabase](https://supabase.com) (hosted PostgreSQL) |

---

## Author

**Philip Civitello**

---

## License

MIT
