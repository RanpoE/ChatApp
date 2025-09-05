# ChatApp — Local Development Guide

Modern chat app with Next.js (frontend) and Express + Prisma + PostgreSQL (backend). This guide shows how to run it locally, configure hosts/ports, and where to change the API base URL. The API for the live demo may take some time booting up please visit it first before interacting with the App 😅.

## Live Demo
- App: https://chat-app-zc6x.vercel.app/
- API: https://chatapp-4ugy.onrender.com/

Replace these with your deployment URLs. Frontend consumes the API via `NEXT_PUBLIC_API_BASE_URL` (see details below).

## Stack
- Frontend: Next.js 15, TypeScript, Tailwind, Redux Toolkit, TanStack Query
- Backend: Express 5, Prisma, PostgreSQL, JWT auth
- Optional: OpenAI API for assistant replies (falls back to echo in dev)

## Repository
Clone the repository:

```
git clone https://github.com/your-org/chatapp.
cd ChatApp
```

## Quick Start (with Docker Compose)

Requirements:
- Docker + Docker Compose

Commands:
```
docker-compose up --build
```

What it does:
- Spins up Postgres, backend (port 3001), frontend (port 3000)
- Installs deps inside containers
- Runs Prisma migrations or pushes schema on first start

Open:
- Frontend: http://localhost:3000
- API: http://localhost:3001

Environment used in Compose (edit to customize):
- Backend: `PORT=3001`, `DATABASE_URL=postgres://postgres:postgres@db:5432/chatapp`, `JWT_SECRET=trilliongame`, optional `CORS_ORIGIN`
- Frontend: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`

File to update: `docker-compose.yml:1`

## Quick Start (local without Docker)

Requirements:
- Node.js 20.x (backend requires >=18 <21; 20.x recommended)
- PostgreSQL 14+ running locally

### 1) Database
Create a database and set `DATABASE_URL`, e.g.:

```
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/chatapp"
createdb chatapp # or use your DB admin tool
```

### 2) Backend

```
cd backend
npm install
npx prisma generate
# Apply schema (choose one):
npx prisma migrate dev --name init   # creates a migration and applies it
# or
npx prisma db push                   # pushes schema without creating a migration

# Set env (example):
export PORT=3001
export JWT_SECRET=trilliongame
export CORS_ORIGIN=http://localhost:3000
# Optional for real LLM replies:
# export OPENAI_API_KEY=sk-...
# export OPENAI_MODEL=gpt-4o-mini

npm run dev
```

Server runs on http://localhost:3001

### 3) Frontend

```
cd frontend
npm install
# Point frontend to backend (recommended via env):
export NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
npm run dev
```

App runs on http://localhost:3000

## Where to Change Hosting / URLs

- Frontend API Base URL:
  - Preferred: set `NEXT_PUBLIC_API_BASE_URL` in your env (dev, build, or deploy).
  - Code default: `frontend/src/lib/api.ts:3` — update the fallback default if needed.

- Backend CORS Allowed Origins:
  - Env: `CORS_ORIGIN` supports a single origin or comma-separated list (e.g. `http://localhost:3000,https://yourdomain.com`).
  - Code reference: `backend/src/server.ts:16`

- Ports:
  - Backend: `PORT` (default 3001) — `backend/src/server.ts:12`
  - Frontend: `PORT` (Next dev, default 3000). With Docker Compose, see `docker-compose.yml:1`.

## Environment Variables (summary)

Backend:
- `PORT` — HTTP port (default 3001)
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — secret key for JWT
- `CORS_ORIGIN` — allowed origins for CORS (single or comma-separated)
- `OPENAI_API_KEY` — optional; enables real model calls
- `OPENAI_MODEL` — optional; defaults to `gpt-4o-mini`

Frontend:
- `NEXT_PUBLIC_API_BASE_URL` — base URL for API (used at build/runtime)

## Useful Commands

Backend (`backend/package.json`):
- `npm run dev` — watch mode (ts-node-dev)
- `npm run build` — compile TypeScript
- `npm start` — run compiled build

Frontend (`frontend/package.json`):
- `npm run dev` — Next.js dev server
- `npm run build` — Next.js build
- `npm start` — Next.js start (serve build)

## Notes
- If `OPENAI_API_KEY` is not set, the backend returns an echo-like assistant response for local testing.
- With Docker Compose, the backend waits for Postgres, applies migrations/push, then starts in dev mode.
- Backend Node engine is `>=18 <21` — use Node 20.x locally to match Docker images.
