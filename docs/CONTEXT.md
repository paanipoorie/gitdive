# GitDive Context & Implementation Summary

## Overview

**GitDive** is an interactive GitHub repository exploration tool that transforms commit history into a vertical pixel-art ocean descent ("dive line"). As users scroll down through a repository's history, each commit is rendered as a creature bubble along a deep-sea cable. Hovering over a bubble reveals commit dates, modified file lists, and concise AI-generated summaries.

---

## Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                  │
│   - Pixel-art underwater ocean environment & diver theme     │
│   - Scroll-driven commit descent navigation                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Node.js/Express)                │
│   - Express API routes & rate limiters                     │
│   - Git history parser via `simple-git`                    │
│   - Gemini AI integration (@google/generative-ai)          │
│   - SQLite persistence via `better-sqlite3`                │
│   - Swagger API Documentation (/api/docs)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
 ┌──────────▼──────────┐               ┌──────────▼──────────┐
 │     GitHub API      │               │   Google Gemini AI  │
 └─────────────────────┘               └─────────────────────┘
```

- **Backend Framework**: Node.js + Express
- **Git Operations**: `simple-git` CLI wrapper for shallow clones and log/diff extraction
- **Database & Caching**: `better-sqlite3` (WAL mode, automated schema migration)
- **AI Engine**: `@google/generative-ai` (`gemini-1.5-flash`) with fallback
- **Validation**: `zod`
- **Security & Hardening**: `helmet`, `express-rate-limit`, CORS
- **Testing**: `jest` + `supertest`
- **Documentation**: `swagger-jsdoc` + `swagger-ui-express`

---

## Complete Implementation Summary

### Phase 0 — Project Bootstrapping & Configuration
- Built Express application in `backend/src/app.js` and server entrypoint `backend/src/server.js`.
- Configured centralized environment loading (`config.js`), logging (`logger.js`), and global error handling (`errorHandler.js`).
- Implemented `GET /api/health` returning operational status.

### Phase 1 — Repository URL Validation
- Implemented `POST /api/repos/validate` using Zod URL schema parsing.
- Interfaced with GitHub REST API (`githubService.js`) to verify public repository accessibility, branch metadata, and star counts before triggering heavy clone workflows.

### Phase 2 — Repository Cloning & Temp Storage Lifecycle
- Implemented `POST /api/repos/clone` in `gitCloneService.js` performing shallow clones (`--depth 500`) into isolated temp directories under `os.tmpdir()/gitdive`.
- Built `tempDir.js` lifecycle tracker with TTL cleanup and size guards (rejecting repositories > 500MB).

### Phase 3 — Git History Parsing & Data Extraction
- Created `Author` and `Commit` models (`src/models/`).
- Built `gitParserService.js` parsing git logs, branch refs, parent hashes, line additions/deletions, and changed file lists.
- Exposed `GET /api/repos/:repoId/commits` with pagination support.

### Phase 4 — Timeline Construction API
- Implemented `timelineService.js` and `timelineController.js`.
- Exposed `GET /api/repos/:repoId/timeline` returning a minimal payload (`hash`, `shortHash`, `order`, `author`, `branch`, `date`) optimized for high-performance bubble list rendering.

### Phase 5 — Repository Statistics & Insights
- Built `statsService.js` computing aggregate analytics:
  - Total insertions and deletions
  - Author leaderboards (commit count, additions, deletions)
  - Top 10 most changed files
  - Monthly commit activity timeline (`YYYY-MM`)
- Exposed `GET /api/repos/:repoId/stats`.

### Phase 6 — Persistence Layer & SQLite Caching
- Created SQLite database manager `src/db.js` initializing three core tables:
  - `repos`: session metadata, URL, default branch, size, temp path, timestamps
  - `commits`: parsed commit details, parent links, file lists, line changes
  - `ai_summaries`: cached commit hover explanations and overall project narratives
- Implemented `cacheService.js` serving repeat repository and commit requests directly from SQLite without re-cloning.

### Phase 7 — Gemini AI Integration & Hover Detail Endpoint
- Created `promptBuilder.js` for token-safe Gemini prompt construction.
- Built `geminiService.js` wrapping `@google/generative-ai` with automatic fallback summaries if `GEMINI_API_KEY` is missing or unconfigured.
- Exposed `GET /api/repos/:repoId/commits/:hash/detail` returning date, changed files, and a 2–3 sentence AI hover summary.
- Exposed `POST /api/repos/:repoId/summary` & `GET /api/repos/:repoId/summary` returning an overall project evolution narrative.
- Connected backend endpoints to `frontend/explorer.js`.

### Phase 8 — Cross-Cutting Hardening
- Added rate limiters (`rateLimiter.js`):
  - `cloneLimiter`: Max 20 requests per 15 minutes
  - `aiLimiter`: Max 100 requests per 15 minutes
- Enforced `helmet` headers and standardized JSON error envelope (`{ error: { message, code } }`).

### Phase 9 — Automated Testing
- Created Jest configuration (`jest.config.js`).
- Implemented unit tests (`promptBuilder.test.js`) and integration tests (`api.test.js`) using `supertest`.

### Phase 10 — API Documentation
- Configured Swagger UI in `src/config/swagger.js`.
- Mounted interactive API documentation at `http://localhost:3000/api/docs`.
- Updated `docs/api.md` with complete request and response JSON specifications.

---

## Core API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/repos/validate` | Validate GitHub URL |
| `POST` | `/api/repos/clone` | Clone repo & create session |
| `GET` | `/api/repos/:repoId/commits` | Paginated commit history with diff stats |
| `GET` | `/api/repos/:repoId/timeline` | Lightweight timeline payload for dive line |
| `GET` | `/api/repos/:repoId/stats` | Repository insights & activity analytics |
| `GET` | `/api/repos/:repoId/commits/:hash/detail` | Per-commit AI hover summary & details |
| `GET` / `POST` | `/api/repos/:repoId/summary` | Overall repository history AI summary |
| `GET` | `/api/docs` | Interactive Swagger API documentation |

---

## Repository Structure

```
gitdive/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & Swagger setup
│   │   ├── controllers/     # Route handlers (repos, timeline, stats, AI)
│   │   ├── middleware/      # Rate limiters & centralized error handler
│   │   ├── models/          # Author & Commit data models
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # GitHub API, Git parser, timeline, stats, Gemini, cache
│   │   ├── utils/           # Configuration, logger, validators, temp directory
│   │   ├── app.js           # Express app definition
│   │   ├── db.js            # SQLite database initialization
│   │   └── server.js        # Server entrypoint
│   ├── tests/               # Jest unit and integration tests
│   ├── jest.config.js
│   └── package.json
├── frontend/                # Visual expedition UI & explorer
│   ├── index.html
│   ├── explorer.html
│   ├── explorer.js          # API integration & scroll observer
│   └── styles.css
├── docs/                    # Documentation
│   ├── CONTEXT.md           # This implementation context file
│   ├── PHASES.md            # Detailed development roadmap & phase specs
│   ├── api.md               # API endpoint reference
│   ├── architecture.md      # System architecture & data flow
│   └── roadmap.md           # High-level product roadmap
└── README.md
```
