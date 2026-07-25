# GitDive Backend — Development Roadmap

## Purpose

This document defines the complete backend implementation roadmap for GitDive.
It is written as a phase-by-phase plan where **each phase leaves the backend in a
runnable, demonstrable state**, and no phase depends on work that hasn't been
completed yet. It also records the key architectural decisions so the reasoning
survives beyond any single implementation session.

---

## Architecture Overview

**Stack decisions and why:**

| Concern | Choice | Why |
|---|---|---|
| Runtime/Framework | Node.js + Express (already scaffolded) | Matches existing skeleton; minimal, unopinionated, well understood. |
| Git operations | `simple-git` (wraps the system `git` binary) | Avoids native-binding headaches of `nodegit`; the local `git` CLI already does log/diff/clone reliably; simplest thing that works for an MVP. |
| Input validation | `zod` | Lightweight schema validation, no boilerplate class definitions like Joi/class-validator. |
| Persistence | `better-sqlite3` (SQLite, file-based) | Zero infrastructure, synchronous API (simpler than async drivers for this scale), perfect for a single-instance MVP. Data access is isolated behind a small repository layer so swapping to Postgres later (if concurrency/scale demands it) touches one module, not the whole codebase. |
| AI provider | `@google/generative-ai` (Gemini) | Required by spec. Introduced only once the data being sent to it (commits/timeline) is stable, to avoid re-designing prompts against a moving target. |
| Docs | `swagger-jsdoc` + `swagger-ui-express`, or a plain README table if the team prefers less ceremony | Keeps the frontend contract explicit since the frontend is built independently. |
| Testing | `jest` + `supertest` | Standard, minimal setup, good enough for an MVP-sized service. |

**What is explicitly out of scope for MVP** (see "Future Extensibility" at the end):
authentication, private repositories, multi-repo comparison, background job
queues, websockets/streaming, Docker/deployment tooling, horizontal scaling.

**What gets stored vs. not:**
- Stored (SQLite): repo metadata, parsed commit data, computed stats, AI-generated
  summaries/explanations — all **cacheable, expensive-to-recompute** data.
- Not stored: the actual cloned repository contents beyond their temp-lifetime,
  raw diffs beyond what's needed to answer a request (diffs are large; only
  extracted/summarized fields are persisted long-term).

