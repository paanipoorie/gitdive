const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const repoRoutes = require('./repoRoutes');
const logger = require('../utils/logger');

const router = express.Router();

const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/debug/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GET /debug/gemini — GEMINI_API_KEY missing');
    return res.status(400).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured',
    });
  }

  const prompt = 'Reply ONLY with: HELLO OCEAN';
  const ai = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      logger.info(`[Debug Gemini] Trying model ${modelName}`);
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response ? result.response.text().trim() : '';

      return res.json({
        success: true,
        model: modelName,
        prompt,
        response: text,
      });
    } catch (err) {
      logger.warn(`[Debug Gemini] Model ${modelName} error: ${err.message}`);
      lastError = err;
    }
  }

  return res.status(500).json({
    success: false,
    error: lastError ? lastError.message : 'All Gemini model fallbacks failed',
  });
});

router.use('/repos', repoRoutes);

module.exports = router;