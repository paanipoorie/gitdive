const simpleGit = require('simple-git');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { createTempDir, cleanupDir, trackDir, getDirInfo } = require('../utils/tempDir');
const logger = require('../utils/logger');

const DEFAULT_MAX_SIZE = 500 * 1024 * 1024;
const DEFAULT_CLONE_DEPTH = 500;

async function cloneRepository(url, options = {}) {
  const {
    maxSize = DEFAULT_MAX_SIZE,
    depth = DEFAULT_CLONE_DEPTH,
    token = null,
  } = options;

  const repoId = uuidv4();
  const tempDir = createTempDir();
  trackDir(tempDir, { repoId, url });

  let authUrl = url;
  if (token) {
    authUrl = url.replace('https://', `https://${token}@`);
  }

  logger.info({ repoId, url, tempDir, depth }, 'Starting repository clone');

  const git = simpleGit(tempDir, { binary: 'git', timeout: 120000 });

  try {
    await git.clone(authUrl, '.', ['--depth', depth.toString(), '--single-branch']);

    const size = await getDirectorySize(tempDir);
    if (size > maxSize) {
      await cleanupDir(tempDir);
      const err = new Error(`Repository size (${Math.round(size / 1024 / 1024)}MB) exceeds limit (${Math.round(maxSize / 1024 / 1024)}MB)`);
      err.code = 'REPO_TOO_LARGE';
      err.statusCode = 413;
      throw err;
    }

    const repoInfo = await getRepoInfo(git, tempDir);

    logger.info({ repoId, size, ...repoInfo }, 'Repository cloned successfully');

    return {
      repoId,
      tempDir,
      size,
      ...repoInfo,
    };
  } catch (error) {
    await cleanupDir(tempDir);
    if (error.code === 'REPO_TOO_LARGE') throw error;

    logger.error({ err: error, repoId, url }, 'Failed to clone repository');

    if (error.message.includes('Authentication failed') || error.message.includes('could not read Username')) {
      const err = new Error('Authentication failed - repository may be private');
      err.code = 'REPO_PRIVATE';
      err.statusCode = 403;
      throw err;
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      const err = new Error('Repository not found');
      err.code = 'REPO_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    if (error.message.includes('timeout')) {
      const err = new Error('Clone operation timed out');
      err.code = 'CLONE_TIMEOUT';
      err.statusCode = 504;
      throw err;
    }

    const err = new Error(`Failed to clone repository: ${error.message}`);
    err.code = 'CLONE_FAILED';
    err.statusCode = 500;
    throw err;
  }
}

async function getRepoInfo(git, repoPath) {
  const log = await git.log({ maxCount: 1 });
  const branches = await git.branch(['-a']);
  const remotes = await git.getRemotes(true);

  return {
    latestCommit: log.latest ? {
      hash: log.latest.hash,
      message: log.latest.message,
      author: log.latest.author_name,
      email: log.latest.author_email,
      date: log.latest.date,
    } : null,
    branches: branches.all,
    currentBranch: branches.current,
    remotes: remotes.map(r => r.name),
  };
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        calculateSize(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        } catch (e) {
        }
      }
    }
  }

  calculateSize(dirPath);
  return totalSize;
}

async function cleanupRepo(repoId) {
  const info = getDirInfo(repoId);
  if (info && info.path) {
    await cleanupDir(info.path);
    return true;
  }
  return false;
}

module.exports = { cloneRepository, cleanupRepo, DEFAULT_MAX_SIZE, DEFAULT_CLONE_DEPTH };