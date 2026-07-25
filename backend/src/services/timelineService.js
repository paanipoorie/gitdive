const simpleGit = require('simple-git');
const { getDirByRepoId } = require('../utils/tempDir');
const logger = require('../utils/logger');

async function getTimeline(repoId, options = {}) {
  const dirEntry = getDirByRepoId(repoId);
  if (!dirEntry || !dirEntry.path) {
    const err = new Error('Repository session not found');
    err.statusCode = 404;
    err.code = 'REPO_NOT_FOUND';
    throw err;
  }

  const page = parseInt(options.page || 1, 10);
  const limit = parseInt(options.limit || options.perPage || 100, 10);
  const skip = (page - 1) * limit;
  const { branch, since, until } = options;

  const git = simpleGit(dirEntry.path);

  const gitArgs = [];
  if (branch) {
    gitArgs.push(branch);
  }
  if (since) {
    gitArgs.push(`--since=${since}`);
  }
  if (until) {
    gitArgs.push(`--until=${until}`);
  }

  let total = 0;
  try {
    const totalCountStr = await git.raw(['rev-list', '--count', ...gitArgs, branch || 'HEAD']);
    total = parseInt(totalCountStr.trim(), 10) || 0;
  } catch (e) {
    logger.warn({ err: e, repoId }, 'Failed to count timeline commits');
  }

  const logArgs = [
    '-n', String(limit),
    '--skip=' + String(skip),
    '--pretty=format:%H|%an|%D|%aI',
  ];

  if (branch) {
    logArgs.push(branch);
  }
  if (since) {
    logArgs.push(`--since=${since}`);
  }
  if (until) {
    logArgs.push(`--until=${until}`);
  }

  const rawLog = await git.raw(['log', ...logArgs]);
  const lines = rawLog.split('\n').filter(line => line.trim().length > 0);

  const timeline = lines.map((line, idx) => {
    const [hash, author, refStr, date] = line.split('|');
    const branchName = refStr ? refStr.split(',')[0].trim().replace(/^HEAD -> /, '') : (branch || 'main');

    return {
      hash: hash ? hash.trim() : '',
      shortHash: hash ? hash.trim().substring(0, 7) : '',
      order: skip + idx + 1,
      author: author ? author.trim() : 'Unknown',
      branch: branchName,
      date: date ? date.trim() : null,
    };
  });

  return {
    timeline,
    pagination: {
      page,
      perPage: limit,
      total,
    },
  };
}

module.exports = { getTimeline };
