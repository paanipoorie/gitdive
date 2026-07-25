require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;
const hasGeminiKey = !!process.env.GEMINI_API_KEY;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  if (hasGeminiKey) {
    console.log('✓ GEMINI_API_KEY detected');
  } else {
    console.log('✗ GEMINI_API_KEY missing — AI features will use fallback text');
    console.log('  Set GEMINI_API_KEY in backend/.env or environment variables');
  }
});