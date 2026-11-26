# Applied

**A job application tracker for people who don't want to live in a spreadsheet.**

Save a job with just a company and a role, then fill in the rest whenever you like. Move applications through a kanban pipeline, switch to a table when you want detail, and see your search at a glance on the dashboard.

![CI](https://github.com/LyraCS/applied/actions/workflows/ci.yml/badge.svg)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white)

**Live URL:** _pending the first Vercel deploy; this line will hold the public URL._

> Build status: **Phase 9 of 9** — the full app, 19 tests, CI, demo seed, deploy configs and final docs are done. Only publishing to Vercel/Render remains; the live URL is not provided yet.

## Quick start (target: 5 steps)

1. `git clone https://github.com/LyraCS/applied.git && cd applied && npm install`
2. Copy `apps/api/.env.example` to `apps/api/.env` and fill in your Neon **dev branch** URLs and a random `JWT_SECRET`.
3. `npm run generate && npm run migrate`
4. `npm run seed` — creates the public demo user and 10 sample applications; safe to rerun.
5. `npm run dev:api` in one terminal and `npm run dev:web` in another → http://localhost:5173

**Demo login:** `demo@applied.example` / `demo-password-123`. This account is **intentionally public** on the deployed demo — anyone can sign in and change its sample data. Do not put real personal information in it. The local seed recreates the same 10 applications on every run.

## Resume bullets

- **Built** a full-stack job tracker with React 18, TypeScript, Express 4, Prisma 7 and Neon Postgres, delivering kanban/table views, dashboard stats and a seeded demo spanning all five application statuses.
- **Secured** user data with httpOnly JWT cookies and shared Zod schemas, scoping every query by user ID and returning identical 404s for missing and cross-user rows.
- **Tested** the stack with 19 Vitest, Supertest and React Testing Library tests, then wired GitHub Actions to run migrations, typecheck, lint, tests and build on every push and PR.
- **Prepared** Vercel and Render deployment with a same-origin `/api` rewrite, `migrate deploy` on boot, `/api/health` checks and a scheduled warm-up workflow for Render's free-tier cold starts.

## 30-second pitch

I built Applied because job searches are easier to lose than to manage. It's a full-stack tracker where you save a company and role in seconds, then move applications through a kanban board or inspect them in a table. React and Vite handle the UI, Express and Prisma talk to Postgres on Neon, and one shared Zod schema keeps the form and API in agreement. Auth uses an httpOnly JWT cookie, every query is scoped to the signed-in user, and 19 tests plus GitHub Actions check the whole path. Render and Vercel configs are ready; the last step is publishing the live URL.

## What I'd improve next

- **Redis-backed rate limiting** — move the 10-strike counter out of process memory so it works across instances and survives restarts. This is the first priority because the current counter is per-process.
- **Status history timeline** — record each SAVED → APPLIED → INTERVIEW move so a job's journey is visible instead of only its current column.
- **Drag-and-drop with keyboard parity** — add pointer dragging only if the existing `<select>` remains as a first-class, accessible control.
- **Refresh tokens** — shorten access-token life without forcing a logout every seven days, and make revocation possible.

## Documentation

| Document | What's in it |
|---|---|
| [docs/STACK.md](docs/STACK.md) | Every technology, why it was chosen, alternatives considered |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, folder map, end-to-end request flow, auth flow |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, ER diagram, modelling decisions |
| [docs/API.md](docs/API.md) | Endpoint contract, error format, auth rules |
| [docs/BUILD_LOG.md](docs/BUILD_LOG.md) | Chronological build record, commands, problems and fixes |
| [docs/HOW_TO.md](docs/HOW_TO.md) | Local setup, testing, migrations, deploy checklist and an add-a-field checklist |

## Principles

- Forgiving input: only company and position are required; salary is free text.
- One user's data is never visible to another — every query is scoped by the logged-in user's ID.
- Validation lives in `packages/shared`, so browser and server enforce the same rules.
- No secrets in git; `.env.example` files document every variable.