**UI/UX contract driving the API shape (per the frontend teammate's mockup):**
The frontend renders a vertical "dive line" with one minimal bubble per commit
along it. A bubble shows nothing but its label at rest; **on hover**, it
expands to reveal exactly three things: **commit date**, **files changed**,
and a **2–3 line AI summary**. This directly shapes two design decisions
below:
1. The timeline endpoint (Phase 4) must stay **lean** — it's rendering
   potentially hundreds of bubbles at once, so it returns only what's needed
   to place and label each bubble (hash, order, short label), not full diffs
   or summaries.
2. A separate **on-demand detail endpoint** (Phase 7) returns the three
   hover fields together in one call, since that's exactly the payload the
   hover interaction needs and it's fetched lazily, per-bubble, only when a
   user actually hovers it. This is also why caching (Phase 6) is
   introduced *before* AI (Phase 7): hover is a repeated, latency-sensitive
   interaction, so the first hover computes the summary and every hover
   after that (by this user or any other) is served from cache.

The backend does not need to know how bubbles are drawn, positioned, or
animated — that's entirely the frontend teammate's responsibility. The
backend's only job is to expose the two endpoints above cleanly.

---

## Phase 0 — Project Bootstrapping & Configuration

**Goal:** Get a minimal Express server running with configuration handling,
logging, and a health check.

**Why it exists:** Every later phase needs a running server to attach routes
to. This phase has zero feature logic — it's pure foundation — so it must come
first and be trivial to verify.

**Features to implement:**
- `app.js` — Express app setup, JSON body parsing, CORS (frontend runs on a
  different origin/port).
- `server.js` — server bootstrap, listens on configured port.
- `src/utils/config.js` — loads and validates `.env` (fails fast with a clear
  message if required vars are missing).
- `src/utils/logger.js` — minimal logger (e.g. `pino` or `console` wrapper).
- `src/middlewares/errorHandler.js` — centralized error-handling middleware.
- `GET /api/health` — returns `{ status: "ok" }`.

**Expected outcome:** `npm run dev` starts the server cleanly; hitting
`/api/health` returns 200.

**Acceptance criteria:**
- Server starts without errors with a valid `.env`.
- Server refuses to start (clear error message) if a required env var is missing.
- `GET /api/health` returns `200 { status: "ok" }`.
- An intentionally thrown error in a route is caught by the error handler and
  returns a JSON error, not a stack trace / crash.

**Files likely to change:** `src/app.js`, `src/server.js`, `src/utils/config.js`,
`src/utils/logger.js`, `src/middlewares/errorHandler.js` (new), `.env.example`,
`package.json`.

**Suggested commit(s):**
- `chore: bootstrap express server with config validation and health check`

---

## Phase 1 — Repository URL Validation

**Goal:** Accept a GitHub URL and validate it (format + existence + public
visibility) **before** doing anything expensive like cloning.

**Why it exists:** Cloning is costly (disk, time, network). Validating first
via the GitHub REST API is cheap and fails fast on bad input. This also gives
the frontend teammate an early, stable endpoint to integrate against.

**Features to implement:**
- `src/utils/validators.js` — GitHub URL parsing (extract owner/repo), zod
  schema for the request body.
- `src/services/githubService.js` — calls GitHub's public REST API
  (`GET /repos/{owner}/{repo}`, unauthenticated) to confirm the repo exists
  and is public; returns basic metadata (default branch, description, star
  count, size).
- `src/controllers/repoController.js`, `src/routes/repoRoutes.js`:
  - `POST /api/repos/validate` — body `{ url }` → validated repo metadata.

**Expected outcome:** Frontend can check a URL is usable before triggering a
clone/parse workflow.

**Acceptance criteria:**
- Valid public repo URL → `200` with owner, name, default branch, size.
- Malformed URL → `400` with a descriptive message.
- Well-formed URL pointing to a nonexistent or private repo → `404`/`403`
  as appropriate, not a 500.
- GitHub API rate-limit/network failure is handled gracefully (503, not crash).

**Files likely to change:** `src/routes/repoRoutes.js`,
`src/controllers/repoController.js`, `src/services/githubService.js`,
`src/utils/validators.js`.

**Suggested commit(s):**
- `feat: add GitHub repository URL validation endpoint`

---

## Phase 2 — Repository Cloning & Temp Storage Lifecycle

**Goal:** Clone a validated repository into a temporary working directory and
manage its lifecycle (creation, size limits, cleanup).

**Why it exists:** All downstream git-history parsing needs actual repo files
on disk. Isolating clone/cleanup logic now — before parsing logic is layered
on top — keeps disk management concerns in one place.

**Features to implement:**
- `src/services/gitCloneService.js` — shallow clone (`--depth` configurable,
  default reasonably deep e.g. 500 commits or full if small) via `simple-git`
  into a unique temp dir (`os.tmpdir()/gitdive-<uuid>`).
- `src/utils/tempDir.js` — creates/tracks/cleans temp directories; a
  cleanup function removes a dir after processing completes or after a TTL.
- Size guard: reject repos over a configurable max size (from Phase 1
  metadata) before cloning.
- `POST /api/repos/clone` — body `{ url }` → returns a `repoId` (used to
  reference this clone in subsequent calls) and clone status.

**Expected outcome:** Given a validated URL, the backend can produce a local,
working copy of the repo and hand back a reference to it.

**Acceptance criteria:**
- Cloning a small public repo succeeds and returns a `repoId`.
- Oversized repos (per configured limit) are rejected with a clear error
  and are *not* cloned.
- Temp directories are removed after their lifecycle ends — verified by
  checking the temp folder is empty after a manual cleanup call or TTL expiry.
- Repeated clone requests for different repos don't collide (unique dirs).

**Files likely to change:** `src/services/gitCloneService.js` (new),
`src/utils/tempDir.js` (new), `src/controllers/repoController.js`,
`src/routes/repoRoutes.js`.

**Suggested commit(s):**
- `feat: implement repository cloning with temp directory lifecycle management`

---

## Phase 3 — Git History Parsing & Data Extraction

**Goal:** Parse the cloned repository's git log into structured commit data:
hashes, authors, timestamps, messages, parents, branches, changed files, and
diff stats.

**Why it exists:** This is the core data-extraction step everything else (timeline,
stats, AI context) is built on. It depends only on Phase 2 (a repo on disk).

**Features to implement:**
- `src/services/gitParserService.js` — uses `simple-git`'s `log()`/`diffSummary()`
  to extract, per commit: hash, author name/email, date, message, parent
  hash(es), branch refs, list of changed files with insertions/deletions.
- `src/models/Commit.js`, `src/models/Author.js` — plain data shape
  definitions (not DB models yet — persistence comes in Phase 6).
- Depth/pagination handling for very large histories (don't parse 50k commits
  synchronously in one request).
- `GET /api/repos/:repoId/commits` — returns parsed commit list (paginated).

**Expected outcome:** A validated, cloned repo can be turned into a clean,
structured list of commits.

**Acceptance criteria:**
- For a small known test repo, the endpoint returns the expected number of
  commits with all required fields populated.
- A specific known commit's diff stats match `git show --stat` output for
  that commit.
- A large repo's commit list is paginated rather than returned in one giant
  payload.

**Files likely to change:** `src/services/gitParserService.js` (new),
`src/models/Commit.js`, `src/models/Author.js`,
`src/controllers/repoController.js`, `src/routes/repoRoutes.js`.

**Suggested commit(s):**
- `feat: parse git commit history into structured commit/author data`

---

## Phase 4 — Timeline Construction API

**Goal:** Transform raw parsed commit data into an ordered, branch-aware
"timeline" structure, deliberately kept **minimal per bubble** — the primary
data contract for the frontend's core "dive line" feature.

**Why it exists:** The interactive timeline is GitDive's headline feature.
This is the API surface the frontend teammate will build against most, so it
needs to be introduced early (right after raw data is available) and kept
stable. Per the frontend mockup, each commit renders as a bare, unlabeled-until-hover
bubble along a vertical line — so this endpoint intentionally returns only
what's needed to place and identify each bubble, not the hover content
(that's Phase 7's job, fetched lazily).

**Features to implement:**
- `src/services/timelineService.js` — orders commits chronologically, attaches
  branch relationship info, groups by branch where relevant.
- `src/controllers/timelineController.js`, `src/routes/timelineRoutes.js`:
  - `GET /api/repos/:repoId/timeline` — supports query params: `branch`,
    `since`, `until`, `limit`/`cursor` for pagination.
  - Minimal per-item response shape (deliberately excludes diff stats and
    summaries, which are hover-only and lazy-loaded via Phase 7):
    ```json
    {
      "hash": "a1b2c3d",
      "order": 12,
      "author": "jane-doe",
      "branch": "main"
    }
    ```
- Document the response shape in the README so the frontend teammate has a
  stable contract to build against immediately, including a note that
  `date`, `filesChanged`, and `summary` live behind the separate hover-detail
  endpoint in Phase 7 and are fetched per-bubble on hover, not bundled here.

**Expected outcome:** Frontend can fetch an ordered, filterable timeline —
lightweight enough to render hundreds of bubbles at once — for any
successfully cloned/parsed repo.

**Acceptance criteria:**
- Timeline commits are returned in correct chronological order.
- Filtering by branch and by date range returns the correct subset.
- Response payload per commit excludes diff/summary data (verified by
  checking payload size stays flat regardless of diff size).
- Response schema is documented and doesn't change without a version note.

**Files likely to change:** `src/services/timelineService.js` (new),
`src/controllers/timelineController.js` (new), `src/routes/timelineRoutes.js`
(new), `README.md`.

**Suggested commit(s):**
- `feat: expose minimal repository timeline API for bubble rendering`

---

## Phase 5 — Repository Statistics & Insights

**Goal:** Compute aggregate insights from parsed commit data: contributor
activity, commit frequency over time, most-changed files, additions/deletions
totals.

**Why it exists:** Purely derived from Phase 3's data with no new external
dependencies — a natural, low-risk feature to add once raw data exists, and
adds clear product value (the "insights" part of the spec).

**Features to implement:**
- `src/services/statsService.js` — computes: commits per author, commits per
  week/month, top N most-changed files, total additions/deletions, branch
  count.
- `GET /api/repos/:repoId/stats`.

**Expected outcome:** A single endpoint summarizing a repo's activity and
contributor patterns.

**Acceptance criteria:**
- Stats match hand-verified numbers for a small fixture repo.
- Endpoint responds within an acceptable time bound for a medium-sized repo
  (define and document a threshold, e.g. < 5s for ~5,000 commits already
  parsed).

**Files likely to change:** `src/services/statsService.js` (new),
`src/controllers/statsController.js` (new), `src/routes/statsRoutes.js` (new).

**Suggested commit(s):**
- `feat: add repository statistics and insights endpoint`

---

## Phase 6 — Persistence Layer (Caching)

**Goal:** Introduce SQLite-backed persistence to cache parsed repo data and
avoid re-cloning/re-parsing the same repository on every request.

**Why it exists:** Deliberately placed *after* Phases 3–5, not before —
the shape of commit/timeline/stats data was still being finalized in earlier
phases, and persisting an unstable schema would mean rewriting migrations
repeatedly. Now that the data shape is proven in practice, persistence is
introduced once, correctly.

**Features to implement:**
- `src/db.js` — `better-sqlite3` connection setup, schema creation on first run
  (`repos`, `commits`, `ai_summaries` tables).
- A small repository/data-access layer (e.g. `src/services/cacheService.js`)
  so controllers don't write raw SQL directly.
- Cache-check logic: on repo request, check DB first; if fresh (within a
  configurable TTL, e.g. 24h) serve from cache; otherwise re-clone/parse and
  update the cache. Support an explicit `?refresh=true` override.
- Update Phase 1–5 controllers to read/write through this cache layer.

**Expected outcome:** Repeated requests for the same repo are fast and don't
re-trigger cloning.

**Acceptance criteria:**
- First request for a repo triggers clone+parse; second request for the same
  repo (within TTL) is served from SQLite without re-cloning (verified by
  timing or by asserting the clone service isn't invoked).
- `?refresh=true` bypasses the cache.
- SQLite database file is created automatically on first run — no manual
  setup step required.

**Files likely to change:** `src/db.js`, `src/services/cacheService.js` (new),
`src/models/*.js` (schema definitions), controllers from Phases 1, 3, 4, 5.

**Suggested commit(s):**
- `feat: add SQLite caching layer for repositories, commits, and summaries`

---

## Phase 7 — Gemini AI Integration & Hover Detail Endpoint

**Goal:** Send structured, well-shaped context (commit diffs, messages,
timeline segments) to Gemini, and expose a single **hover-detail endpoint**
that returns the three fields the frontend bubble needs on hover — commit
date, files changed, and a 2–3 line AI summary — in one call.

**Why it exists:** AI is the differentiating feature, but it's introduced only
now — after timeline/stats/caching are solid — so that (a) prompts are built
against a stable, known data shape, and (b) caching (Phase 6) is already in
place to avoid paying for redundant API calls on every hover. Bundling date +
files changed + summary into one response also matches the frontend
interaction exactly: a single hover triggers a single fetch, not three.

**Features to implement:**
- `src/services/geminiService.js` — wraps `@google/generative-ai`, handles
  API key config, retries on transient failure.
- `src/utils/promptBuilder.js` — builds a token-safe prompt (truncates large
  diffs) that asks Gemini specifically for a **2–3 line summary**, matching
  the bubble's fixed hover space.
- `src/controllers/aiController.js`, `src/routes/aiRoutes.js`:
  - `GET /api/repos/:repoId/commits/:hash/detail` — the hover-trigger
    endpoint. Combines Phase 3's already-parsed `date` and `filesChanged`
    with a Gemini-generated `summary` (generated on first request, served
    from cache after):
    ```json
    {
      "hash": "a1b2c3d",
      "date": "2024-03-14T10:22:00Z",
      "filesChanged": ["src/app.js", "src/routes/repoRoutes.js"],
      "summary": "Added repo validation route and wired it to the GitHub API. Introduces the first error-handling pattern reused later."
    }
    ```
  - `POST /api/repos/:repoId/summary` — AI narrative summary of the repo's
    overall evolution (separate, coarser-grained feature, not part of the
    per-bubble hover flow).
- Persist AI responses in the `ai_summaries` table (Phase 6 schema), keyed by
  commit hash, so repeat hovers — by the same or a different user — never
  re-call Gemini for a commit that's already been summarized.
- Simple in-memory rate limiting on `/detail` and `/summary` specifically
  (they're the expensive ones); `/detail` in particular should be allowed a
  higher burst limit than `/summary` since hovering quickly across several
  bubbles is normal usage, not abuse.

**Expected outcome:** Hovering a bubble on the frontend resolves to one fast
API call that returns exactly the three fields the UI displays, with AI cost
controlled via per-commit caching.

**Acceptance criteria:**
- `GET /commits/:hash/detail` for a known commit returns `date`,
  `filesChanged`, and a `summary` of roughly 2–3 sentences grounded in that
  commit's actual message/diff content.
- A second request for the same commit's detail is served from cache (no new
  Gemini call), and is noticeably faster than the first.
- Missing/invalid `GEMINI_API_KEY` produces a clear runtime error on the
  affected endpoints — it does not crash the whole server, and `date`/
  `filesChanged` degrade gracefully (still returned) even if `summary`
  generation fails.

**Files likely to change:** `src/services/geminiService.js` (new),
`src/utils/promptBuilder.js` (new), `src/controllers/aiController.js` (new),
`src/routes/aiRoutes.js` (new), `.env.example` (add `GEMINI_API_KEY`).

**Suggested commit(s):**
- `feat: integrate Gemini and add per-commit hover detail endpoint`

---

## Phase 8 — Cross-Cutting Hardening

**Goal:** Consolidate error handling, input validation, rate limiting, and
security headers across all endpoints built so far.

**Why it exists:** Deliberately placed after the feature set is complete
rather than perfected per-phase — repeating full hardening at every phase
would be premature abstraction while the API surface was still changing.
Once the surface is stable, harden it once, consistently.

**Features to implement:**
- Review/tighten `src/middlewares/errorHandler.js` for a consistent JSON
  error envelope (`{ error: { message, code } }`) across all routes.
- `zod` validation on every route accepting input (audit Phases 1–7).
- `express-rate-limit` on clone and AI endpoints specifically (the expensive
  ones).
- `helmet` for baseline security headers.
- Request logging middleware (method, path, status, duration).

**Expected outcome:** All endpoints behave consistently and predictably under
bad input, and expensive endpoints are protected from abuse.

**Acceptance criteria:**
- Sending malformed input to any endpoint returns a consistent `400` error
  shape.
- Hammering the clone or AI-explain endpoint triggers a `429` after the
  configured limit.
- An unhandled exception anywhere in the app still returns a JSON error, not
  a raw stack trace, and the server stays up.

**Files likely to change:** `src/middlewares/*`, all route files (validation
wiring), `src/app.js`.

**Suggested commit(s):**
- `chore: harden API with validation, rate limiting, and consistent error handling`

---

## Phase 9 — Automated Testing

**Goal:** Add a test suite (unit + integration) covering the core services and
endpoints, using a small fixture repository.

**Why it exists:** Placed after the feature set and hardening are done so
tests verify real, settled behavior rather than being rewritten every time an
endpoint shape changes. Still comes before final docs/polish so regressions
are caught while the code is fresh.

**Features to implement:**
- `jest` + `supertest`, configured via `package.json` scripts.
- A small local git repository fixture (either checked into
  `tests/fixtures/` as a bare repo, or generated programmatically at test
  setup time) used for deterministic, offline testing.
- Unit tests: `gitParserService`, `timelineService`, `statsService`,
  `promptBuilder`.
- Integration tests: `/api/repos/validate`, `/api/repos/clone`,
  `/api/repos/:id/commits`, `/api/repos/:id/timeline`, `/api/repos/:id/stats`,
  and the AI endpoints with `geminiService` mocked (no real API calls in CI).

**Expected outcome:** `npm test` gives confidence the core pipeline works
without hitting GitHub or Gemini.

**Acceptance criteria:**
- `npm test` passes locally and requires no network access (fixture repo is
  local, Gemini is mocked).
- Core services (parser, timeline, stats) have unit test coverage for their
  main paths and at least one edge case each (e.g. empty repo, single commit).

**Files likely to change:** `package.json` (scripts/devDeps),
`tests/` (new directory), `jest.config.js` (new).

**Suggested commit(s):**
- `test: add unit and integration test suite with fixture repository`

---

## Phase 10 — API Documentation & Frontend Handoff

**Goal:** Document every endpoint's request/response contract so the frontend
teammate can integrate without needing to read backend source.

**Why it exists:** Comes last because documenting a still-changing API wastes
effort; now that Phases 0–9 have produced a stable, tested surface, this is
the point where locking in and publishing the contract has the most value.

**Features to implement:**
- Either `swagger-jsdoc` + `swagger-ui-express` mounted at `/api/docs`
  (auto-generated from route-level JSDoc comments, stays in sync with code),
  or — if the team prefers less setup for an MVP — a thorough README table of
  endpoints, params, and example request/response JSON. Recommendation:
  Swagger, since the low setup cost is repaid by never going stale.
- Example payloads for every endpoint.
- A "Getting Started" section in the README: env vars needed, how to run
  locally, how to point the frontend at it.

**Expected outcome:** A new developer (or the frontend teammate) can run the
backend and correctly call every endpoint using only the README/docs.

**Acceptance criteria:**
- `/api/docs` (if Swagger) renders and accurately reflects every implemented
  route.
- README setup instructions, followed exactly on a clean machine, result in a
  running server.

**Files likely to change:** `README.md`, JSDoc comments across
`src/routes/*`, `src/app.js` (mount docs route).

**Suggested commit(s):**
- `docs: add API documentation and frontend integration guide`

---

## Testing Note (applies throughout)

Formal automated testing infrastructure is introduced in Phase 9, but every
phase above has explicit, manually-verifiable acceptance criteria — each
phase should be checked against those criteria before moving on, even before
Jest exists. This avoids two failure modes: building test infrastructure
before there's stable behavior to test, and shipping untested behavior with
no verification method at all.

---

## Future Extensibility (explicitly out of scope for MVP)

These are natural next steps once the MVP above is complete and validated —
listed here so they're not accidentally designed into the MVP prematurely:

- **Authentication & private repos** — OAuth with GitHub to support private
  repository access.
- **Background job queue** (e.g. BullMQ + Redis) — for very large repos where
  clone+parse should happen asynchronously with progress updates instead of
  blocking a request.
- **Streaming AI responses** — websockets or SSE so commit explanations stream
  token-by-token to the frontend instead of waiting for the full response.
- **Multi-repo comparison** — diffing insights/timelines across two repos.
- **Postgres migration** — if concurrent usage outgrows SQLite; the
  cache-service abstraction from Phase 6 is designed to make this a
  contained change.
- **Dockerization & deployment tooling** — once the API is stable and the
  frontend is integrating against it regularly.
- **Branch/PR-level visualization data** — richer graph structures beyond the
  linear/branch-aware timeline in Phase 4.
- **Pre-generated hover summaries** — instead of generating a commit's AI
  summary on first hover, a background job could pre-generate and cache
  summaries for all commits right after clone/parse, eliminating first-hover
  latency entirely. Deferred from the MVP since on-demand + cache (Phase 7)
  is simpler and already keeps repeat hovers fast.
