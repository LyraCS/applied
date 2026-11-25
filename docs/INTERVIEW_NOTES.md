# Interview notes

_Last updated: 2026-11-25 — Phase 7. Sections are filled in as each part is built._

## Why this project?

**30-second pitch:** _drafted in Phase 9 against the finished app._

## Foundation — how to explain it

**"Why a monorepo?"** "The validation rules are shared between the browser and the API. npm workspaces let both apps import `@applied/shared` directly with one install and no publishing step. The alternative was duplicating schemas, which drifts." Follow-up: "If the workspace setup became a time sink, I'd fall back to plain `client/` and `server/` folders — the principle is one source of truth, not the tool."

**"Why TypeScript strict mode?"** "Runtime validation with Zod plus compile-time types means a form field rename fails the build instead of silently producing `undefined` in production."

**"Why separate `app.ts` and `server.ts`?"** "The app is just an Express instance, so Supertest can test it without opening a real port; `server.ts` is the only place that calls `listen()`."

**"Why Tailwind tokens instead of raw colours?"** "Components say `text-ink` / `bg-surface`. Changing the palette happens in one config file, and the class names describe intent rather than a specific hex value."

## Auth — how to explain it

**"What is a JWT?"** "It's a signed, self-contained claim: the server puts the user's ID in a `sub` field, signs it with a secret, and sends it to the browser. On each request the server verifies the signature and expiry, so it doesn't need to look up a session row. Analogy: a sealed concert wristband — the guard doesn't call the ticket office, they check the seal." Follow-up: "The downside is revocation: a stolen wristband works until it expires, so I keep the lifetime at seven days and clear the cookie on logout."

**"Why an httpOnly cookie instead of localStorage?"** "JavaScript cannot read an httpOnly cookie, so an XSS bug can't steal the token and send it to an attacker. localStorage is readable by any script on the page. The trade-off is the frontend can't see the token, so on page load I call `/api/auth/me` to learn who is logged in — that's what `AuthContext` does. Analogy: the cookie is a sealed envelope the browser carries automatically; the page is allowed to use the delivery service but not to open the envelope."

**"Why SameSite=Lax and not None?"** "The Vite proxy in dev and the Vercel rewrite in prod make the API appear on the same origin as the app, so Lax is enough. `None` would require `Secure` and would expose the cookie to cross-site requests we don't need."

**"What does middleware do?"** "It's a checkpoint in a fixed pipeline: helmet adds headers, JSON parsing and cookie parsing populate `req`, validation checks the body, auth checks the cookie, then the controller runs. `next()` moves to the next checkpoint; returning a response stops the chain. Analogy: airport security — each checkpoint does one job and either waves you through or stops you."

**"Why bcrypt instead of SHA-256?"** "A fast hash lets an attacker try billions of guesses per second. bcrypt is deliberately slow and salts each password; cost 12 adds roughly 250 ms per check, which is invisible to a human logging in but brutal for brute force."

**"Why rate limit auth routes?"** "A login form is a password-guessing interface. Ten attempts per 15 minutes per IP makes guessing impractical. Behind Render we set `trust proxy` so the limiter sees the visitor's IP rather than the proxy's."

**"What happens if the database throws?"** "Express 4 doesn't catch rejected promises from async handlers, which would crash the process. `asyncHandler` forwards the rejection to the central error handler, which returns a JSON 500. That was a real bug I hit and fixed during Phase 3."

## Database — how to explain it

**"Why this schema?"** "One user owns many applications with a cascade delete, so removing an account removes its data. Most columns are nullable because the product is forgiving, and `salary` is text because 'competitive' is a real answer."

**"Why those indexes?"** "Every query begins with the signed-in user's ID, so each composite index starts with `user_id` and then adds the field the screen filters or sorts on."

**"Why migrations?"** "They're a version-controlled SQL logbook: each change is a file, Prisma records which files ran, and every environment converges on the same schema. In Phase 8 the deploy uses `migrate deploy`, which only applies known migrations."

## API — how to explain it

**"How do you stop user B from reading or changing user A's applications?"** "Every query starts with `userId` from the verified JWT cookie, never from the request. Reads use `findFirst({ where: { id, userId } })`; updates and deletes use `updateMany`/`deleteMany` with the same pair and turn a zero affected count into a 404. A missing row and someone else's row return the identical response, so the API can't be used to discover IDs. Analogy: the ID is the locker number, the cookie is the key — knowing the number is not permission to open it." Follow-up: "The tests register two users and assert that B gets 404 on A's record for read, update and delete while A's data is unchanged."

**"Why is `sort` whitelisted?"** "Prisma's `orderBy` takes an object key, and keys can't be parameterised the way values can. If I passed user text straight in, a caller could choose columns the screen never intended, including a joined user's password hash. The shared Zod schema limits `sort` to three column names and `order` to two directions; anything else stops at validation with a 400. Analogy: a vending machine with numbered buttons, not a keyboard where you can type any code."

**"Why share validation schemas between client and API?"** "The form and the endpoint import the same Zod schema from `@applied/shared`, so a new status or a shorter URL limit is one edit. The browser gets instant inline errors and the API still validates on its own — client validation is UX, server validation is security."

**"How does the stats endpoint work?"** "Three Prisma calls in parallel: a count, a `groupBy` over status, and a count of rows applied since Monday 00:00 UTC. I fill in all five statuses with zeros first so the UI doesn't have to guess which keys exist. UTC keeps the week boundary the same on a laptop and on Render."

