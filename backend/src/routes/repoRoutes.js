const express = require('express');
const { validateRepoUrl } = require('../utils/validators');
const { validateRepo, cloneRepo, getRepoCommits } = require('../controllers/repoController');

const router = express.Router();

router.post('/validate', validateRepoUrl, validateRepo);
router.post('/clone', validateRepoUrl, cloneRepo);
router.get('/:repoId/commits', getRepoCommits);

module.exports = router;