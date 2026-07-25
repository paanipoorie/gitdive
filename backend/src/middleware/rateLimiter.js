const rateLimit = require('express-rate-limit');

const cloneLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 clone requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many repository clone requests, please try again later.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 AI requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many AI summary requests, please try again later.',
      code: 'TOO_MANY_REQUESTS',
    },
  },
});

module.exports = {
  cloneLimiter,
  aiLimiter,
};
