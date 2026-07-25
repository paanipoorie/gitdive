const { parseGithubUrl } = require('../utils/validators');
const { validateRepository, setAuthToken } = require('../services/githubService');
const { cloneRepository } = require('../services/gitCloneService');
const { getConfig } = require('../utils/config');
const logger = require('../utils/logger');

async function validateRepo(req, res, next) {
  try {
    const { url } = req.validatedBody;
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return res.status(400).json({
        error: {
          message: 'Invalid GitHub URL format',
          code: 'INVALID_URL_FORMAT',
        },
      });
    }

    const config = getConfig();
    setAuthToken(config.githubToken);

    const repoData = await validateRepository(parsed.owner, parsed.repo);

    logger.info({ repo: repoData.fullName }, 'Repository validated successfully');

    res.json({
      success: true,
      data: repoData,
    });
  } catch (error) {
    next(error);
  }
}

async function cloneRepo(req, res, next) {
  try {
    const { url } = req.validatedBody;
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return res.status(400).json({
        error: {
          message: 'Invalid GitHub URL format',
          code: 'INVALID_URL_FORMAT',
        },
      });
    }

    const config = getConfig();
    setAuthToken(config.githubToken);

    const repoData = await validateRepository(parsed.owner, parsed.repo);

    const cloneOptions = {
      maxSize: 500 * 1024 * 1024,
      depth: 500,
      token: config.githubToken,
    };

    const result = await cloneRepository(url, cloneOptions);

    logger.info({ repoId: result.repoId, repo: repoData.fullName }, 'Repository cloned successfully');

    res.json({
      success: true,
      data: {
        repoId: result.repoId,
        owner: repoData.owner,
        name: repoData.name,
        fullName: repoData.fullName,
        defaultBranch: repoData.defaultBranch,
        size: result.size,
        latestCommit: result.latestCommit,
        branches: result.branches,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { validateRepo, cloneRepo };