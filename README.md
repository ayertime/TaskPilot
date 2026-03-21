# TaskPilot

> AI-powered To Do app that doesn't just track tasks — it does them.

TaskPilot is an intelligent task management app with an AI agent powered by Claude. The agent can manage your tasks, send emails, create calendar events, do research, and proactively complete tasks you might miss.

## Features

### Sprint 1: Foundation
- Google, Microsoft, Yahoo OAuth login
- Email/password registration and login
- Supabase authentication with Row Level Security
- Express API server with JWT verification
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

### Sprint 3: Drag-and-Drop + Polish (Current)
- Drag-and-drop task cards between columns and within columns (dnd-kit)
- Drag overlay with rotation effect and drop target highlighting
- TaskStats bar with animated counters (total, in progress, completed, overdue)
- Motion-animated column entrances and header transitions
- User accent color applied globally (buttons, links, focus rings)
- Overdue task background highlighting
- Dark mode visual polish throughout

### Upcoming
- Sprint 4: AI Agent (24 tools — email, calendar, web search, weather, and more)
- Sprint 5: Proactive Agent (auto-executes tasks, activity log, deployment)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, shadcn/ui, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (Anthropic) with tool-use |
| Auth | Supabase Auth (Google, Microsoft, Yahoo, email/password) |
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
- [ ] Sprint 4: AI Agent (24 tools)
- [ ] Sprint 5: Proactive Agent + Deployment

## License

MIT
