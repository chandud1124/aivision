# Local environment setup

This project uses Vite and reads environment variables with the `VITE_` prefix (via `import.meta.env`).

Create a file named `.env` at the project root with the following variables (replace the placeholder values):

# This project now uses a local auth server by default.
If you have any hosted services you still want to use, add their env vars here. For local development the frontend talks to a local auth server at http://localhost:8000 by default.

Notes:
- Do NOT commit `.env` to the repository. This repo already ignores `.env` via `.gitignore`.
- For production, configure these environment variables in your hosting provider (Vercel, Netlify, Cloud Run, etc.), not in a file in the repo.
 
Local auth server
-----------------
This repository now includes a local auth server at `server/` that uses PostgreSQL (via `pg`) for user storage and issues JWT access tokens + refresh tokens.

1. Copy `server/.env.example` to `server/.env` and (optionally) change `JWT_SECRET`, `DATABASE_URL`, and seed admin credentials.
2. From the project root:

```bash
cd server
npm install
npm run start:dev
```

Endpoints provided (auth):
- POST /api/v1/auth/login  { username|email, password } -> returns { access_token, refresh_token, user } (refresh token is also set as an httpOnly cookie)
- POST /api/v1/auth/register { email, password, full_name?, role? } -> registers and returns tokens
- POST /api/v1/auth/refresh -> reads refresh token from httpOnly cookie (or body/header) and returns a new access token
- GET /api/health -> health check

Default seeded admin credentials (created on first server start):
- email: `admin@campus.edu`
- password: `Admin@123456`

Notes:
- The server now persists users and refresh tokens in Postgres. The previous JSON-store implementation was replaced for production-like local development.
- For production, ensure `JWT_SECRET` is a strong secret and the app is served over HTTPS so secure cookies are transmitted.

Running locally

1. Install dependencies (choose one):

```bash
npm install
# or
pnpm install
# or
bun install
```

2. Start the dev server:

```bash
npm run dev
```

If you want, I can try installing dependencies and starting the dev server here. Tell me which package manager you prefer (npm/pnpm/bun) and confirm you want me to run the install + dev steps now.
