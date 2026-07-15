# My Wife — AI Companion App

A chat app featuring Mia Santos, a Filipino-American virtual wife powered by Mistral AI.

## Stack

- **Frontend**: React + Vite (`artifacts/my-wife`) — served at `/`
- **API**: Express + TypeScript (`artifacts/api-server`) — served at `/api`
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **AI**: Mistral AI (`mistral-large-latest`) via OpenAI-compatible SDK
- **Photo picker**: Mistral AI (`mistral-small-latest`) classifies scene and selects matching photo

## Running the app

Both services start automatically via configured workflows.

| Service | Workflow | Port |
|---------|----------|------|
| Frontend | `artifacts/my-wife: web` | 19818 |
| API | `artifacts/api-server: API Server` | 8080 |

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `MISTRAL_API_KEY` | Mistral AI for chat responses and photo selection |
| `SESSION_SECRET` | Session signing |
| `DATABASE_URL` | Auto-provisioned by Replit |

## Key Features

- **Real AI chat** — Mia responds using Mistral AI with full persona/backstory
- **Photo requests** — Camera button lets you describe a scene; Mistral picks the best matching photo
- **Persistent memory** — Remembers your name, job, mood across sessions
- **Daily check-in** — Proactive messages from Mia
- **Gallery** — Photo and video gallery organized by category

## Architecture Notes

- AI engine: `artifacts/api-server/src/routes/chat/engine.ts`
- Character backstory: `artifacts/api-server/src/routes/chat/backstory.ts`
- Photo messages stored as `[IMAGE:path] caption` in DB, parsed by frontend `Bubble` component
- Photos live in `artifacts/my-wife/public/her/`

## User Preferences

- Uses Mistral AI for all AI features
