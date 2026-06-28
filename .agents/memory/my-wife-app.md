---
name: My Wife app stack
description: Key decisions and sharp edges for the "My Wife" AI companion chat app.
---

# My Wife App

## Key facts

- Frontend: `artifacts/my-wife` (React + Vite), port 19818, served at root `/`
- API: `artifacts/api-server` (Express 5), port 8080, all routes under `/api`
- DB: PostgreSQL via Drizzle ORM; two tables: `messages`, `user_memory`
- AI-generated photos stored in `artifacts/my-wife/public/her/` — served at `{BASE_URL}her/{file}`

## Profile photo
- Uses AI-generated image: `public/her/wedding-2.png` (garden wedding shot, consistent face)
- All gallery AI photos are in `public/her/` (wedding-1..4, church-1..3, party-1..3)

## Chat engine
- Pure rule-based + generative templates (no AI API calls)
- Persistent memory in `user_memory` table (key-value): user_name, user_job, user_birthday, anniversary, user_location, user_likes, user_fav_food, how_we_met, last_mood
- Memory loaded on every request; facts extracted from each user message
- She always knows she's his wife; never forgets his name once told

## xAI / OpenAI key situation
- OPENAI_API_KEY env var is an xAI key with no credits — cannot use for chat
- Image generation uses Replit's `generateImage` tool (limit: 10 images per run)
- Free tier image gen limit was hit at 10 images; second batch failed

## Gallery
- 8 tabs: Wedding (4 AI), Church (3 AI), Party (3 AI + 2 Unsplash), Club (5), School (5), Daily (8), Glam (6), Videos (6)
- AI photos: same woman face across wedding/church/party
- Videos use Pexels CDN URLs (may vary); poster is always an AI-generated photo

**Why rule-based chat:** No working AI API credits available; rule-based engine is fast, free, and highly controllable for the romantic companion use case.
