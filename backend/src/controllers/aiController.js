const { getCachedSummary, saveSummary, getRepoById } = require('../services/cacheService');
const { generateCommitSummary, generateRepoSummary } = require('../services/geminiService');
const { getDirByRepoId } = require('../utils/tempDir');
const simpleGit = require('simple-git');
const logger = require('../utils/logger');

async function getCommitDetail(req, res, next) {
  try {
    const { repoId, hash } = req.params;

    const dirEntry = getDirByRepoId(repoId);
    let commitData = null;

    if (dirEntry && dirEntry.path) {
      const git = simpleGit(dirEntry.path);
      try {
        const log = await git.log(['-n', '1', hash, '--stat']);
        if (log.latest) {
          commitData = {
            hash: log.latest.hash,
            date: log.latest.date,
            message: log.latest.message,
            author: { name: log.latest.author_name, email: log.latest.author_email },
            files: log.latest.diff ? log.latest.diff.files.map(f => f.file) : [],
          };
        }
      } catch (e) {
        logger.warn({ err: e, repoId, hash }, 'Git lookup for commit detail failed');
      }
    }

    if (!commitData) {
      const err = new Error(`Commit ${hash} not found`);
      err.statusCode = 404;
      err.code = 'COMMIT_NOT_FOUND';
      throw err;
    }

    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;
    let summary = !refresh ? getCachedSummary(repoId, hash) : null;
    if (!summary) {
      summary = await generateCommitSummary(commitData);
      saveSummary(repoId, hash, summary);
    }

    res.json({
      success: true,
      data: {
        hash: commitData.hash,
        date: commitData.date,
        filesChanged: commitData.files,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getRepoSummary(req, res, next) {
  try {
    const { repoId } = req.params;
    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;

    let summary = !refresh ? getCachedSummary(repoId, 'OVERALL') : null;

    if (!summary) {
      const dirEntry = getDirByRepoId(repoId);
      const repoInfo = getRepoById(repoId) || { id: repoId, name: 'Repository', fullName: repoId };
      let recentCommits = [];

      if (dirEntry && dirEntry.path) {
        const git = simpleGit(dirEntry.path);
        try {
          const log = await git.log(['-n', '20']);
          recentCommits = log.all.map(c => ({ hash: c.hash, message: c.message }));
        } catch (e) {
          logger.warn({ err: e, repoId }, 'Failed to fetch recent commits for repo summary');
        }
      }

      summary = await generateRepoSummary(repoInfo, recentCommits);
      saveSummary(repoId, 'OVERALL', summary);
    }

    res.json({
      success: true,
      data: {
        repoId,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCommitDetail,
  getRepoSummary,
};
