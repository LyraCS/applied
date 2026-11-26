# Build log

Chronological record. Commands are the ones actually run; problems are recorded when hit. The final entry is the current status — earlier "pending" lines describe the state at that point in the build, not today.

## 2026-11-25 — Plan approved (Phase 0)

Proposal approved with six amendments:

1. Neon dev branch for local development; no Docker.
2. Workspaces + shared package, with a fallback to `client/` + `server/` if config needs more than 2–3 attempts.
3. Phase 8 adds a seeded demo user with realistic applications and README login details.
4. Phase 3 adds `helmet` and rate limiting on auth routes.
5. Phase 8 plans for Render cold starts and smoke-tests the Vercel rewrite before sign-off.
6. Drag-and-drop stays a post-MVP stretch.

## 2026-11-25 — Phase 1: foundation

**Built:** npm-workspace root; strict TypeScript base config; ESLint flat config + Prettier; `.gitignore` that excludes `.env`; `@applied/shared` with status/job-type constants, labels and auth Zod schemas; Express app with `/api/health`, JSON 404 and a central error handler; `tsx` dev/start scripts; Vite + React + React Router + Tailwind 3.4 shell with placeholder routes and a visible focus-ring base style; all eight docs plus README created.

**Design input:** `ui-ux-pro-max` design-system query returned Minimalism & Swiss, professional blue palette, Fira Sans/Fira Code; encoded in `apps/web/tailwind.config.js`.

**Commands and results:**

| Command | Result |
|---|---|
| `npm install` | 359 packages; 9 audit findings (2 critical) — see problems below |
| Version bumps + clean `npm install` | 303 packages, **0 vulnerabilities** |
| `npm run typecheck` | passed in all three workspaces |
| `npm run lint` | passed |
| `npm run build` | passed — `dist/index.html`, 6.71 kB CSS, 181.26 kB JS (59.94 kB gzip) |
| `npm test` | passed (no test files yet — tests land in Phase 7) |
| `curl localhost:4000/api/health` | `200 {"status":"ok"}` |
| `curl localhost:5173/` and `/login` | `200` (React Router deep links work) |
| `curl localhost:5173/api/health` | `200 {"status":"ok"}` — Vite proxy works |

**Problems and fixes:**

1. The first pinned versions (Vitest 2, Vite 5, Zod 3, React Router 6) produced 9 npm audit findings, including two critical ones in Vitest. Fixed by upgrading to patched versions of the *same* libraries: Vitest 5.1.1, Vite 8.3.8, Zod 4.6.7, React Router 7.18.7, @vitejs/plugin-react 6.3.0, ESLint 10.15.0, @types/node 24. No stack or architecture change.
2. The first `npm install` after the version bumps failed with `ERESOLVE` because the old `node_modules` and lockfile still held Vitest 2. Fixed by deleting generated `node_modules` and `package-lock.json`, then reinstalling from scratch.
3. npm 11 warned that `esbuild` postinstall was not allow-listed; the production build succeeded regardless, so no change was needed.

**Status:** Phase 1 complete and verified. Dev servers were stopped after the checks.

## 2026-11-25 — Phase 2: database (schema and client; migration pending credentials)

**Found:** `apps/api/.env` was **not** present despite being expected, and `DATABASE_URL`/`DIRECT_URL` were not in the shell environment. Only `.env.example` existed. No credential values were read or printed.

**Built:** `prisma/schema.prisma` with `User`, `Application`, two enums, cascade delete and three composite indexes; `prisma.config.ts` (Prisma 7 CLI config); `src/lib/prisma.ts` singleton with `PrismaPg` adapter; generated client in `src/generated/prisma`; initial migration SQL and `migration_lock.toml`; ESLint ignores generated code; `studio`, `validate` and `generate` scripts; rewritten `docs/DATABASE.md`.

**Commands and results:**

