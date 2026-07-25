function buildCommitSummaryPrompt(commit, diffText = '') {
  return `You are a friendly underwater narrator exploring a repository's memory reef, like Jacques Cousteau explaining software to a curious deep-sea diver.

Your job is to summarize the "story" of this commit in a playful, imaginative, ocean-themed way (2-3 short sentences).

CRITICAL RULES:
1. Do NOT repeat details already visible on the commit card: DO NOT list or quote raw file names, commit hashes, dates, or exact raw commit messages.
2. Translate technical software changes into evocative underwater/marine metaphors (currents, reefs, tides, creatures, deep-sea channels, glowing algae, diving paths).
3. Keep it short (2-3 sentences max), warm, and understandable even for non-developers. No dry technical jargon.

Commit Message Context: ${commit.message}
Files Changed: ${JSON.stringify(commit.files || [])}
${diffText ? `Diff snippet:\n${diffText.substring(0, 1500)}` : ''}

Output ONLY the 2-3 sentence ocean narrative summary.`;
}

function buildRepoSummaryPrompt(repoInfo, readmeOrCommits = '', chronologicalCommits = []) {
  let readmeText = '';
  let commits = [];

  if (Array.isArray(readmeOrCommits)) {
    commits = readmeOrCommits;
  } else if (typeof readmeOrCommits === 'string') {
    readmeText = readmeOrCommits;
    commits = Array.isArray(chronologicalCommits) ? chronologicalCommits : [];
  } else if (readmeOrCommits && typeof readmeOrCommits === 'object') {
    readmeText = readmeOrCommits.readme || '';
    commits = readmeOrCommits.commits || [];
  }

  const repoName = repoInfo.fullName || repoInfo.name || 'Repository';
  const totalCommits = commits.length;
  const defaultBranch = repoInfo.defaultBranch || repoInfo.default_branch || 'main';

  let selectedCommits = commits;
  if (commits.length > 100) {
    const first20 = commits.slice(0, 20);
    const last20 = commits.slice(-20);
    const middleStep = Math.floor((commits.length - 40) / 60);
    const middle60 = [];
    for (let i = 20; i < commits.length - 20; i += Math.max(1, middleStep)) {
      if (middle60.length < 60) middle60.push(commits[i]);
    }
    selectedCommits = [...first20, ...middle60, ...last20];
  }

  const commitHistoryText = selectedCommits
    .map((c, idx) => {
      const summaryPart = c.summary ? ` (Summary: ${c.summary})` : '';
      const datePart = c.date ? ` [${new Date(c.date).toISOString().split('T')[0]}]` : '';
      const hashPart = c.hash ? c.hash.substring(0, 7) : `${idx + 1}`;
      return `${idx + 1}. Commit ${hashPart}${datePart}: "${c.message}"${summaryPart}`;
    })
    .join('\n');

  const readmeSection = readmeText
    ? `\nREPOSITORY README:\n${readmeText.substring(0, 2000)}\n`
    : '';

  return `You are an AI expedition narrator analyzing a repository's full life story.

REPOSITORY METADATA:
- Name: ${repoName}
- Total Commits: ${totalCommits}
- Default Branch: ${defaultBranch}
${readmeSection}
CHRONOLOGICAL COMMIT HISTORY (Oldest to Newest):
${commitHistoryText.substring(0, 8000)}

NARRATIVE SPECIFICATIONS:
1. Explain how the repository evolved over time, starting from its beginning, progressing through major additions/turning points, and reaching its current final state.
2. Focus on engineering progress and what the project gained as it developed.
3. Write in simple, clear English (60–120 words).
4. Do NOT simply list filenames, commit messages, or stats like "Across 20 commits...".
5. Do NOT invent features that are not described in the commits or README.
6. End with exactly ONE subtle ocean metaphor near the end.

Output ONLY the complete, cohesive repository story narrative.`;
}

module.exports = {
  buildCommitSummaryPrompt,
  buildRepoSummaryPrompt,
};
