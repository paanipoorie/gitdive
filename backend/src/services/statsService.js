const simpleGit = require('simple-git');
const { getDirByRepoId } = require('../utils/tempDir');
const logger = require('../utils/logger');

async function getStats(repoId) {
  const dirEntry = getDirByRepoId(repoId);
  if (!dirEntry || !dirEntry.path) {
    const err = new Error('Repository session not found');
    err.statusCode = 404;
    err.code = 'REPO_NOT_FOUND';
    throw err;
  }

  const git = simpleGit(dirEntry.path);

  // Fetch all commits with stat and author details
  const logResult = await git.log(['--stat']);
  const branches = await git.branch(['-a']);

  let totalAdditions = 0;
  let totalDeletions = 0;
  const authorStats = new Map();
  const fileStats = new Map();
  const activityMap = new Map();

  logResult.all.forEach(item => {
    const authorKey = item.author_email || item.author_name || 'Unknown';
    if (!authorStats.has(authorKey)) {
      authorStats.set(authorKey, {
        name: item.author_name || 'Unknown',
        email: item.author_email || '',
        commits: 0,
        additions: 0,
        deletions: 0,
      });
    }
    const authorObj = authorStats.get(authorKey);
    authorObj.commits += 1;

    let commitAdditions = 0;
    let commitDeletions = 0;

    if (item.diff) {
      commitAdditions = item.diff.insertions || 0;
      commitDeletions = item.diff.deletions || 0;
      totalAdditions += commitAdditions;
      totalDeletions += commitDeletions;

      if (item.diff.files) {
        item.diff.files.forEach(f => {
          const count = fileStats.get(f.file) || 0;
          fileStats.set(f.file, count + 1);
        });
      }
    }

    authorObj.additions += commitAdditions;
    authorObj.deletions += commitDeletions;

    // Group activity by Year-Month (YYYY-MM)
    if (item.date) {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) {
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        activityMap.set(monthKey, (activityMap.get(monthKey) || 0) + 1);
      }
    }
  });

  const authors = Array.from(authorStats.values()).sort((a, b) => b.commits - a.commits);
  const topFiles = Array.from(fileStats.entries())
    .map(([file, changes]) => ({ file, changes }))
    .sort((a, b) => b.changes - a.changes)
    .slice(0, 10);

  const commitActivity = Array.from(activityMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalCommits: logResult.all.length,
    totalAdditions,
    totalDeletions,
    branchCount: branches.all.length,
    authors,
    topFiles,
    commitActivity,
  };
}

module.exports = { getStats };
