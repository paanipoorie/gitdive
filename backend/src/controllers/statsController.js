const { getStats } = require('../services/statsService');

async function getRepoStats(req, res, next) {
  try {
    const { repoId } = req.params;
    const result = await getStats(repoId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRepoStats };
