# GitDive — Current Status

## Overview
Full-stack GitHub repository analysis tool. Users enter a GitHub URL, the backend clones it (shallow), parses git history, and generates AI-powered ocean-themed narrations for commits and the overall repository story via Google Gemini.

## Architecture

```
frontend/ (React 18 + Vite + framer-motion)
  ├── explorer.html / explorer.jsx  →  ExplorerApp
  ├── src/components/
  │   ├── RepoGate.jsx              URL input + diver picker
  │   ├── StickyDiver.jsx           Animated diver following scroll
  │   ├── CommitBubble.jsx          Commit card with on-demand AI summary
  │   └── SeabedSummary.jsx         Bottom-of-page repo story panel
  └── styles.css                    Ocean-themed pixel-art CSS

backend/ (Node.js + Express + SQLite)
  ├── src/server.js                 Entry point (dotenv, listen)
  ├── src/app.js                    Express app (helmet, cors, morgan, routes, swagger)
  ├── src/db.js                     SQLite init (better-sqlite3, WAL mode)
  ├── src/controllers/
  │   ├── aiController.js           Commit detail + repo summary handlers
  │   ├── repoController.js         Validate, clone, get commits
  │   ├── timelineController.js     Timeline data
  │   └── statsController.js        Aggregate stats
  ├── src/services/
  │   ├── geminiService.js          Google Generative AI wrapper
  │   ├── cacheService.js           SQLite CRUD for repos, commits, ai_summaries
  │   ├── gitCloneService.js        Shallow clone via simple-git
  │   ├── githubService.js          GitHub REST API client
  │   ├── gitParserService.js       Parse git log into structured commits
  │   ├── timelineService.js        Lightweight timeline payload
  │   └── statsService.js           Authors, top files, monthly activity
  ├── src/utils/
  │   ├── config.js                 Environment config
  │   ├── logger.js                 Pino logger
  │   ├── promptBuilder.js          Ocean-themed Gemini prompts
  │   └── validators.js             Zod URL validation
  ├── src/middleware/
  │   ├── errorHandler.js           404 + centralized error envelope
  │   └── rateLimiter.js            Clone & AI rate limiting
  └── src/routes/
      ├── index.js                  Health + /debug/gemini + mounts repos
      └── repoRoutes.js             All /api/repos/* endpoints
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/debug/gemini` | Debug: sends "Reply ONLY with: HELLO OCEAN", returns response |
| POST | `/api/repos/validate` | Validate GitHub URL |
| POST | `/api/repos/clone` | Shallow clone (rate limited: 20/15min) |
| GET | `/api/repos/:repoId/commits` | Paginated commits |
| GET | `/api/repos/:repoId/commits/:hash/detail` | Commit detail |
| POST | `/api/repos/:repoId/commits/:hash/summary` | AI commit narration (rate limited: 100/15min) |
| GET | `/api/repos/:repoId/summary` | Cached repo story |
| POST | `/api/repos/:repoId/summary` | AI repo story (rate limited: 100/15min) |
| GET | `/api/docs` | Swagger UI |

## Recent Fixes (commits 0f1a907 + 09f755b)

### Root cause of AI failures
The project was configured to use `gemini-1.5-flash`, which **returns 404** — this model is not available with the current API key. Available models include `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-3.5-flash`, etc.

### Changes made

**Model fix:**
- `geminiService.js`: Changed `MODEL_NAME` from `gemini-1.5-flash` → `gemini-2.5-flash`
- `routes/index.js`: Same fix in debug endpoint

**Configuration & startup:**
- `server.js`: Logs `✓ GEMINI_API_KEY loaded (length: N, starts with: XXXXXX...)` or `✗ GEMINI_API_KEY missing`
- `config.js`: Added `geminiApiKey` to config
- Logs SDK version (`@google/generative-ai`)

**Bug fixes:**
- `aiController.js`: Fixed `dbRepo` scoping bug (`ReferenceError` when `commitData` was built outside declaration scope). Moved `const dbRepo` to function scope.
- `cacheService.js` line 160: Fixed SQL quoting — `"OVERALL"` uses double quotes (SQLite identifier), changed to `'OVERALL'` (string literal). Caused `no such column: OVERALL` error in `getAllCommitSummaries`.
- `aiController.js`: Added DB fallback — when `getDirByRepoId()` returns null (in-memory map lost on restart), looks up `temp_path` from SQLite `repos` table.
- `aiController.js`: Now fetches git diff (`diff hash^..hash`) and passes `diffText` to `generateCommitSummary`.

**Logging (full pipeline auditability):**
- `geminiService.js`: Boxed log format —
  ```
  ---------------------------------
  [Gemini]
  Repository: <name>
  Commit: <hash>
  Model: gemini-2.5-flash
  Prompt length: <N>
  Calling Gemini...
  ---------------------------------
  Response received
  Token usage: { ... }
  Finish reason: "STOP"
  Response text: <truncated>
  Summary returned
  ```
- On error, logs: `error.message`, `error.status`, `error.stack`, `error.response`, `error.details`
- `aiController.js`: Logs `Received narration request`, `Commit data prepared`, controller errors with full details

**Debug endpoint (`GET /api/debug/gemini`):**
- Sends: "Reply ONLY with: HELLO OCEAN"
- Expected: "HELLO OCEAN"
- Returns model, prompt, response, success/error

**Frontend fixes:**
- `CommitBubble.jsx`: Removed client-side hardcoded fallback summaries (was silently substituting template text like "A quiet memory settled onto the reef...")
- Shows real backend error messages in red during development

**Dependencies:**
- `@google/generative-ai` upgraded from `^0.12.0` → `^0.24.1`

### Verified state (terminal logs)
```
✓ GEMINI_API_KEY loaded (length: 53, starts with: AQ.Ab8...)
✓ Received narration request
✓ [Gemini] section with model, prompt length
✓ Calling Gemini...
✓ Response received (Token usage, Finish reason: STOP)
✓ Summary returned
```

### Pipeline checks
- `GET /api/debug/gemini` → returns `"HELLO OCEAN"`
- `POST /api/repos/:repoId/commits/:hash/summary` → returns ocean-themed AI narration about THAT specific commit
- `POST /api/repos/:repoId/summary` → returns cohesive repo story with README context + chronological commits + ocean metaphor

## SDK details
- Package: `@google/generative-ai` v0.24.1
- Model: `gemini-2.5-flash`
- API key: AI Studio key (AQ. prefix), passed via `x-goog-api-key` header

## Known limitations
- GitHub token in `.env` may be invalid/expired — causes 401 from GitHub API, clone fails, frontend falls back to mock commits with `currentRepoId = null`, AI summaries cannot be requested
- `activeDirs` is in-memory (lost on restart); controller now falls back to DB `temp_path`
- Repo summary has 8000-char limit on commit history text; README capped at 2000 chars
- Diff text capped at 5000 chars for commit summaries

## Frontend flow
1. User enters GitHub URL → `POST /api/repos/validate` → `POST /api/repos/clone`
2. If clone fails → MOCK_COMMITS shown, `currentRepoId = null`, AI buttons disabled
3. If clone succeeds → `currentRepoId` set from response, real commits displayed
4. Commit bubble expanded → user clicks "Uncover Memory Story" → `POST /.../summary` → Gemini → rendered
5. Scrolled to bottom → "REVEAL OCEAN CHRONICLE" → `POST /.../summary` → Gemini repo story → animated

## Tests
- 10 tests pass (2 suites: API integration + prompt builder)
- `npm test` runs Jest
