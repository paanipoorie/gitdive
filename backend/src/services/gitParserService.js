const simpleGit = require('simple-git');
const Author = require('../models/Author');
const Commit = require('../models/Commit');
const { getDirByRepoId } = require('../utils/tempDir');
const logger = require('../utils/logger');

async function getCommits(repoId, options = {}) {
  const dirEntry = getDirByRepoId(repoId);
  if (!dirEntry || !dirEntry.path) {
    const err = new Error('Repository session not found');
    err.statusCode = 404;
    err.code = 'REPO_NOT_FOUND';
    throw err;
  }

  const page = parseInt(options.page || 1, 10);
  const limit = parseInt(options.limit || options.perPage || 30, 10);
  const skip = (page - 1) * limit;

  const git = simpleGit(dirEntry.path);

  let total = 0;
  try {
    const totalCountStr = await git.raw(['rev-list', '--count', 'HEAD']);
    total = parseInt(totalCountStr.trim(), 10) || 0;
  } catch (e) {
    logger.warn({ err: e, repoId }, 'Failed to count commits');
  }

  const parentMap = new Map();
  try {
    const rawParents = await git.raw(['log', '-n', String(limit), '--skip', String(skip), '--pretty=format:%H|%P']);
    rawParents.split('\n').forEach(line => {
      if (!line.trim()) return;
      const [h, p] = line.split('|');
      if (h) {
        parentMap.set(h.trim(), p ? p.trim().split(/\s+/).filter(Boolean) : []);
      }
    });
  } catch (e) {
    logger.warn({ err: e, repoId }, 'Failed to fetch raw parents');
  }

  const logResult = await git.log(['-n', String(limit), '--skip=' + String(skip), '--stat']);

  const commits = logResult.all.map((item) => {
    const diffFiles = item.diff ? item.diff.files.map(f => f.file) : [];
    const additions = item.diff ? item.diff.insertions : 0;
    const deletions = item.diff ? item.diff.deletions : 0;
    const parents = parentMap.get(item.hash) || [];

    const author = new Author({
      name: item.author_name,
      email: item.author_email,
    });

    return new Commit({
      hash: item.hash,
      author: author,
      date: item.date,
      message: item.message,
      parents: parents,
      branches: item.refs ? item.refs.split(',').map(r => r.trim()).filter(Boolean) : [],
      files: diffFiles,
      additions: additions,
      deletions: deletions,
    });
  });

  return {
    commits: commits.map(c => c.toJSON()),
    pagination: {
      page,
      perPage: limit,
      total,
    },
  };
}

module.exports = { getCommits };
