const { getTimeline } = require('../services/timelineService');

async function getRepoTimeline(req, res, next) {
  try {
    const { repoId } = req.params;
    const { branch, since, until, page, limit, perPage } = req.query;

    const result = await getTimeline(repoId, {
      branch,
      since,
      until,
      page,
      limit,
      perPage,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRepoTimeline };
