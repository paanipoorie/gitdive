require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
const apiKey = process.env.GEMINI_API_KEY;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`SDK: @google/generative-ai`);
  if (apiKey) {
    console.log(`✓ GEMINI_API_KEY loaded (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 6)}...)`);
  } else {
    console.log('✗ GEMINI_API_KEY missing — AI features will use fallback text');
    console.log('  Set GEMINI_API_KEY in backend/.env or environment variables');
  }
});