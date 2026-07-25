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

function fallbackRepoSummary(repoInfo, recentCommits = []) {
  const name = repoInfo.fullName || repoInfo.name || 'this repository';
  return `You've reached the ocean floor of ${name}.\n\nWhat began as a few scattered shells slowly became a living reef. Small fixes strengthened the currents, new creatures appeared, forgotten paths were rediscovered, and the project learned to breathe on its own.\n\nEvery commit left a footprint beneath the waves. Together they became the story of this repository.`;
}

module.exports = {
  generateCommitSummary,
  generateRepoSummary,
};
