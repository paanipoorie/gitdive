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

  const prompt = 'Reply ONLY with: HELLO OCEAN';
  logger.info('---------------------------------');
  logger.info('[Gemini]');
  logger.info('Repository: debug');
  logger.info('Commit: debug');
  logger.info('Model: gemini-2.5-flash');
  logger.info('Prompt length: ' + prompt.length);
  logger.info('Calling Gemini...');
  logger.info('---------------------------------');

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response ? result.response.text().trim() : '';

    logger.info('---------------------------------');
    logger.info('Response received');
    logger.info('Token usage: ' + JSON.stringify(result.response.usageMetadata || 'not available'));
    logger.info('Finish reason: ' + JSON.stringify(result.response.candidates?.[0]?.finishReason || 'not available'));
    logger.info('---------------------------------');
    logger.info('Response: ' + text);

    res.json({
      success: true,
      model: 'gemini-2.5-flash',
      prompt,
      response: text,
    });
  } catch (error) {
    logger.error('---------------------------------');
    logger.error('Gemini error');
    logger.error('error.message: ' + error.message);
    logger.error('error.status: ' + (error.status || error.statusText || 'N/A'));
    logger.error('error.stack: ' + error.stack);
    logger.error('error.response: ' + JSON.stringify(error.response || {}));
    logger.error('error.details: ' + JSON.stringify(error.details || error.cause || {}));
    logger.error('---------------------------------');
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
});

router.use('/repos', repoRoutes);

module.exports = router;