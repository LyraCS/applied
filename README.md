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

**Live demo:** `https://<your-vercel-app>.vercel.app` _(replace this single placeholder with the URL Vercel prints after the first deploy)_

**Screenshots:** _placeholder — screens built in Phase 5; user review pending_

> Build status: **Phase 8 of 9** — auth, CRUD, stats, 19 tests, CI, demo seed and deploy configs are ready; the live URL still needs one edit after the first Vercel deploy.

## Quick start (target: 5 steps)

1. `git clone <repo-url> && cd applied && npm install`
2. Copy `apps/api/.env.example` to `apps/api/.env` and fill in your Neon **dev branch** URLs and a random `JWT_SECRET`.
3. `npm run generate && npm run migrate`
4. `npm run seed` — creates the public demo user and 10 sample applications; safe to rerun.
5. `npm run dev:api` in one terminal and `npm run dev:web` in another → http://localhost:5173

**Demo login:** `demo@applied.example` / `demo-password-123`. This account is **intentionally public** on the live site — anyone can sign in and change its sample data. Do not put real personal information in it. The local seed recreates the same 10 applications on every run.

## Documentation

| Document | What's in it |
|---|---|
| [docs/STACK.md](docs/STACK.md) | Every technology, why it was chosen, alternatives considered |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagrams, folder map, end-to-end request flow, auth flow |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, ER diagram, modelling decisions |
| [docs/API.md](docs/API.md) | Endpoint contract, error format, auth rules |
| [docs/BUILD_LOG.md](docs/BUILD_LOG.md) | Chronological build record, commands, problems and fixes |
| [docs/HOW_TO.md](docs/HOW_TO.md) | Local setup, testing, migrations, deploy, "add a field" walkthrough |
| [docs/INTERVIEW_NOTES.md](docs/INTERVIEW_NOTES.md) | How to explain each part, likely questions, trade-offs |

## Principles

- Forgiving input: only company and position are required; salary is free text.
- One user's data is never visible to another — every query is scoped by the logged-in user's ID.
- Validation lives in `packages/shared`, so browser and server enforce the same rules.
- No secrets in git; `.env.example` files document every variable.
