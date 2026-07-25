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
      logger.warn({ hash }, 'GEMINI_API_KEY missing, using ocean fallback commit summary');
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
  logger.info('[Gemini] Generating Repo Summary Story');
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
  const msg = (commit.message || commit.title || '').toLowerCase();
  if (msg.includes('init') || msg.includes('foundation') || msg.includes('setup') || msg.includes('create')) {
    return `The expedition dropped its initial anchor into the deep seabed. Structural foundations were laid down like heavy coral blocks, securing a solid underwater harbor for all future modules to build upon.`;
  }
  if (msg.includes('auth') || msg.includes('user') || msg.includes('login') || msg.includes('gate')) {
    return `A protective tide gate was constructed across the current. Access currents settled, ensuring only authenticated vessels can dive into the deeper waters downstream.`;
  }
  if (msg.includes('route') || msg.includes('nav') || msg.includes('flow')) {
    return `New sub-aquatic channels were charted through the reefs. Explorers can now swim effortlessly between different coordinates across the deep sea.`;
  }
  if (msg.includes('style') || msg.includes('design') || msg.includes('ocean') || msg.includes('pixel') || msg.includes('ui')) {
    return `Bioluminescent corals bloomed across the sea floor. Vibrant cyan glow and pixel light rays illuminated the dark waters, turning the interface into a living underwater reef.`;
  }
  if (msg.includes('fix') || msg.includes('repair') || msg.includes('bug')) {
    return `A turbulent whirlpool near the rocky trench was smoothed out. Pressure valves were tightened, allowing sea creatures to drift without friction across the current.`;
  }
  return `A gentle wave rippled through the underwater ecosystem. This change strengthened the surrounding coral structure, allowing the codebase to breathe freely in the deep sea.`;
}

module.exports = {
  generateCommitSummary,
  generateRepoSummary,
};
