# TaskPilot

> AI-powered To Do app that doesn't just track tasks — it does them.

TaskPilot is an intelligent task management app with an AI agent powered by Claude. The agent can manage your tasks, send emails, create calendar events, do research, and proactively complete tasks you might miss.

## Features

### Sprint 1: Foundation (Current)
- Google, Microsoft, Yahoo OAuth login
- Email/password registration and login
- Supabase authentication with Row Level Security
- Express API server with JWT verification
- Project scaffolding with React + TypeScript + Vite

### Upcoming
- Sprint 2: Task Management (Kanban board, CRUD, categories, user customization)
- Sprint 3: Drag-and-Drop + Polish (animations, dark mode, visual polish)
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
| UI/UX | Motion (animations), dnd-kit (drag-and-drop), Lucide icons |

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
- [ ] Sprint 2: Task Management (CRUD, Kanban board)
- [ ] Sprint 3: Drag-and-Drop + Polish
- [ ] Sprint 4: AI Agent (24 tools)
- [ ] Sprint 5: Proactive Agent + Deployment

## License

MIT
