const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../gitdive.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS repos (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      default_branch TEXT,
      size INTEGER,
      temp_path TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS commits (
      id TEXT PRIMARY KEY,
      repo_id TEXT NOT NULL,
      hash TEXT NOT NULL,
      short_hash TEXT NOT NULL,
      author_name TEXT,
      author_email TEXT,
      date TEXT,
      message TEXT,
      parents TEXT,
      branches TEXT,
      files TEXT,
      additions INTEGER DEFAULT 0,
      deletions INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_summaries (
      id TEXT PRIMARY KEY,
      repo_id TEXT NOT NULL,
      commit_hash TEXT,
      summary TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(repo_id, commit_hash)
    );
  `);
  logger.info({ dbPath }, 'Database initialized successfully');
}

initDb();

module.exports = db;
