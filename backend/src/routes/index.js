const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const repoRoutes = require('./repoRoutes');
const logger = require('../utils/logger');

const router = express.Router();

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

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    logger.info({ model: 'gemini-2.5-flash' }, 'GET /debug/gemini — calling Gemini');
    const result = await model.generateContent('Reply only with the word OCEAN.');
    const text = result.response ? result.response.text().trim() : '';
    logger.info({ response: text }, 'GET /debug/gemini — response');
    res.json({
      success: true,
      model: 'gemini-2.5-flash',
      prompt: 'Reply only with the word OCEAN.',
      response: text,
    });
  } catch (error) {
    logger.error({ err: error }, 'GET /debug/gemini — error');
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
});

router.use('/repos', repoRoutes);

module.exports = router;