const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildCommitSummaryPrompt, buildRepoSummaryPrompt } = require('../utils/promptBuilder');
const logger = require('../utils/logger');

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

async function callGenerativeModel(ai, prompt) {
  let lastError = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      logger.info(`[Gemini] Attempting call with model: ${modelName}`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response ? result.response.text() : '';
      if (text && text.trim().length > 0) {
        return { text: text.trim(), modelUsed: modelName, usage: result.response.usageMetadata };
      }
    } catch (err) {
      logger.warn(`[Gemini] Model ${modelName} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error('All Gemini model fallbacks failed');
}

async function generateCommitSummary(commit, diffText = '') {
  const hash = commit.hash || 'unknown';
  const repoName = commit.repoName || 'unknown';

  try {
    const ai = getAiClient();
    if (!ai) {
      logger.warn({ hash }, 'GEMINI_API_KEY missing, using fallback commit summary');
      return fallbackCommitSummary(commit);
    }

    const prompt = buildCommitSummaryPrompt(commit, diffText);

    logger.info('---------------------------------');
    logger.info('[Gemini] Generating Commit Summary');
    logger.info('Repository: ' + repoName);
    logger.info('Commit: ' + hash);
    logger.info('Prompt length: ' + prompt.length);
    logger.info('Calling Gemini...');
    logger.info('---------------------------------');

    const { text, modelUsed, usage } = await callGenerativeModel(ai, prompt);

    logger.info('---------------------------------');
    logger.info(`Response received from ${modelUsed}`);
    logger.info('Token usage: ' + JSON.stringify(usage || 'not available'));
    logger.info('Response text: ' + (text ? text.substring(0, 300) : '(empty)'));
    logger.info('---------------------------------');

    return text;
  } catch (error) {
    logger.error('---------------------------------');
    logger.error('Gemini commit summary error');
    logger.error('error.message: ' + error.message);
    logger.error('---------------------------------');
    return fallbackCommitSummary(commit);
  }
}

async function generateRepoSummary(repoInfo, readmeText = '', chronologicalCommits = []) {
  const repoId = repoInfo.id || repoInfo.fullName || repoInfo.name || 'unknown';
  const ai = getAiClient();
  if (!ai) {
    logger.warn({ repoId }, 'GEMINI_API_KEY missing, cannot generate repo summary');
    throw new Error('GEMINI_API_KEY is not configured on server');
  }

  const prompt = buildRepoSummaryPrompt(repoInfo, readmeText, chronologicalCommits);

  logger.info('---------------------------------');
  logger.info('[Gemini] Generating Repo Summary');
  logger.info('Repository: ' + repoId);
  logger.info('Prompt length: ' + prompt.length);
  logger.info('Calling Gemini...');
  logger.info('---------------------------------');

  try {
    const { text, modelUsed, usage } = await callGenerativeModel(ai, prompt);

    logger.info('---------------------------------');
    logger.info(`Response received from ${modelUsed}`);
    logger.info('Token usage: ' + JSON.stringify(usage || 'not available'));
    logger.info('Response text: ' + (text ? text.substring(0, 300) : '(empty)'));
    logger.info('---------------------------------');

    return text;
  } catch (error) {
    logger.error('---------------------------------');
    logger.error('Gemini repo summary error');
    logger.error('error.message: ' + error.message);
    logger.error('---------------------------------');
    throw error;
  }
}

function fallbackCommitSummary(commit) {
  return `Commit summary for ${commit.title}: Modified ${
    commit.files ? commit.files.length : 1
  } file(s) (+${commit.added || 12} / -${commit.removed || 4} lines).`;
}

module.exports = {
  generateCommitSummary,
  generateRepoSummary,
};
