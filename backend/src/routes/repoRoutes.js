const express = require('express');
const { validateRepoUrl } = require('../utils/validators');
const { validateRepo, cloneRepo } = require('../controllers/repoController');

const router = express.Router();

router.post('/validate', validateRepoUrl, validateRepo);
router.post('/clone', validateRepoUrl, cloneRepo);

module.exports = router;