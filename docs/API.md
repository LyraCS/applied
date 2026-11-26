# API

_Last updated: 2026-11-25 — Phase 9 accuracy pass. Health, auth, all five application routes and `GET /api/stats` are implemented and tested; the frontend consumes them through `/api`._

Base URL in dev: `http://localhost:4000` (reached from the browser as `/api` via the Vite proxy). In production the browser calls `/api` on the Vercel domain and Vercel routes it to the Express service in the same project.

## Conventions

- Auth uses an httpOnly JWT cookie, automatically sent by the browser. There is no `Authorization` header.
- Bodies, query strings and `:id` params are validated with the Zod schemas in `packages/shared`. Failures return `400` with field issues.
- Error format: `{ "error": { "message": string, "code"?: string, "issues"?: unknown } }`.
- Success bodies use envelopes: `{ "application" }`, `{ "applications" }`, `{ "user" }`, or `{ "ok": true }`.
- **Ownership:** every application query includes `userId` from the verified JWT. A missing row and another user's row both return `404`, so IDs cannot be probed.
- Every application route runs `authenticate` before validation or the controller; unauthenticated calls return `401`.

## Endpoints

| Method | Path | Auth | Body / query | Success | Error cases |
|---|---|---|---|---|---|
| GET | `/api/health` | No | — | `200 { "status": "ok" }` | — |
| POST | `/api/auth/register` | No | `{ name, email, password }` | `201 { user }` + cookie | 400 invalid, 409 email taken, 500 |
| POST | `/api/auth/login` | No | `{ email, password }` | `200 { user }` + cookie | 400 invalid, 401 wrong credentials, 429 too many attempts |
| POST | `/api/auth/logout` | No | — | `200 { ok: true }`, clears cookie | 500 |
| GET | `/api/auth/me` | Yes | — | `200 { user }` | 401 no/invalid cookie |
| GET | `/api/applications` | Yes | Query below | `200 { applications }` | 400 invalid filter/sort, 401 |
| GET | `/api/applications/:id` | Yes | UUID in path | `200 { application }` | 400 malformed id, 401, 404 |
| POST | `/api/applications` | Yes | `{ company, position, ...optional }` | `201 { application }` | 400, 401 |
| PATCH | `/api/applications/:id` | Yes | Any subset of application fields | `200 { application }` | 400, 401, 404 |
| DELETE | `/api/applications/:id` | Yes | UUID in path | `200 { ok: true }` | 400 malformed id, 401, 404 |
| GET | `/api/stats` | Yes | — | `200 { total, byStatus, appliedThisWeek }` | 401 |

## Application query contract

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string, ≤120 chars | none | Case-insensitive `contains` on `company`, `position`, `location`. |
| `status` | `SAVED`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED` | none | Exact match. |
| `jobType` | `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `OTHER` | none | Exact match. |
| `sort` | `appliedAt`, `createdAt`, `company` | `createdAt` | Whitelisted by Zod; anything else is a 400. |
| `order` | `asc`, `desc` | `desc` | Applied to `sort`. |

Example: `GET /api/applications?q=acme&status=APPLIED&sort=company&order=asc`.

`sort` and `order` are whitelisted by Zod before reaching Prisma — user input is never passed directly into `orderBy`. The whitelist lives in `packages/shared/src/schemas.ts` next to the form rules, so client and API agree on what is sortable.

## Create / update body

`company` and `position` are required (non-blank, ≤120 chars) on create; every other field is optional and forgiving:

- Empty strings for text fields become `null`, so a form can submit all fields without storing `""`.
- `appliedAt` accepts a date string (turned into a real `Date`) or `''` (stored as `null`); a genuinely invalid date is a 400.
- `portalUrl` accepts `''` (stored as `null`) or an http(s) URL; other schemes are rejected.
- `status` defaults to `SAVED` in the database; `jobType` may be `null`.
- `PATCH` uses the same schema made `.partial()`, so omitted fields are untouched.

## Ownership scoping, concretely

- Create spreads the validated body and adds `userId: req.userId` — a `userId` in the request body is ignored.
- Read uses `findFirst({ where: { id, userId } })`, never `findUnique({ where: { id } })`.
- Update and delete use `updateMany` / `deleteMany` with `{ id, userId }`; a `count` of 0 becomes the same `404` whether the row is missing or belongs to someone else.
- List, search, filters and stats all start their Prisma `where` with `{ userId }`.

The JWT cookie is the only source of identity. No route reads a user ID from a body, query or header.

## Stats

```json
{ "total": 12, "byStatus": { "SAVED": 4, "APPLIED": 3, "INTERVIEW": 2, "OFFER": 1, "REJECTED": 2 }, "appliedThisWeek": 3 }
```

`byStatus` always contains all five keys (zeros included), so the UI does not have to guess. `appliedThisWeek` counts rows with `appliedAt >= Monday 00:00 UTC` of the current week; UTC keeps the number identical on a laptop and in production.

## Auth details (implemented)

The cookie is named `applied_token`, is `HttpOnly`, `SameSite=Lax`, `Path=/`, lives 7 days, and is `Secure` only in production (HTTPS plus the same-origin proxy/rewrite make that safe). Every response carries helmet's default security headers. Register and login share one rate limiter: 10 attempts per 15 minutes per IP, returning:

```json
{ "error": { "message": "Too many attempts. Please try again later.", "code": "RATE_LIMITED" } }
```

Passwords are hashed with bcrypt cost 12; no hash is ever returned. `POST /api/auth/logout` clears the cookie; subsequent `/me` calls return 401.

## Example calls

```sh
curl http://localhost:4000/api/health
# {"status":"ok"}

curl -c jar -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"long-enough"}'
# 201 + Set-Cookie

curl -b jar -X POST http://localhost:4000/api/applications \
  -H 'Content-Type: application/json' \
  -d '{"company":"Acme","position":"Engineer","status":"APPLIED"}'
# 201 {"application":{...}}

curl -b jar 'http://localhost:4000/api/applications?q=acme&sort=company&order=asc'
# {"applications":[...]}

curl -b jar http://localhost:4000/api/stats
# {"total":1,"byStatus":{...},"appliedThisWeek":0}

curl -b jar -X PATCH http://localhost:4000/api/applications/<id> \
  -H 'Content-Type: application/json' -d '{"status":"INTERVIEW"}'
# 200 {"application":{...}}
```