| Command | Result |
|---|---|
| `npm install` (Prisma 6.19.3) | 4 high audit findings in `@prisma/config` dependencies |
| Upgrade to Prisma 7.10.1 | Still 3 high findings (pinned `effect@3.20.0`) |
| Root `overrides: { "effect": "3.22.5" }` + clean reinstall | **0 vulnerabilities** |
| `npx prisma validate` (dummy env inline) | schema valid |
| `npx prisma generate` | client generated to `src/generated/prisma` in 26ms |
| `npx prisma migrate diff --from-empty --to-schema ... --script` | produced the initial SQL offline |

**Problems and fixes:**

1. Prisma 6.19.3 pulled `deepmerge-ts`/`effect` advisories; Prisma 7.10.1 pulled a pinned vulnerable `effect@3.20.0`. Fixed with a narrow npm override to `effect@3.22.5` (same 3.x line). Reinstalling without deleting the old lockfile did not apply the override; a clean reinstall did.
2. Prisma 7 removed `--to-schema-datamodel` from `migrate diff`; the current flag is `--to-schema`.
3. Prisma 7 requires `prisma.config.ts`, a `prisma-client` generator with an explicit `output`, and a driver adapter (`@prisma/adapter-pg` + `pg`). All three were added; the generated folder is excluded from linting.

**Blocked:** `npm run migrate` and Prisma Studio need real `DIRECT_URL`/`DATABASE_URL` values in `apps/api/.env`. The generated migration SQL is ready to apply.

**Status:** schema and client verified; migration application pending the env file.

## 2026-11-25 — Phase 2 follow-up

`apps/api/.env` appeared after Phase 2 was reported. `npm run migrate` applied `20261125080000_init`; `npx prisma migrate status` is now clean.

## 2026-11-25 — Phase 3: auth

**Built:** Zod env validation; bcrypt/JWT/cookie helpers; `authenticate`, `validateBody`, `authLimiter` and central error middleware; `asyncHandler`; four auth routes and controllers; helmet + trust proxy; a `fetch` wrapper; `AuthContext`, `ProtectedRoute`, `PublicOnly`; login/register pages with React Hook Form; AppShell with logout. No secret was printed or committed.

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm install` of auth/form libraries | 0 vulnerabilities |
| `npm run typecheck`, `npm run lint`, `npm run build` | passed (build: 306.75 kB JS, 97.46 kB gzip) |
| `npx prisma migrate status` | init migration not yet applied |
| `npm run migrate` | migration applied, DB in sync |
| `curl POST /api/auth/register` | 201, `Set-Cookie: applied_token=…; HttpOnly; SameSite=Lax; Max-Age=604800`; helmet headers present |
| `curl GET /api/auth/me` with / without cookie | 200 with user / 401 without |
| `curl POST /api/auth/login` wrong / correct password | 401 / 200 + new cookie |
| `curl POST /api/auth/logout`, then `/me` | 200 / 401 (cookie cleared) |
| `curl POST /api/auth/register` with bad email + short password | 400 with Zod issues per field |
| 12 rapid login attempts | six 401s then six 429s — rate limit works |

**Problems and fixes:**

1. First API start hit `EADDRINUSE` from a stale Phase 1 process; restarted after the port freed.
2. Register crashed the process with `P2021: table public.users does not exist`: the migration had been generated offline but never applied (the Phase 2 `.env` arrived later). Fixed with `npm run migrate`.
3. Express 4 does not forward rejected async controller promises, so the DB error killed the process instead of reaching the error handler. Fixed once with `src/lib/asyncHandler.ts` applied to every async auth route.
4. ESLint rejected the `declare global { namespace Express … }` augmentation. Replaced with `declare module 'express-serve-static-core'`, which adds `userId` to `Request` without a namespace.
5. PostgreSQL warned that `sslmode=require` is being treated as `verify-full` by the `pg` driver. Informational; the stricter behaviour is fine for this project.

**Status:** Phase 3 complete and verified. The throwaway test account `phase3-check-20261125@example.com` was created on the dev branch. The browser UI itself was checked by build + response codes; visual/manual clicking is for the user.

## 2026-11-25 — Phase 4: CRUD API, stats and integration tests

**Built:** shared application create/update/query/id Zod schemas (empty text → `null`, http(s)-only `portalUrl`, sort whitelist); `validateQuery`-style middleware for the query and `:id` params; five application routes (list, get one, create, patch, delete) and `GET /api/stats`; ownership scoping through `req.userId` only, with `updateMany`/`deleteMany` and a uniform 404; case-insensitive search plus status/job-type filters; nine Supertest integration tests with two users and cleanup in `afterAll`; Vitest config that loads `apps/api/.env` before the app is imported; API typecheck extended to cover `tests/`. Docs updated: API, ARCHITECTURE, STACK, HOW_TO, INTERVIEW_NOTES, BUILD_LOG, README.

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm install -D supertest@7.3.2 @types/supertest@7.2.1`; `npm audit --audit-level=high` | 0 vulnerabilities |
| `npm run typecheck` | passed in all three workspaces |
| `npm run lint` | passed after removing one unused test variable |
| `npm run build` | passed — 307.81 kB JS, 97.92 kB gzip |
| `npm test` | 1 file, 9 tests passed against the Neon dev branch |
| `curl` with two cookie jars | register 201; create 201; filtered list 200; stats 200; bad sort 400; B read/delete A's row 404; A's row still 200 |
| Cleanup | both smoke-test users deleted from the dev branch; test users deleted by `afterAll` |

