# How to

_Last updated: 2026-11-25 — Phase 9 accuracy pass. Every section below describes code that exists in the repo; deploy steps are pending the first Vercel release._

## Local setup from scratch

1. `git clone https://github.com/LyraCS/applied.git && cd applied`
2. `npm install` — one install for all workspaces.
3. Copy `apps/api/.env.example` to `apps/api/.env`; paste the pooled and direct URLs from a Neon **dev branch**, plus a random `JWT_SECRET` (`openssl rand -base64 48`).
4. `npm run generate && npm run migrate && npm run seed` — the seed creates the public demo account and is safe to rerun.
5. `npm run dev:api` in terminal 1 and `npm run dev:web` in terminal 2 → http://localhost:5173. Vite listens on all interfaces (`server.host: true`), so `127.0.0.1:5173` and the machine's LAN IP also work — needed by mobile viewers. Only run it on a trusted network.

## Log in and out

Register at http://localhost:5173/register (or use a previous account at `/login`). The app stores no token in JavaScript: the API sets an httpOnly cookie and `AuthContext` calls `/api/auth/me` on page load. Protected pages redirect to `/login` while logged out, and remember the original destination.

Rate limit: 10 auth attempts per 15 minutes per IP. If you hit 429 during testing, restart the API process to clear the in-memory counter.

## Applications API you can use today

All five application routes require the auth cookie:

- `GET /api/applications?q=acme&status=APPLIED&jobType=FULL_TIME&sort=company&order=asc`
- `GET /api/applications/:id`
- `POST /api/applications` with `{ "company": "Acme", "position": "Engineer" }`
- `PATCH /api/applications/:id` with any subset of fields
- `DELETE /api/applications/:id`
- `GET /api/stats` → `{ total, byStatus, appliedThisWeek }`

Only `company` and `position` are required; every other field is optional. Blank text becomes `null`. `sort` accepts only `appliedAt`, `createdAt` or `company`, and `order` only `asc`/`desc` — anything else is a 400. You own only what your cookie says: another user's ID returns 404 on read, update and delete. See [[API]] for the full contract.

## Using the web app

- `/` — dashboard: total/applied-this-week/interview/offer counts and the five most recently added applications.
- `/applications` — board grouped by status; switch to **table** for a wide view. Search is debounced 250 ms; filter by status or job type, choose a sort field and direction, then **Clear filters**. The `<select>` on each card patches the status in place (no drag-and-drop).
- `/applications/new` — only company and position are required; a blank date and blank text become `null`. Errors appear inline on blur and in a focusable summary after a failed submit.
- `/applications/:id` — full detail with Edit and a two-step delete confirmation.
- Every data screen shows a loading skeleton, an error with **Try again**, and a helpful empty state with an action. Auth screens have their own validation states.

For the mobile check: DevTools → responsive mode → 375px. The board becomes one status-grouped column (no sideways scroll); only the table scrolls sideways.

## Run and test

- `npm run typecheck` — TypeScript across all workspaces.
- `npm run lint` / `npm run format` — ESLint and Prettier.
- `npm run build` — production build of the web app.
- `npm test` — 19 tests in four files: 9 application API, 5 auth API, 2 application-form and 3 route-guard (Vitest + Supertest + React Testing Library). API tests register throwaway users on the **dev branch** and delete them in `afterAll`. Never point this at a production database.
- To run one file while working: `npx vitest run apps/api/tests/auth.test.ts` (or the `.test.tsx` path for a frontend suite).
- To run only frontend suites: `npx vitest run apps/web/src`.

## Database and migrations

1. Copy `apps/api/.env.example` to `apps/api/.env` and paste the **pooled** URL into `DATABASE_URL` and the **direct** URL into `DIRECT_URL` from a Neon dev branch. Never use the production branch from your laptop.
2. `npm run generate` — produces `apps/api/src/generated/prisma` from the schema. Run it after any schema edit.
3. `npm run migrate` — `prisma migrate dev` applies `20261125080000_init` (or creates a new migration if you changed the schema) and regenerates the client.
4. `npm run studio` — opens Prisma Studio on the dev branch to inspect tables. `npm run validate` checks the schema without touching the DB.

Prisma CLI reads `DIRECT_URL` from `apps/api/prisma.config.ts`; the running API reads `DATABASE_URL` in `apps/api/src/lib/prisma.ts`.

## CI on GitHub

1. The repo is already on GitHub at `LyraCS/applied`; the badge reads from it.
2. Add two repository secrets: `CI_DB_PASSWORD` and `CI_JWT_SECRET`. Generate URL-safe values with `openssl rand -hex 24` — the DB password is also the throwaway Postgres service password, so do not reuse a real one.
3. The README badge already points to `LyraCS/applied`; keep it as is.
4. Every push and pull request runs install → Prisma generate → `migrate deploy` → typecheck → lint → test → build. A failed step blocks the run; the badge shows the result.

## Deploy

Three boxes: **Neon** stores data, **Render** runs the Express API, **Vercel** serves React. The browser only ever calls the Vercel domain; Vercel forwards `/api/*` to Render. Analogy: Vercel is the front desk, Render is the kitchen, Neon is the fridge — the visitor only speaks to the front desk, so the cookie looks like it belongs to one shop.

### 1. Neon — production database

1. Create (or open) project `applied` at Neon.
2. Create a branch named `production`. Do **not** reuse the `dev` branch your laptop uses.
3. Copy the two connection strings from the **production** branch: the **pooled** one and the **direct** one. Keep them in the dashboard; paste them only into Render's env fields.
4. Leave `sslmode=require` in the URL. The `pg` driver prints a warning about stricter SSL modes; that is fine.

### 2. Render — API service

