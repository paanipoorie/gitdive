function buildCommitSummaryPrompt(commit, diffText = '') {
  return `You are a concise software engineering assistant.
Summarize the following git commit in 2-3 clear, informative sentences for a timeline UI.
Focus on what was added, changed, or fixed and its impact.

Commit Message: ${commit.message}
Author: ${commit.author?.name || 'Unknown'}
Files Changed: ${JSON.stringify(commit.files || [])}
${diffText ? `Diff snippet:\n${diffText.substring(0, 1500)}` : ''}

Output ONLY the 2-3 line summary.`;
}

function buildRepoSummaryPrompt(repoInfo, recentCommits = []) {
  const commitSummaries = recentCommits.map(c => `- ${c.hash.substring(0,7)}: ${c.message}`).join('\n');
  return `You are an expert developer reviewing a repository.
Provide a clear, engaging 3-4 sentence narrative summarizing the evolution and history of this project based on its commits.

Repository: ${repoInfo.fullName || repoInfo.name}
Commits Count: ${recentCommits.length}
Key Commits:
${commitSummaries.substring(0, 3000)}

Output ONLY the final summary narrative.`;
}

module.exports = {
  buildCommitSummaryPrompt,
  buildRepoSummaryPrompt,
};
