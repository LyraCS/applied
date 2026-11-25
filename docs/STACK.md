# Stack

_Last updated: 2026-11-25 — Phase 7. Items marked "Phase N" are planned, not installed yet._

| Technology | Role | Why | Alternatives considered |
|---|---|---|---|
| TypeScript | Language everywhere | Zod schemas infer shared types; catches mismatches between client and server before runtime | Plain JavaScript (would duplicate types); Flow (dead end) |
| npm workspaces | Monorepo (`apps/*`, `packages/*`) | One install and one lockfile; `@applied/shared` is imported directly by both apps | Separate `client/` + `server/` folders (fallback if workspace config fails); pnpm/turborepo (extra tooling for one project) |
| React 18 + React Router 7 | UI and routes | Conventional, huge documentation base, easy to explain in interviews | Next.js (server rendering we don't need for a private dashboard); Vue (less familiar) |
| Vite 8 | Dev server and build | Fast, simple proxy to the API; no SSR complexity. Pinned to a patched version after an audit finding in Vite 5; binds to all interfaces in dev (`host: true`) so mobile viewers can connect | Webpack (slower, more config) |
| Tailwind CSS 3.4 | Styling | Semantic theme tokens, fast responsive work; v3 classic config is better documented than v4 CSS-first for a learner | CSS Modules (more files); Tailwind 4 (config style changed recently); component libraries (heavy for MVP) |
| React Hook Form + zodResolver | Forms (auth + the shared new/edit application form) | Handles inline errors and field state without hand-written boilerplate | Controlled inputs with `useState` (too much repetition at this field count) |
| Node.js + Express 4 | HTTP API | Minimal and readable; middleware pipeline is easy to teach | NestJS (too much structure); Fastify (less familiar); serverless-only (harder to reason about) |
| PostgreSQL on Neon | Database | Real relational DB, free dev branches so local dev never touches production data | SQLite (enum/password differences); MongoDB (relations are the point here) |
| Prisma 7.10.1 | ORM + migrations | Typed queries, versioned SQL migrations, `studio` for inspecting data. v6 had advisories; v7 needs a config file, generated client and `pg` adapter | Drizzle (less beginner documentation); raw SQL (more code, no type safety); Prisma 6 (audit findings) |
| Zod 4 | Validation in `packages/shared` | One schema gives both compile-time types and runtime checks; identical rules on client and server. Pinned to a patched version after a DoS advisory in Zod 3 | Joi/Yup (no shared type inference); hand-written ifs (drift) |
| bcryptjs + jsonwebtoken + httpOnly cookie | Auth | `bcryptjs` is pure JS (no native build) and hashes at cost 12; the cookie cannot be read by JavaScript, so XSS can't steal the token | Native `bcrypt` (build step); localStorage token (XSS-readable); DB sessions (more queries) |
| cookie-parser | Reads the cookie in Express | Turns the `Cookie` header into `req.cookies`, which the auth middleware verifies | Manual header parsing (error-prone) |
| helmet + express-rate-limit | Security headers + brute-force throttling | Added globally / on auth routes at the trust boundary; non-negotiable | Custom middleware (less tested) |
| Vitest 5 + Supertest | API integration tests | Tests real routes, middleware and Prisma together; one runner for the monorepo. Vitest 2 had critical advisories, so it was upgraded before writing tests | Jest (extra config with ESM); Playwright (overkill for API tests) |
| ESLint 10 + Prettier | Lint and format | Flat config covers both apps and the shared package; no formatting debates | ESLint 9 (deprecated warning on install) |
| GitHub Actions | CI | Runs install, migrate, typecheck, lint, test and build on every push/PR; Postgres service + secrets keep credentials out of the repo | No CI (definition of done requires it) |
| React Testing Library + jest-dom + jsdom | Frontend tests | Tests what the user sees (roles, labels, messages) rather than component internals; jsdom gives a DOM in Node | Enzyme (shallow rendering hides real behaviour); snapshot-only tests (brittle) |
| Vercel + Render (Phase 8) | Deploy targets | Vercel for the Vite build, Render for the long-running Express process | Single Render service serving static build (simpler cookies, less conventional split); all-Vercel serverless (cold starts and rewrite complexity) |

**Frontend state:** no global store or query library. `useAsync` owns each screen's server data; filters, view choice and form fields stay in component `useState`. A query-cache library would add machinery this single-user app does not need.

## Design system

Source: `ui-ux-pro-max` design-system query "job tracker productivity dashboard" (Minimalism & Swiss style, variance 3, density 7).

- **Style:** clean, spacious, grid-based, high contrast; light mode is primary (dark mode is a post-MVP stretch).
- **Colours:** primary `#0369A1`, secondary `#0EA5E9`, accent `#16A34A`, surface `#F0F9FF`, ink `#0C4A6E`, muted `#475569`, line `#BAE6FD`, danger `#DC2626`.
- **Type:** Fira Sans (body), Fira Code (monospace labels/numbers), Google Fonts link in `apps/web/index.html`.
- **Rules carried into implementation:** visible focus rings, ≥44px touch targets, no emoji as icons, hover transitions 150–300ms, responsive checks at 375/768/1024/1440px, reduced-motion respected in polish.
- Tokens live in `apps/web/tailwind.config.js`; components use names like `text-ink`, never raw hex.
