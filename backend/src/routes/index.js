const express = require('express');
const repoRoutes = require('./repoRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/repos', repoRoutes);

module.exports = router;