**Problems and fixes:**

1. `schemas.ts` referenced `STATUSES`/`JOB_TYPES` without importing them. Added the import from `./constants`.
2. `portalUrl` ran `.url()` before the empty-string transform, so the forgiving form's blank value failed validation. Replaced with a refine that allows `''` (→ `null`) and only accepts http(s) URLs — also blocks `javascript:` values.
3. Express 4 exposes `req.query` as a read-only getter; parsed query values are stored in `req.applicationQuery` instead. `req.params` needed a typed cast in `validateParams`.
4. Two tests initially failed on wrong expectations (I had deleted the extra row in an earlier test, and only one fixture had a this-week `appliedAt`). Assertions corrected to 3 rows and `appliedThisWeek: 1`; the API was right.
5. The `pg` SSL-mode warning reappeared in tests. Still informational; no change.

**Status:** Phase 4 complete and verified. The tests use the real dev branch and create/delete their own accounts; they are not safe to point at a production database. The frontend still shows placeholders — the dashboard and forms are Phase 5.

## 2026-11-25 — Phase 5: web pages

**Built:** `lib/api.ts` with `apiFetch`/`ApiError` plus `applicationsApi` and `getStats`; a small `useAsync` hook (data/loading/error/retry plus a local row update — no global store); shared `LoadingPanel`/`ErrorPanel`/`EmptyPanel`; `ApplicationCard`, `Board` (single-column status groups on phones → 2 at `md` → 5 at `lg`), `TableView` (sideways scroll), `Toolbar` (debounced search, status/job-type filters, sort field + direction, board/table toggle); one `ApplicationForm` for new and edit using React Hook Form + the shared Zod schema, inline errors, a focusable error summary and a server-error banner; `ApplicationsPage`, `DashboardPage`, `NewApplicationPage`, `EditApplicationPage`, `ApplicationDetailPage` with a two-step delete confirmation; all routes wired in `App.tsx`. Added `ApplicationCreateValues` (`z.input`) to `@applied/shared` so form state stays strings while submit sends the transformed output.

