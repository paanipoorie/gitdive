const express = require('express');
const { validateRepoUrl } = require('../utils/validators');
const { validateRepo, cloneRepo, getRepoCommits } = require('../controllers/repoController');
const { getRepoTimeline } = require('../controllers/timelineController');
const { getRepoStats } = require('../controllers/statsController');
const { getCommitDetail, getRepoSummary } = require('../controllers/aiController');
const { cloneLimiter, aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/validate', validateRepoUrl, validateRepo);
router.post('/clone', cloneLimiter, validateRepoUrl, cloneRepo);
router.get('/:repoId/commits', getRepoCommits);
router.get('/:repoId/timeline', getRepoTimeline);
router.get('/:repoId/stats', getRepoStats);
router.get('/:repoId/commits/:hash/detail', aiLimiter, getCommitDetail);
router.get('/:repoId/summary', aiLimiter, getRepoSummary);
router.post('/:repoId/summary', aiLimiter, getRepoSummary);

module.exports = router;