Create **Web Service** with these exact values:

| Field | Value |
|---|---|
| Name | `applied-api` |
| Environment | Node |
| Root Directory | leave blank (repo root, because this is an npm workspace) |
| Build Command | `npm install --include=dev && npm run generate` |
| Start Command | `npm run deploy:api` |
| Health Check Path | `/api/health` |
| Plan | Free to start; Starter if you want no cold starts |

`npm install --include=dev` is needed because Prisma CLI and `tsx` are devDependencies, and both are used when the service starts. `npm run deploy:api` expands to `prisma migrate deploy && npm run start` — **never `migrate dev`** on a deployed database. `migrate deploy` applies migrations without inventing new ones.

Add these environment variables in Render's dashboard:

| Key | Value to enter |
|---|---|
| `NODE_ENV` | `production` (this turns on `Secure` cookies) |
| `PORT` | `10000` |
| `DATABASE_URL` | Neon **pooled** production URL |
| `DIRECT_URL` | Neon **direct** production URL (used by `migrate deploy`) |
| `JWT_SECRET` | `openssl rand -base64 48` output, generated locally and pasted only here |
| `CORS_ORIGIN` | `https://<your-vercel-app>.vercel.app` (update after step 3) |
| `TRUST_PROXY` | `2` because a request crosses Vercel **and** Render before reaching Express |

`TRUST_PROXY` tells Express how many friendly middlemen to skip when finding the visitor's IP. Too few and every visitor looks like Vercel, so the 10-strike limiter throttles everyone together; too many and a caller can spoof `X-Forwarded-For`.

After the first deploy, open Render's **Shell** for `applied-api` and run `npm run seed` once. Running it in Shell means the production secrets stay on Render. It creates `demo@applied.example` with 10 applications and is safe to rerun.

Check `https://applied-api.onrender.com/api/health` → `200 {"status":"ok"}`. If Render appends a suffix to your service name, use that URL everywhere below instead.

### 3. Vercel — web app

1. Import `LyraCS/applied`. Framework Preset: **Vite** (auto-detected). Root Directory: leave blank.
2. Build Command: `npm run build`. Output Directory: `apps/web/dist`. Install Command: `npm install` (the default).
3. If your Render URL is not `https://applied-api.onrender.com`, edit the one `destination` line in `vercel.json` and push that change before deploying.
4. Deploy; Vercel prints the project URL. No Vercel environment variables are needed — the rewrite target is not a secret.
5. Replace the placeholder URL in `README.md` with the Vercel URL, and set Render's `CORS_ORIGIN` to that same URL, then redeploy Render if you changed it.

`vercel.json` rewrites `/api/:path*` to the Render URL. To the browser the request is still `https://<your-vercel-app>.vercel.app/api/...`, so `SameSite=Lax` cookies work and no CORS middleware is needed. `CORS_ORIGIN` is stored anyway so a future direct-API client has a documented allowed origin.

### 4. Warm-up (Render free-instance cold start)

Render's free instance sleeps after roughly 15 minutes idle; the first visitor then waits while it boots. `.github/workflows/warmup.yml` pings `/api/health` every 10 minutes via GitHub Actions.

1. Add repository secret `RENDER_HEALTH_URL` = `https://applied-api.onrender.com/api/health`.
2. Open **Actions → Warm up API → Run workflow** to confirm it turns green.
3. Trade-off: ~144 tiny Action runs/day, which uses free Actions minutes. A paid Render Starter instance (about $7/month as of Nov 2026) stays awake and is simpler — in that case delete `warmup.yml` and keep the health check.

### 5. Live smoke test

After the Vercel deploy, run these in order on the public URL. Use the **429 test last** — it blocks your IP for 15 minutes.

| # | Action | Expected result |
|---|---|---|
| 1 | Register a throwaway account | Redirect to dashboard; cookie set |
| 2 | Log out, then log in again | `/me` restores the session |
| 3 | Add a job with only company + position | It appears on the board as **Saved** |
| 4 | Change its status select | Card moves column; focus stays on the select |
| 5 | Refresh while logged in | Still logged in, data still there |
| 6 | Log out, refresh | Redirected to `/login` |
| 7 | Log in with `demo@applied.example` / `demo-password-123` | 10 sample applications across all five statuses |
| 8 | Submit 10 wrong logins from one browser, then the correct one | First 10 → 401, 11th → 429; wait 15 min before more auth tests |
| 9 | DevTools → Network on a `/api` request | Request URL is the **Vercel** domain (rewrite works); response has `Set-Cookie: applied_token=…; HttpOnly; Secure; SameSite=Lax` |

Check `document.cookie` in the console: the token must **not** appear there. That is the point of httpOnly.

## Adding a new field, end to end (checklist)

Use the existing `salary` field as the model:

1. `packages/shared/src/schemas.ts` — add it to `applicationCreateSchema`, with a blank string transformed to `null`.
2. `apps/api/prisma/schema.prisma` — add the nullable column, then `npm run generate && npm run migrate` to create and apply a migration.
3. `apps/api/src/controllers/application.controller.ts` — no per-field code is needed for a nullable scalar: create spreads the validated body and PATCH uses the `.partial()` schema.
4. `apps/web/src/components/applications/ApplicationForm.tsx` — add a labelled input; `emptyFormValues` and `toFormValues` keep it as a string in the form.
5. `apps/web/src/pages/ApplicationDetailPage.tsx` — display it; `salary` is shown there as free text today, so `"competitive"` is valid and the shared schema caps it at 120 characters.
6. Add a form test for the blank-to-null transform, update [[API]] and [[DATABASE]], then run `npm run typecheck && npm run lint && npm test && npm run build`.