**Design input:** kept the Phase 1 Minimalism/Swiss tokens (Fira Sans/Fira Code, one blue accent, subtle borders, whitespace). UX queries confirmed native accessible selects, labelled loading/error/empty states and mobile-first grouping. The design-search suggestion of a "funnel" pattern and a Lora/Raleway pairing was rejected: this is a private dashboard, not a marketing funnel.

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm run typecheck`, `npm run lint` | passed |
| `npm run build` | passed — 339.58 kB JS, 105.92 kB gzip |
| `npm test` | 1 file, 9 tests passed against the Neon dev branch |
| `npm audit --audit-level=high` | 0 vulnerabilities |
| Schema self-check (`npx tsx -e`) | blank form payload → `appliedAt: null`, blank text → `null` |
| `curl` through `localhost:5173/api` | health 200; register 201 + cookie; forgiving create 201 with `appliedAt: null`; list 200; stats 200; PATCH status 200; DELETE 200 |
| Cleanup | temporary smoke user deleted from the dev branch; cookie jar removed |

**Problems and fixes:**

1. `useAsync` first flattened errors to strings, so detail/edit pages could not tell a 404 from a server failure. It now keeps the real `Error` (including `ApiError.status`): 404 renders "Application not found", other errors get a retry button.
2. `nullableDate` rejected `''`, which would have broken the forgiving form on submit. It now transforms `''` to `null`; a genuinely invalid date string is still a 400.
3. An unused `JobType` import in `ApplicationsPage` was removed after typecheck flagged it (via lint/prettier hygiene).

**Status:** Phase 5 complete and verified by build/typecheck/lint/tests plus a real API smoke test through the Vite proxy. No browser clickthrough or screenshots were taken by the assistant — visual review is the user's step.

## 2026-11-25 — Phase 6: UX polish

**Reported issue:** the Firefox mobile-viewer extension could not load the page, and closing it required rerunning `npm run dev:web`. Cause: Vite bound only to IPv6 loopback — `curl -4 http://127.0.0.1:5173/` returned `000` while `curl -6 http://[::1]:5173/` returned 200. `server.host: true` fixes it; after the config restart, IPv4, IPv6, the LAN IP and `/api/health` all returned 200.

**Changed:** added an `ErrorBoundary` around the routes (reload / dashboard recovery) and a real `NotFoundPage` — the old `PlaceholderPage.tsx` was deleted. A status change now restores keyboard focus to that card's `<select>` and announces the move in an `aria-live` region. `LoadingPanel` renders card-shaped skeletons instead of plain bars. `AppShell` gained a skip-to-content link, `NavLink` active state and a two-row nav on phones. A shared `PageHeader` centralises title/description/action spacing. `docs/INTERVIEW_NOTES.md` now has explicit Data fetching, State management and Form validation sections.

**Commands and results:**

| Command / check | Result |
|---|---|
| `curl` on `127.0.0.1:5173`, `172.22.90.53:5173`, `[::1]:5173`, `/api/health` | 200 on all four after the host fix |
| `npm run typecheck --workspace @applied/web`, `npm run lint` | passed |
| `npm run typecheck && npm run lint && npm run build && npm test && npm audit --audit-level=high` | passed — 341.53 kB JS, 106.61 kB gzip, 9/9 tests, 0 vulnerabilities |

**Trade-off:** `server.host: true` exposes the dev server on the LAN. Acceptable for a dev-branch-only local server; do not run it on an untrusted network.

**Status:** Phase 6 complete. No new dependencies or features were added. No browser clickthrough was done by the assistant — desktop/375px verification is the user's step.

## 2026-11-25 — Phase 7: tests and CI

