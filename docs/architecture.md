# gitdive Architecture

## Overview
GitHub repository analysis tool with a Node.js/Express backend and a separate frontend application.

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│  GitHub API │
│  (React)    │     │  (Express)  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │  Database   │
                    │  (PostgreSQL)│
                    └─────────────┘
```

## Backend Structure

```
backend/src/
├── config/         # Configuration (env, DB, external APIs)
├── controllers/    # Request handlers
├── middleware/     # Express middleware (auth, error handling, validation)
├── models/         # Data models (PostgreSQL/Prisma)
├── routes/         # API route definitions
├── services/       # Business logic (GitHub API, analysis)
├── utils/          # Helpers, constants, utilities
├── jobs/           # Background jobs (Bull/Redis)
├── lib/            # Shared libraries/clients
├── app.js          # Express app setup
└── server.js       # Entry point
```

## Data Flow

1. Frontend requests repository analysis
2. Backend queues analysis job
3. Worker fetches repo data from GitHub API
4. Analysis runs (languages, complexity, dependencies, etc.)
5. Results stored in database
6. Frontend polls for results

## Tech Stack

- **Backend**: Node.js, Express, TypeScript (planned)
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Bull + Redis
- **Cache**: Redis
- **Auth**: GitHub OAuth
- **Frontend**: React + TypeScript (separate repo)
- **Deployment**: Docker, Docker Compose