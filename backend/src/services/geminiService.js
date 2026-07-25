const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildCommitSummaryPrompt, buildRepoSummaryPrompt } = require('../utils/promptBuilder');
const logger = require('../utils/logger');

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

async function generateCommitSummary(commit, diffText = '') {
  try {
    const ai = getAiClient();
    if (!ai) {
      logger.warn('GEMINI_API_KEY missing, using fallback commit summary');
      return fallbackCommitSummary(commit);
    }

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = buildCommitSummaryPrompt(commit, diffText);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    logger.error({ err: error, hash: commit.hash }, 'Failed to generate Gemini commit summary');
    return fallbackCommitSummary(commit);
  }
}

async function generateRepoSummary(repoInfo, recentCommits = []) {
  try {
    const ai = getAiClient();
    if (!ai) {
      logger.warn('GEMINI_API_KEY missing, using fallback repo summary');
      return fallbackRepoSummary(repoInfo, recentCommits);
    }

    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = buildRepoSummaryPrompt(repoInfo, recentCommits);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate Gemini repo summary');
    return fallbackRepoSummary(repoInfo, recentCommits);
  }
}

function fallbackCommitSummary(commit) {
  const fileCount = commit.files ? commit.files.length : 0;
  const filesStr = fileCount > 0 ? ` (modified ${fileCount} file${fileCount > 1 ? 's' : ''})` : '';
  return `Commit "${commit.message}"${filesStr}. Work focused on application improvements and feature updates.`;
}

function fallbackRepoSummary(repoInfo, recentCommits = []) {
  const name = repoInfo.fullName || repoInfo.name || 'Repository';
  return `Across ${recentCommits.length} recorded commits, ${name} evolved from initial setup through core feature development to final application polish.`;
}

module.exports = {
  generateCommitSummary,
  generateRepoSummary,
};