**Built:** `apps/api/tests/auth.test.ts` — five tests covering cookie flags + duplicate email, correct/wrong password, `/me` with no cookie / a tampered cookie / a valid cookie, field-level validation issues, and the 10-strike limiter. `apps/web/src/components/applications/ApplicationForm.test.tsx` — required fields block submit and show the focusable summary; blank optional fields become `null` through the real resolver. `apps/web/src/components/auth/ProtectedRoute.test.tsx` — redirect + remembered destination, the loading gate, and the signed-in render. Installed `@testing-library/react`, `@testing-library/jest-dom` and `jsdom` in the web workspace; widened the Vitest `include` glob. Added `.github/workflows/ci.yml` (Postgres 16 service, secrets for DB password and JWT secret, migrate → typecheck → lint → test → build) and a CI badge placeholder in README.

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm install -D --workspace @applied/web …`; `npm audit --audit-level=high` | 49 packages added, 0 vulnerabilities |
| `npm test` | 4 files, 19 tests passed (9 API + 5 auth + 2 form + 3 route guard) |
| `npm run typecheck && npm run lint && npm run build && npm test && npm audit --audit-level=high` | all passed |

**Problems and fixes:**

1. The first web test run failed with `TypeError: The URL must be of scheme file`: `apps/api/tests/setup.ts` built the env path from `import.meta.url`, which jsdom turns into an `http:` URL. Replaced with `resolve(process.cwd(), 'apps/api/.env')`.
2. The rate limiter has one in-memory counter per IP shared by login and register. The auth tests now send a distinct `X-Forwarded-For` IP per test (safe because `trust proxy = 1`), so one test's attempts cannot throttle another's.

**Status:** Phase 7 complete locally. GitHub CI needs two repository secrets (`CI_DB_PASSWORD`, `CI_JWT_SECRET`) and the README badge's owner/repo replacing before it can run.

## 2026-11-25 — Phase 8: deploy preparation

**Built:** `apps/api/prisma/seed.ts` — a public demo user plus 10 applications covering all five statuses, with fixed UUIDs and `upsert` so a second run updates instead of duplicating. Added root `seed`, `start:api` and `deploy:api` scripts; API `deploy` script runs `prisma migrate deploy && npm run start` (never `migrate dev`) and `seed` runs `prisma db seed`. Added `TRUST_PROXY` env validation (default `1`, use `2` behind Vercel + Render), made cookie clearing mirror the `Secure`/`SameSite` flags on login, and documented `CORS_ORIGIN` as the intended browser origin. Added `vercel.json` (Vite build/output + `/api/:path*` rewrite) and `.github/workflows/warmup.yml` (10-minute `/api/health` ping). README now has the real CI badge, the demo login with an explicit "intentionally public" warning, and a single live-URL placeholder to replace after Vercel's first deploy. Expanded [[HOW_TO]] with exact Neon/Render/Vercel dashboard values, a warm-up trade-off and a nine-step live smoke-test checklist; added a deployment diagram and trade-offs to [[ARCHITECTURE]].

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm run typecheck && npm run lint && npm run build && npm test` | all passed — 341.53 kB JS / 106.61 kB gzip, 19/19 tests |
| `npm run seed` twice | both runs reported 10 applications |
| Count query after two seeds | `demo applications after two seeds: 10` — idempotent |
| `git ls-files --others --exclude-standard \| xargs grep -Il …` | only `.env.example` matched the placeholder URL pattern; no real token or private key found |
| `git check-ignore -v apps/api/.env` | ignored by `.gitignore:4` |
| `gh repo edit LyraCS/applied --description …` | description set; remote `origin` added |
| Ruby YAML parse of both workflows | valid |

**Problems and fixes:**

1. The first idempotency count used `tsx -e` with top-level `await`; tsx compiled it as CJS and rejected it. Wrapped the check in an async IIFE; the seed itself was never broken.
2. A naive secret grep flagged `.env.example` because it contains a placeholder `postgresql://user:password@ep-xxx…` URL. No real credential is present; `.env` itself is ignored and was never added.
3. `git diff --cached --check` flagged trailing whitespace in generated Prisma client files. Added `apps/api/src/generated/prisma/` to `.gitignore` instead of reformatting generated output; `npm run generate` recreates it locally, in CI and on Render.

**Status:** Phase 8 configs are ready and locally verified. The real deploy is still a human step: create the Neon production branch, enter Render/Vercel values from [[HOW_TO]], seed once from Render Shell, set `CI_DB_PASSWORD`, `CI_JWT_SECRET` and `RENDER_HEALTH_URL`, then replace the README live-URL placeholder. Risk: `vercel.json` points at the intended `https://applied-api.onrender.com`; if Render appends a suffix, that one destination must be edited before deploying.

## 2026-11-25 — Phase 9: final docs and resume

