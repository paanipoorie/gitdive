const db = require('../db');
const { randomUUID: uuidv4 } = require('crypto');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getRepoByUrl(url, maxAgeMs = CACHE_TTL_MS) {
  const stmt = db.prepare('SELECT * FROM repos WHERE url = ?');
  const repo = stmt.get(url);
  if (!repo) return null;

  if (Date.now() - repo.updated_at > maxAgeMs) {
    return null;
  }
  return repo;
}

function getRepoById(repoId) {
  const stmt = db.prepare('SELECT * FROM repos WHERE id = ?');
  return stmt.get(repoId) || null;
}

function saveRepo(data) {
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO repos (id, owner, name, full_name, url, default_branch, size, temp_path, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      owner = excluded.owner,
      name = excluded.name,
      full_name = excluded.full_name,
      default_branch = excluded.default_branch,
      size = excluded.size,
      temp_path = excluded.temp_path,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    data.id,
    data.owner,
    data.name,
    data.fullName,
    data.url,
    data.defaultBranch || 'main',
    data.size || 0,
    data.tempPath || null,
    now
  );

  return getRepoByUrl(data.url);
}

function getCachedCommits(repoId, { page = 1, limit = 30 } = {}) {
  const offset = (page - 1) * limit;
  const countStmt = db.prepare('SELECT COUNT(*) as total FROM commits WHERE repo_id = ?');
  const totalRes = countStmt.get(repoId);
  const total = totalRes ? totalRes.total : 0;

  if (total === 0) return null;

  const stmt = db.prepare(`
    SELECT * FROM commits WHERE repo_id = ?
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(repoId, limit, offset);

  const commits = rows.map(r => ({
    hash: r.hash,
    shortHash: r.short_hash,
    author: {
      name: r.author_name,
      email: r.author_email,
    },
    date: r.date,
    message: r.message,
    parents: JSON.parse(r.parents || '[]'),
    branches: JSON.parse(r.branches || '[]'),
    files: JSON.parse(r.files || '[]'),
    additions: r.additions,
    deletions: r.deletions,
  }));

  return {
    commits,
    pagination: {
      page: Number(page),
      perPage: Number(limit),
      total,
    },
  };
}

function saveCommits(repoId, commits) {
  const repoCheck = db.prepare('SELECT id FROM repos WHERE id = ?').get(repoId);
  if (!repoCheck) {
    db.prepare(`
      INSERT OR IGNORE INTO repos (id, owner, name, full_name, url, default_branch, size, temp_path, updated_at)
      VALUES (?, 'local', ?, ?, ?, 'main', 0, NULL, ?)
    `).run(repoId, repoId, repoId, `local://${repoId}`, Date.now());
  }

  const deleteStmt = db.prepare('DELETE FROM commits WHERE repo_id = ?');
  const insertStmt = db.prepare(`
    INSERT INTO commits (id, repo_id, hash, short_hash, author_name, author_email, date, message, parents, branches, files, additions, deletions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((items) => {
    deleteStmt.run(repoId);
    const now = Date.now();
    for (const c of items) {
      insertStmt.run(
        uuidv4(),
        repoId,
        c.hash,
        c.shortHash || c.hash.substring(0, 7),
        c.author?.name || 'Unknown',
        c.author?.email || '',
        c.date,
        c.message,
        JSON.stringify(c.parents || []),
        JSON.stringify(c.branches || []),
        JSON.stringify(c.files || []),
        c.additions || 0,
        c.deletions || 0,
        now
      );
    }
  });

  transaction(commits);
}

function getCachedSummary(repoId, commitHash = 'OVERALL') {
  const stmt = db.prepare('SELECT summary FROM ai_summaries WHERE repo_id = ? AND commit_hash = ?');
  const row = stmt.get(repoId, commitHash);
  return row ? row.summary : null;
}

function saveSummary(repoId, commitHash = 'OVERALL', summary) {
  const repoCheck = db.prepare('SELECT id FROM repos WHERE id = ?').get(repoId);
  if (!repoCheck) {
    db.prepare(`
      INSERT OR IGNORE INTO repos (id, owner, name, full_name, url, default_branch, size, temp_path, updated_at)
      VALUES (?, 'local', ?, ?, ?, 'main', 0, NULL, ?)
    `).run(repoId, repoId, repoId, `local://${repoId}`, Date.now());
  }

  const stmt = db.prepare(`
    INSERT INTO ai_summaries (id, repo_id, commit_hash, summary, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(repo_id, commit_hash) DO UPDATE SET
      summary = excluded.summary,
      created_at = excluded.created_at
  `);
  stmt.run(uuidv4(), repoId, commitHash, summary, Date.now());
}

function getAllCommitSummaries(repoId) {
  const stmt = db.prepare("SELECT commit_hash, summary FROM ai_summaries WHERE repo_id = ? AND commit_hash != 'OVERALL'");
  const rows = stmt.all(repoId);
  const map = {};
  for (const r of rows) {
    if (r.commit_hash) {
      map[r.commit_hash] = r.summary;
    }
  }
  return map;
}

function getChronologicalCachedCommits(repoId) {
  const stmt = db.prepare(`
    SELECT * FROM commits WHERE repo_id = ?
    ORDER BY date ASC
  `);
  const rows = stmt.all(repoId);
  return rows.map((r) => ({
    hash: r.hash,
    shortHash: r.short_hash,
    date: r.date,
    message: r.message,
    author: { name: r.author_name, email: r.author_email },
    files: JSON.parse(r.files || '[]'),
    additions: r.additions,
    deletions: r.deletions,
  }));
}

module.exports = {
  getRepoByUrl,
  getRepoById,
  saveRepo,
  getCachedCommits,
  getChronologicalCachedCommits,
  saveCommits,
  getCachedSummary,
  getAllCommitSummaries,
  saveSummary,
};

