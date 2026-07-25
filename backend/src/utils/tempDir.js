const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID: uuidv4 } = require('crypto');

const TEMP_BASE = path.join(os.tmpdir(), 'gitdive');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const activeDirs = new Map();

function ensureTempBase() {
  if (!fs.existsSync(TEMP_BASE)) {
    fs.mkdirSync(TEMP_BASE, { recursive: true });
  }
}

function createTempDir() {
  ensureTempBase();
  const dirName = `gitdive-${uuidv4()}`;
  const dirPath = path.join(TEMP_BASE, dirName);
  fs.mkdirSync(dirPath, { recursive: true });
  const entry = {
    path: dirPath,
    createdAt: Date.now(),
    ttl: DEFAULT_TTL_MS,
  };
  activeDirs.set(dirPath, entry);
  return dirPath;
}

function trackDir(dirPath, metadata = {}) {
  const ttlMs = metadata.ttl || DEFAULT_TTL_MS;
  const entry = {
    path: dirPath,
    createdAt: Date.now(),
    ttl: ttlMs,
    ...metadata,
  };
  activeDirs.set(dirPath, entry);
  return entry;
}

function getDirInfo(dirPath) {
  return activeDirs.get(dirPath);
}

function getDirByRepoId(repoId) {
  for (const entry of activeDirs.values()) {
    if (entry.repoId === repoId) {
      return entry;
    }
  }
  return null;
}

function cleanupDir(dirPath) {
  const entry = activeDirs.get(dirPath);
  if (!entry) return false;

  try {
    if (fs.existsSync(entry.path)) {
      fs.rmSync(entry.path, { recursive: true, force: true });
    }
    activeDirs.delete(dirPath);
    return true;
  } catch (err) {
    console.error(`Failed to cleanup temp dir ${dirPath}:`, err.message);
    return false;
  }
}

function cleanupExpired() {
  const now = Date.now();
  for (const [dirPath, entry] of activeDirs.entries()) {
    if (now - entry.createdAt > entry.ttl) {
      cleanupDir(dirPath);
    }
  }
}

function getTempBase() {
  return TEMP_BASE;
}

const timer = setInterval(cleanupExpired, 60 * 60 * 1000);
if (timer.unref) timer.unref();

module.exports = {
  createTempDir,
  trackDir,
  getDirInfo,
  getDirByRepoId,
  cleanupDir,
  cleanupExpired,
  getTempBase,
};