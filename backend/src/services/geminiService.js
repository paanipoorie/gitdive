const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildCommitSummaryPrompt, buildRepoSummaryPrompt } = require('../utils/promptBuilder');
const logger = require('../utils/logger');

const MODEL_NAME = 'gemini-2.5-flash';

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

async function generateCommitSummary(commit, diffText = '') {
  const hash = commit.hash || 'unknown';
  logger.info({ hash, hasDiff: !!diffText }, 'Received narration request');

  try {
    const ai = getAiClient();
    if (!ai) {
      logger.warn({ hash }, 'GEMINI_API_KEY missing, using fallback commit summary');
      return fallbackCommitSummary(commit);
    }

    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildCommitSummaryPrompt(commit, diffText);

    logger.info({ hash, promptLength: prompt.length, model: MODEL_NAME }, 'Calling Gemini for commit summary');

    const result = await model.generateContent(prompt);
    const text = result.response ? result.response.text() : '';

    logger.info({ hash, responseLength: text.length }, 'Gemini response received');
    if (text.length > 0) {
      logger.debug({ hash, rawResponse: text.substring(0, 500) }, 'Gemini raw response (truncated)');
    }

    const trimmed = text ? text.trim() : '';
    if (!trimmed) {
      throw new Error('Gemini returned empty response');
    }

    logger.info({ hash }, 'Response sent');
    return trimmed;
  } catch (error) {
    logger.error({ err: error, hash }, 'Failed to generate Gemini commit summary');
    if (error.message && error.message.includes('API_KEY')) {
      logger.error({ hash }, 'Gemini error: invalid API key');
    } else if (error.message && error.message.includes('quota')) {
      logger.error({ hash }, 'Gemini error: quota exceeded');
    } else if (error.message && error.message.includes('safety')) {
      logger.error({ hash }, 'Gemini error: response blocked by safety filters');
    } else if (error.message && error.message.includes('not found') || error.message && error.message.includes('404')) {
      logger.error({ hash }, 'Gemini error: model not found or blocked');
    } else if (error.message && error.message.includes('timeout')) {
      logger.error({ hash }, 'Gemini error: request timed out');
    } else if (error.response) {
      logger.error({ hash, status: error.response?.status, statusText: error.response?.statusText }, 'Gemini HTTP error');
    }
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

  const model = ai.getGenerativeModel({ model: MODEL_NAME });
  const prompt = buildRepoSummaryPrompt(repoInfo, readmeText, chronologicalCommits);

  logger.info({ repoId, promptLength: prompt.length, model: MODEL_NAME }, 'Calling Gemini for repo summary');

  try {
    const result = await model.generateContent(prompt);
    logger.info({ repoId }, 'Gemini response received');

    const text = result.response ? result.response.text() : '';
    const trimmed = text ? text.trim() : '';

    logger.info({ repoId, responseLength: trimmed.length }, 'Gemini response length');
    if (trimmed.length > 0) {
      logger.debug({ repoId, rawResponse: trimmed.substring(0, 500) }, 'Gemini raw response (truncated)');
    }

    if (!trimmed || trimmed.length === 0) {
      throw new Error('Gemini returned empty or whitespace story');
    }

    logger.info({ repoId }, 'Response sent');
    return trimmed;
  } catch (error) {
    logger.error({ err: error, repoId }, 'Failed to generate Gemini repo summary');
    if (error.message && error.message.includes('API_KEY')) {
      logger.error({ repoId }, 'Gemini error: invalid API key');
    } else if (error.message && error.message.includes('quota')) {
      logger.error({ repoId }, 'Gemini error: quota exceeded');
    } else if (error.message && error.message.includes('safety')) {
      logger.error({ repoId }, 'Gemini error: response blocked by safety filters');
    } else if (error.message && error.message.includes('not found') || error.message && error.message.includes('404')) {
      logger.error({ repoId }, 'Gemini error: model not found or blocked');
    } else if (error.message && error.message.includes('timeout')) {
      logger.error({ repoId }, 'Gemini error: request timed out');
    } else if (error.response) {
      logger.error({ repoId, status: error.response?.status, statusText: error.response?.statusText }, 'Gemini HTTP error');
    }
    throw error;
  }
}

function fallbackCommitSummary(commit) {
  const msg = (commit.message || '').toLowerCase();
  if (msg.includes('init') || msg.includes('foundation') || msg.includes('setup')) {
    return 'The journey began at the surface. Fresh seabed foundations were laid down, dropping anchor for all future exploration to build upon.';
  }
  if (msg.includes('auth') || msg.includes('user') || msg.includes('login')) {
    return 'The reef became calmer here. The authentication currents finally settled, making everything downstream swim much more smoothly.';
  }
  if (msg.includes('route') || msg.includes('nav') || msg.includes('flow')) {
    return 'A new current appeared, giving future explorers a clear route through the project.';
  }
  if (msg.includes('style') || msg.includes('design') || msg.includes('ocean') || msg.includes('pixel')) {
    return 'Bioluminescent colors illuminated the waters. The surrounding corals and light rays bloomed with fresh vibrancy.';
  }
  if (msg.includes('fix') || msg.includes('repair') || msg.includes('bug')) {
    return 'A slight turbulence near the rocks was smoothed out. The waters cleared, allowing future creatures to drift without friction.';
  }
  return 'A quiet memory settled onto the reef. Gentle ripples spread across the surrounding waters, helping the project find its natural rhythm.';
}

module.exports = {
  generateCommitSummary,
  generateRepoSummary,
};