**Built:** an accuracy pass over `README.md` and every file in `docs/`, checked against the actual routes, schemas, controller, dashboard, seed and deploy configs. Corrected `DATABASE.md` (migration applied; generated client ignored by git, not committed), `API.md` (Phase 9 header, production base URL, generic helmet wording), `ARCHITECTURE.md` (real middleware order, `TRUST_PROXY` in the diagram, React as a current client, config-not-live deploy language), `STACK.md` (no "planned" markers; verified design claims only), `HOW_TO.md` (real clone URL, seed step, data-screen wording, accurate add-a-field checklist) and `INTERVIEW_NOTES.md` (real pitch, five curated questions, deploy trade-offs). Added four resume bullets, a 30-second pitch and "What I'd improve next" to the README; added five strong Q&As to `INTERVIEW_NOTES.md`.

**Corrections made:**

1. Removed the screenshot placeholder and "Phase N planned" markers that contradicted the built code.
2. Kept the live URL as a pending-deploy line: the user confirmed Vercel has not been deployed yet, so no URL was invented.
3. Added a note at the top of this log that earlier "pending" statuses are historical, not current.

**Commands and results:**

| Command / check | Result |
|---|---|
| `npm run generate && npm run typecheck && npm run lint && npm test && npm run build` | all passed; Prisma client regenerated, 19/19 tests, 341.53 kB JS / 106.61 kB gzip |
| `git diff --check` | clean |
| Grep for stale markers across `README.md` and `docs/*.md` | only accurate deploy-pending lines and historical log entries remain |

**Status:** Phase 9 complete. Code and docs are final; publishing to Render/Vercel, setting the three repository secrets and pasting the real Vercel URL into the README are the remaining human steps. The live app was not smoke-tested because no URL has been supplied.

## 2026-11-26 — Vercel Services deploy configuration

**Built:** replaced the Render-forwarding `vercel.json` with a two-service config. `api` (Express, entrypoint `apps/api/src/server.ts`, `prisma generate` on build) is public at `/api/*`; `web` (Vite, `apps/web/dist`) is public at the catch-all. Both services use `root: "."` so the shared npm workspace resolves at install time. No bindings were added: the browser calls `/api` over the public rewrite and the API never calls the web service. Vercel passes the original path into a service, so existing `/api/*` Express mounts and the web fetch wrapper already agreed; only Render-era code comments needed correction.

**Removed:** `.github/workflows/warmup.yml` and the `RENDER_HEALTH_URL` secret requirement — Vercel Functions use Fluid compute and have no sleeping instance. Updated `README.md` and `docs/API.md`, `DATABASE.md`, `STACK.md`, `HOW_TO.md` and `ARCHITECTURE.md` from the Render split to one Vercel project, including the manual `prisma migrate deploy` + seed step that Functions cannot run on boot.

**Commands and results:**

| Command / check | Result |
|---|---|
| JSON parse of `vercel.json` | valid; 2 services, `/api/(.*)` → `api`, `/(.*)` → `web` |
| `npm run typecheck && npm run lint && npm test && npm run build` | all passed; 19/19 tests, 341.53 kB JS / 106.61 kB gzip |
| `git diff --check` | clean |

**Status:** config is complete and locally verified but not committed and not deployed. Remaining human steps: commit/push, import the repo into a Vercel project, set the six project env variables, run the production migration and seed once, then paste the printed URL into `README.md` and smoke-test. No live URL has been supplied.

## 2026-11-26 — CI made self-contained

**Changed:** the `postgres:16` service container failed at `Initialize containers` because `POSTGRES_PASSWORD` read the unset `CI_DB_PASSWORD` secret, so Postgres refused to initialise. Replaced both CI secrets with fixed throwaway literals scoped to the ephemeral container; the JWT secret is likewise test-only. CI now needs no repository setup and works on forks. Updated [[HOW_TO]], [[ARCHITECTURE]] and [[STACK]] to match.

**Status:** fix pushed; the next CI run on `main` is the verification.

## 2026-11-26 — Interview notes made local-only

`docs/INTERVIEW_NOTES.md` is personal interview prep, so it was removed from git tracking and added to `.gitignore`. The file itself stays on disk; only the public repository loses it. The README documentation table link and the `[[INTERVIEW_NOTES]]` wikilink were removed so GitHub has no dangling links. Earlier log entries that mention the file remain as a historical record.
