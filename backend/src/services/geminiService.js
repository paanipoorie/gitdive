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
  const repoName = commit.repoName || 'unknown';

  try {
    const ai = getAiClient();
    if (!ai) {
      logger.warn({ hash }, 'GEMINI_API_KEY missing, using fallback commit summary');
      return fallbackCommitSummary(commit);
    }

    const prompt = buildCommitSummaryPrompt(commit, diffText);

    logger.info('---------------------------------');
    logger.info('[Gemini]');
    logger.info('Repository: ' + repoName);
    logger.info('Commit: ' + hash);
    logger.info('Model: ' + MODEL_NAME);
    logger.info('Prompt length: ' + prompt.length);
    logger.info('Prompt text: ' + prompt.substring(0, 2000));
    logger.info('Calling Gemini...');
    logger.info('---------------------------------');

    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response ? result.response.text() : '';

    logger.info('---------------------------------');
    logger.info('Response received');
    logger.info('Token usage: ' + JSON.stringify(result.response.usageMetadata || 'not available'));
    logger.info('Finish reason: ' + JSON.stringify(result.response.candidates?.[0]?.finishReason || 'not available'));
    logger.info('Response text: ' + (text ? text.substring(0, 500) : '(empty)'));
    logger.info('---------------------------------');

    const trimmed = text ? text.trim() : '';
    if (!trimmed) {
      throw new Error('Gemini returned empty response');
    }

    logger.info('Summary returned');
    return trimmed;
  } catch (error) {
    logger.error('---------------------------------');
    logger.error('Gemini error');
    logger.error('error.message: ' + error.message);
    logger.error('error.status: ' + (error.status || error.statusText || 'N/A'));
    logger.error('error.stack: ' + error.stack);
    logger.error('error.response: ' + JSON.stringify(error.response || {}));
    logger.error('error.details: ' + JSON.stringify(error.details || error.cause || {}));
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
  logger.info('[Gemini]');
  logger.info('Repository: ' + repoId);
  logger.info('Model: ' + MODEL_NAME);
  logger.info('Prompt length: ' + prompt.length);
  logger.info('Prompt text (truncated): ' + prompt.substring(0, 3000));
  logger.info('Calling Gemini...');
  logger.info('---------------------------------');

  try {
    const model = ai.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response ? result.response.text() : '';
    const trimmed = text ? text.trim() : '';

    logger.info('---------------------------------');
    logger.info('Response received');
    logger.info('Token usage: ' + JSON.stringify(result.response.usageMetadata || 'not available'));
    logger.info('Finish reason: ' + JSON.stringify(result.response.candidates?.[0]?.finishReason || 'not available'));
    logger.info('Response text: ' + (trimmed ? trimmed.substring(0, 500) : '(empty)'));
    logger.info('---------------------------------');

    if (!trimmed || trimmed.length === 0) {
      throw new Error('Gemini returned empty or whitespace story');
    }

    logger.info('Summary returned');
    return trimmed;
  } catch (error) {
    logger.error('---------------------------------');
    logger.error('Gemini error');
    logger.error('error.message: ' + error.message);
    logger.error('error.status: ' + (error.status || error.statusText || 'N/A'));
    logger.error('error.stack: ' + error.stack);
    logger.error('error.response: ' + JSON.stringify(error.response || {}));
    logger.error('error.details: ' + JSON.stringify(error.details || error.cause || {}));
    logger.error('---------------------------------');
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
