# TypeScript + Express Starter (Backend)

A minimal Express server written in TypeScript with fast dev workflow.

## Scripts

- `npm run dev`: Start dev server with live reload (ts-node-dev)
- `npm run build`: Compile TypeScript to `dist/`
- `npm start`: Run compiled server from `dist/`
- `npm run clean`: Remove `dist/`

## Getting Started

1. Install dependencies: `npm install`
2. Start in development: `npm run dev`
3. Build for production: `npm run build`
4. Run production build: `npm start`

Run all commands from this `backend/` folder.

## Configuration

- Port: set via `PORT` env var (default `3000`). Example:
  - `PORT=4000 npm run dev`

## API

- `GET /`: Hello message
- `GET /health`: Simple health check JSON

## Project Structure

```
backend/
├── src/
│   └── server.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

## Notes

- Uses `esModuleInterop` to allow `import express from 'express'` in CommonJS.
- Type checking and strict mode are enabled via `tsconfig.json`.