## Frontend — how to explain it

### Data fetching

**"How does the browser talk to the API?"** "Every call goes through one wrapper in `apps/web/src/lib/api.ts`. It prefixes `/api`, sends `credentials: 'include'` so the httpOnly cookie rides along, parses the JSON, and turns any non-2xx response into an `ApiError` with the server's message and status. Components never call `fetch` directly. Analogy: one receptionist handles every parcel — the page hands over a request and gets either the answer or a stamped complaint slip."

**"Where is the auth token?"** "Nowhere in JavaScript. The cookie is httpOnly, so the wrapper just asks the browser to include it, and `/me` tells `AuthContext` who is signed in. That is the point: no script on the page can read or replay the token."

**"What if the API is down?"** "Every screen renders one of three states from `useAsync`: a card-shaped skeleton while loading, an error with **Try again**, or a helpful empty state with an action. A 404 on detail/edit is special-cased into 'Application not found' because `ApiError` keeps the HTTP status."

**"Why did the page fail in the Firefox mobile viewer?"** "The dev server was listening only on IPv6 loopback (`[::1]:5173`), while the viewer reaches the machine over IPv4 (127.0.0.1 or the LAN IP) — that door was closed, and Firefox kept the dead socket until restart. `server.host: true` in `vite.config.ts` makes Vite listen on all interfaces. Trade-off: the dev server is then visible on the LAN, so only run it on a trusted network; it talks to a dev-branch database, never production."

### State management

**"How do you manage state?"** "The server is the source of truth. `useAsync` owns one screen's data/loading/error/retry; filters, view choice and form fields stay in local `useState` because no other screen needs them. A status change patches the API and swaps that one row locally. No Redux or query library — one screen of state does not justify a cache. Analogy: the database is the library catalogue; each screen borrows a book, and a local note is enough until something changes."

**"What happens when a screen crashes?"** "A small `ErrorBoundary` class wraps the routes. React can only catch render errors with a class component; the boundary shows a calm 'This screen couldn't load' panel with a reload action instead of a blank page. The rest of the app's data is untouched — the boundary replaces only the broken subtree."

### Form validation

**"Why share the Zod schema with the form?"** "React Hook Form holds the raw strings the user typed (`z.input`), and `zodResolver(applicationCreateSchema)` both validates on blur and produces the transformed values (`z.infer`) sent to the API. Blank text and a blank date become `null` in one place, so browser and server cannot disagree. Client validation is UX; the API validates again because it is the trust boundary."

**"How is a failed submit explained?"** "Errors appear next to each field, and after a failed submit a summary at the top links to every invalid field and takes keyboard focus. Analogy: the inline message is the note on the exam question; the summary is the marker's sheet at the front."

### UX details

**"Why no drag-and-drop?"** "A native `<select>` on each card is keyboard-operable, works with mobile pickers and needs no extra library. It also makes the status change explicit and easy to test. Drag-and-drop is a post-MVP stretch."

**"Does keyboard focus survive a status change?"** "No by default — changing status moves the card into another column, which remounts the select and drops focus. The page now restores focus to that same card's select and announces the move in a polite live region."

**"Why columns only on desktop?"** "Mobile-first: at 375px the status groups stack into one column, so there is no sideways scroll; `md` gives two columns and `lg` five. Tables are the exception — a wide table keeps its `overflow-x-auto` wrapper. The nav drops to two rows on phones, with the current page marked."

## Testing — how to explain it

**"What do the API tests protect?"** "Nine application tests cover CRUD, per-user isolation (B gets 404 on A's row for read/update/delete), search/filter/sort with the whitelist, stats and malformed input. Five auth tests cover the httpOnly cookie flags, duplicate email, correct/wrong password, `/me` with no cookie or a tampered cookie, and field-level validation issues. They register real throwaway users on a dev branch, so they test middleware, Prisma and the database together instead of a mocked version of the code."

**"What do the frontend tests protect?"** "The form test proves two things: a submit with blank required fields is blocked and explains why, and a valid submit converts blank optional strings (including the date) to `null` — through the real React Hook Form + Zod resolver, not a stubbed parser. The route-guard test proves a signed-out visitor lands on `/login` with the original destination remembered, that the loading state does not redirect prematurely, and that a signed-in visitor sees the screen."

**"How do you test a rate limiter without waiting 15 minutes?"** "The limiter counts attempts per IP in memory. Supertest lets me send `X-Forwarded-For` headers; because the app sets `trust proxy = 1`, each distinct header is a distinct visitor. I fire ten wrong logins from one fake IP, assert they all return 401, then prove the eleventh returns 429 even with the correct password — and other tests use other IPs so they aren't throttled."

**"Why test validation on both sides?"** "Client validation is UX — instant inline errors. Server validation is the trust boundary — a hand-crafted request can skip the browser entirely. The tests cover the server side; the form test covers the client side; both import the same schema so they can't drift."

**"What does CI add?"** "A GitHub Actions workflow runs install, Prisma generate, `migrate deploy`, typecheck, lint, tests and build on every push and PR. It starts a throwaway Postgres service and reads the DB password and JWT secret from repository secrets. Analogy: a gate before merge that runs the whole checklist, so 'it works on my machine' is not the only evidence."

## Still to write

- Deploy trade-offs (Phase 8).
- Resume bullets and final elevator pitch (Phase 9).
