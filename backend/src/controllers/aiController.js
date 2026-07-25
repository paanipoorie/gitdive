const fs = require('fs');
const path = require('path');
const {
  getCachedSummary,
  saveSummary,
  getRepoById,
  getChronologicalCachedCommits,
  getAllCommitSummaries,
} = require('../services/cacheService');
const { generateCommitSummary, generateRepoSummary } = require('../services/geminiService');
const { getDirByRepoId } = require('../utils/tempDir');
const simpleGit = require('simple-git');
const logger = require('../utils/logger');

async function getCommitDetail(req, res, next) {
  try {
    const { repoId, hash } = req.params;
    logger.info({ repoId, hash }, 'Received narration request');

    const dirEntry = getDirByRepoId(repoId);
    let commitData = null;
    let diffText = '';

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
        // Fetch patch/diff for richer summary
        try {
          const diffResult = await git.raw(['diff', `${hash}^..${hash}`, '--', '-M']);
          if (diffResult && diffResult.length < 5000) {
            diffText = diffResult;
          } else if (diffResult) {
            diffText = diffResult.substring(0, 5000) + '\n...[diff truncated]';
          }
        } catch (diffErr) {
          logger.warn({ hash }, 'Could not fetch diff for commit');
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

    logger.info({ repoId, hash, files: commitData.files.length, hasDiff: !!diffText }, 'Commit data prepared');

    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;
    let summary = !refresh ? getCachedSummary(repoId, hash) : null;
    if (!summary) {
      summary = await generateCommitSummary(commitData, diffText);
      saveSummary(repoId, hash, summary);
    }

    logger.info({ repoId, hash, summaryLength: summary.length }, 'Response sent');

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
    logger.info({ repoId, path: req.path, method: req.method }, 'Received repository story request');

    const refresh = req.query.refresh === 'true' || req.body?.refresh === true;

    let summary = !refresh ? getCachedSummary(repoId, 'OVERALL') : null;

    if (!summary) {
      const dirEntry = getDirByRepoId(repoId);
      const repoInfo = getRepoById(repoId) || { id: repoId, name: repoId, fullName: repoId };
      let chronologicalCommits = [];
      let readmeText = '';

      if (dirEntry && dirEntry.path) {
        const repoPath = dirEntry.path;

        // Read README content if available
        const readmeFiles = ['README.md', 'README', 'readme.md', 'README.txt', 'README.rst'];
        for (const fname of readmeFiles) {
          const fullPath = path.join(repoPath, fname);
          if (fs.existsSync(fullPath)) {
            try {
              readmeText = fs.readFileSync(fullPath, 'utf-8');
              break;
            } catch (err) {
              logger.warn({ err: err.message, repoId }, 'Failed to read README file');
            }
          }
        }

        // Fetch chronological commits (oldest to newest)
        try {
          const git = simpleGit(repoPath);
          const log = await git.log(['--reverse']);
          const cachedSummaries = getAllCommitSummaries(repoId) || {};
          chronologicalCommits = log.all.map((c) => ({
            hash: c.hash,
            message: c.message,
            date: c.date,
            summary: cachedSummaries[c.hash] || null,
          }));
        } catch (e) {
          logger.warn({ err: e.message, repoId }, 'Failed to fetch chronological commits via git log');
        }
      }

      if (chronologicalCommits.length === 0) {
        const cached = getChronologicalCachedCommits(repoId);
        if (cached && cached.length > 0) {
          const cachedSummaries = getAllCommitSummaries(repoId) || {};
          chronologicalCommits = cached.map((c) => ({
            hash: c.hash,
            message: c.message,
            date: c.date,
            summary: cachedSummaries[c.hash] || null,
          }));
        }
      }

      logger.info(
        {
          repoId,
          name: repoInfo.name || repoId,
          totalCommits: chronologicalCommits.length,
          hasReadme: !!readmeText,
        },
        'Prompt built for repo story'
      );

      summary = await generateRepoSummary(repoInfo, readmeText, chronologicalCommits);
      saveSummary(repoId, 'OVERALL', summary);
    } else {
      logger.info({ repoId }, 'Using cached repository story');
    }

    logger.info({ repoId, responseLength: summary ? summary.length : 0 }, 'Response sent');

    res.json({
      success: true,
      data: {
        repoId,
        summary,
      },
    });
  } catch (error) {
    logger.error({ err: error.message, repoId: req.params.repoId }, 'Failed to get repository summary');
    next(error);
  }
}

module.exports = {
  getCommitDetail,
  getRepoSummary,
};
