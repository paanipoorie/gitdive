# GitDive API Reference

## Base URL
```
http://localhost:3000/api
```

## Swagger UI Documentation
Interactive API docs are hosted at:
```
http://localhost:3000/api/docs
```

## Endpoints

### 1. Health Check
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-07-25T12:00:00.000Z"
}
```

---

### 2. Repository Validation
Validate a GitHub URL before cloning.
```
POST /repos/validate
```
Request Body:
```json
{
  "url": "https://github.com/owner/repository"
}
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "owner": "owner",
    "name": "repository",
    "fullName": "owner/repository",
    "description": "Repo description",
    "defaultBranch": "main",
    "size": 1024,
    "stars": 42,
    "isPrivate": false
  }
}
```

---

### 3. Repository Clone & Session Setup
Shallow clone or retrieve cached session ID for a repository.
```
POST /repos/clone
```
Query Params:
- `refresh` (boolean, default: false) - Bypass cache and re-clone.

Request Body:
```json
{
  "url": "https://github.com/owner/repository"
}
```
Response `200`:
```json
{
  "success": true,
  "cached": false,
  "data": {
    "repoId": "uuid-v4-session-id",
    "owner": "owner",
    "name": "repository",
    "fullName": "owner/repository",
    "defaultBranch": "main",
    "size": 1024,
    "latestCommit": {
      "hash": "a1b2c3d...",
      "message": "feat: add initial feature",
      "author": "Author Name"
    }
  }
}
```

---

### 4. Parsed Commits List
Fetch structured commit history with diff statistics.
```
GET /repos/:repoId/commits
```
Query Params:
- `page` (number, default: 1)
- `limit` (number, default: 30)

Response `200`:
```json
{
  "success": true,
  "data": {
    "commits": [
      {
        "hash": "a1b2c3d4e5f...",
        "shortHash": "a1b2c3d",
        "author": {
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "date": "2026-07-25T10:00:00Z",
        "message": "feat: add ocean background",
        "parents": ["f9e8d7c..."],
        "branches": ["main"],
        "files": ["styles.css", "index.html"],
        "additions": 45,
        "deletions": 2
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 30,
      "total": 120
    }
  }
}
```

---

### 5. Minimal Commit Timeline
Lightweight timeline payload specifically designed for rendering vertical dive line commit bubbles.
```
GET /repos/:repoId/timeline
```
Query Params:
- `branch` (string, optional)
- `since` (ISO date, optional)
- `until` (ISO date, optional)
- `page` (number, default: 1)
- `limit` (number, default: 100)

Response `200`:
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "hash": "a1b2c3d4e5f...",
        "shortHash": "a1b2c3d",
        "order": 1,
        "author": "Jane Doe",
        "branch": "main",
        "date": "2026-07-25T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 100,
      "total": 120
    }
  }
}
```

---

### 6. Repository Statistics & Insights
Aggregate repository activity and top contributors/files.
```
GET /repos/:repoId/stats
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "totalCommits": 120,
    "totalAdditions": 4500,
    "totalDeletions": 320,
    "branchCount": 3,
    "authors": [
      {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "commits": 80,
        "additions": 3000,
        "deletions": 200
      }
    ],
    "topFiles": [
      { "file": "src/app.js", "changes": 15 }
    ],
    "commitActivity": [
      { "month": "2026-07", "count": 120 }
    ]
  }
}
```

---

### 7. Per-Commit Hover Detail (AI-Powered)
Lazy-loaded endpoint triggered when user hovers over a commit bubble. Returns the 3 required fields (date, filesChanged, Gemini summary).
```
GET /repos/:repoId/commits/:hash/detail
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "hash": "a1b2c3d...",
    "date": "2026-07-25T10:00:00Z",
    "filesChanged": ["styles.css", "index.html"],
    "summary": "Added deep-sea palette and responsive CSS rules for dive line bubbles."
  }
}
```

---

### 8. Repository History Narrative Summary (Gemini)
Complete narrative summary of repository evolution.
```
POST /repos/:repoId/summary
GET /repos/:repoId/summary
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "repoId": "uuid-v4-session-id",
    "summary": "Across 120 commits, this project evolved from its initial setup to a complete interactive experience..."
  }
}
```

---

## Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```