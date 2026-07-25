const axios = require('axios');
const logger = require('../utils/logger');

const GITHUB_API_BASE = 'https://api.github.com';

const githubApi = axios.create({
  baseURL: GITHUB_API_BASE,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  timeout: 10000,
});

function setAuthToken(token) {
  if (token) {
    githubApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete githubApi.defaults.headers.common.Authorization;
  }
}

async function validateRepository(owner, repo) {
  try {
    const response = await githubApi.get(`/repos/${owner}/${repo}`);
    const repoData = response.data;

    if (repoData.private) {
      const error = new Error('Repository is private');
      error.statusCode = 403;
      error.code = 'REPO_PRIVATE';
      throw error;
    }

    return {
      owner: repoData.owner.login,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      defaultBranch: repoData.default_branch,
      size: repoData.size,
      stars: repoData.stargazers_count,
      isPrivate: repoData.private,
      htmlUrl: repoData.html_url,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    if (error.response?.status === 404) {
      const err = new Error('Repository not found');
      err.statusCode = 404;
      err.code = 'REPO_NOT_FOUND';
      throw err;
    }
    if (error.response?.status === 403) {
      const err = new Error('GitHub API rate limit exceeded or access forbidden');
      err.statusCode = 403;
      err.code = 'GITHUB_FORBIDDEN';
      throw err;
    }
    logger.error({ err: error, owner, repo }, 'GitHub API error');
    const err = new Error('GitHub API unavailable');
    err.statusCode = 503;
    err.code = 'GITHUB_UNAVAILABLE';
    throw err;
  }
}

module.exports = { setAuthToken, validateRepository, githubApi };