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

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Roadmap](docs/roadmap.md)

## License

[LICENSE](LICENSE)