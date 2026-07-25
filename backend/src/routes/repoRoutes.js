const express = require('express');
const { validateRepoUrl } = require('../utils/validators');
const { validateRepo, cloneRepo, getRepoCommits } = require('../controllers/repoController');
const { getRepoTimeline } = require('../controllers/timelineController');

const router = express.Router();

router.post('/validate', validateRepoUrl, validateRepo);
router.post('/clone', validateRepoUrl, cloneRepo);
router.get('/:repoId/commits', getRepoCommits);
router.get('/:repoId/timeline', getRepoTimeline);

module.exports = router;