# gitdive API Reference

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Repositories

#### List Repositories
```
GET /repos
```
Query params:
- `page` (number, default: 1)
- `per_page` (number, default: 30)
- `sort` (string: updated, created, stars)

Response:
```json
{
  "repos": [],
  "pagination": {
    "page": 1,
    "per_page": 30,
    "total": 0
  }
}
```

#### Get Repository
```
GET /repos/:owner/:repo
```
Response:
```json
{
  "id": 123,
  "name": "repo-name",
  "owner": "owner-name",
  "description": "Repository description",
  "stars": 42,
  "forks": 10,
  "language": "TypeScript",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

#### Analyze Repository
```
GET /repos/:owner/:repo/analysis
```
Query params:
- `force` (boolean, default: false) - Force re-analysis

Response:
```json
{
  "job_id": "job-uuid",
  "status": "queued",
  "estimated_time": 30
}
```

#### Get Analysis Results
```
GET /repos/:owner/:repo/analysis/:job_id
```
Response:
```json
{
  "job_id": "job-uuid",
  "status": "completed",
  "results": {
    "languages": {"TypeScript": 60, "JavaScript": 40},
    "complexity": {"average": 3.2, "max": 15},
    "dependencies": 45,
    "issues": 12,
    "test_coverage": 65
  },
  "completed_at": "2024-01-15T10:35:00.000Z"
}
```

## Authentication

GitHub OAuth 2.0:
```
GET /auth/github
GET /auth/github/callback
```

## Error Responses
```json
{
  "message": "Error description",
  "statusCode": 400
}
```

## Rate Limiting
- 100 requests/minute for authenticated users
- 10 requests/minute for unauthenticated