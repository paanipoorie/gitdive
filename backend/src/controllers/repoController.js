const { parseGithubUrl } = require('../utils/validators');
const { validateRepository, setAuthToken } = require('../services/githubService');
const { cloneRepository } = require('../services/gitCloneService');
const { getCommits } = require('../services/gitParserService');
const { saveRepo, getRepoByUrl } = require('../services/cacheService');
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
    const refresh = req.query.refresh === 'true';
    const parsed = parseGithubUrl(url);

    if (!parsed) {
      return res.status(400).json({
        error: {
          message: 'Invalid GitHub URL format',
          code: 'INVALID_URL_FORMAT',
        },
      });
    }

    if (!refresh) {
      const cached = getRepoByUrl(url);
      if (cached && cached.temp_path) {
        logger.info({ repoId: cached.id, repo: cached.full_name }, 'Serving cached repository');
        return res.json({
          success: true,
          cached: true,
          data: {
            repoId: cached.id,
            owner: cached.owner,
            name: cached.name,
            fullName: cached.full_name,
            defaultBranch: cached.default_branch,
            size: cached.size,
          },
        });
      }
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

    saveRepo({
      id: result.repoId,
      owner: repoData.owner,
      name: repoData.name,
      fullName: repoData.fullName,
      url,
      defaultBranch: repoData.defaultBranch,
      size: result.size,
      tempPath: result.tempDir,
    });

    logger.info({ repoId: result.repoId, repo: repoData.fullName }, 'Repository cloned successfully');

    res.json({
      success: true,
      cached: false,
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

async function getRepoCommits(req, res, next) {
  try {
    const { repoId } = req.params;
    const { page, limit, perPage } = req.query;

    const result = await getCommits(repoId, { page, limit, perPage });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { validateRepo, cloneRepo, getRepoCommits };