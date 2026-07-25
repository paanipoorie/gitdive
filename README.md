# gitdive

A GitHub repository analysis tool.

## Project Structure

```
gitdive/
├── backend/          # Node.js/Express API
├── frontend/         # Frontend application (teammate)
├── docs/             # Documentation
├── docker-compose.yml
└── README.md
```

## Backend

- **Framework**: Node.js/Express
- **Structure**:
  - `src/config/` - Configuration files
  - `src/controllers/` - Request handlers
  - `src/middleware/` - Express middleware
  - `src/models/` - Data models
  - `src/routes/` - API routes
  - `src/services/` - Business logic
  - `src/utils/` - Utility functions
  - `src/jobs/` - Background jobs
  - `src/lib/` - Shared libraries
  - `src/app.js` - Express app setup
  - `src/server.js` - Entry point

## Getting Started

### Prerequisites
- Node.js
- Docker (optional)

### Installation
```bash
cd backend
npm install
```

### Development
```bash
npm run dev
```

### Docker
```bash
docker-compose up
```

## API Endpoints Overview

- `POST /api/repos/validate` - Validate GitHub URL
- `POST /api/repos/clone` - Shallow clone repository into temp dir
- `GET /api/repos/:repoId/commits` - Paginated commit history with diff stats
- `GET /api/repos/:repoId/timeline` - Minimal commit timeline payload for dive line bubble rendering (`hash`, `shortHash`, `order`, `author`, `branch`)
- `GET /api/repos/:repoId/stats` - Aggregate repository statistics (authors, top files, activity, additions/deletions)

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Roadmap](docs/roadmap.md)
- [Phases](docs/PHASES.md)

## License

[LICENSE](LICENSE)