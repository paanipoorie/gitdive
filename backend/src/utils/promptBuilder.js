function buildCommitSummaryPrompt(commit, diffText = '') {
  return `You are an expert deep-sea expedition narrator exploring a codebase's memory reef.

Your task is to explain the exact technical changes made in this commit using vivid, imaginative ocean and marine imagery (currents, deep-sea anchors, bioluminescent corals, pressure valves, underwater navigation channels, seabed trenches).

MANDATORY RULES:
1. Deeply weave ocean and marine metaphors into every single sentence. Connect technical actions directly to ocean elements (e.g. if files were created, say a new seabed anchor was dropped; if bugs were fixed, say turbulent currents were calmed; if UI was built, say bioluminescent coral reefs bloomed; if auth/routing was added, say new navigation channels were charted through the waves).
2. Do NOT write dry, generic, or vague summaries. Make it evocative and distinct.
3. Do NOT repeat raw commit hashes, dates, or list raw file paths.
4. Keep the length strictly to 2 to 3 vivid, engaging sentences.

Commit Message Context: ${commit.message}
Files Changed: ${JSON.stringify(commit.files || [])}
${diffText ? `Diff snippet:\n${diffText.substring(0, 1500)}` : ''}

Output ONLY the 2-3 sentence ocean-themed commit summary.`;
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

  return `You are an ancient chronicler of the abyssal sea, telling the grand oceanic origin story of how this repository emerged.

REPOSITORY METADATA:
- Name: ${repoName}
- Total Commits: ${totalCommits}
- Default Branch: ${defaultBranch}
${readmeSection}
CHRONOLOGICAL COMMIT HISTORY (Oldest to Newest):
${commitHistoryText.substring(0, 8000)}

NARRATIVE SPECIFICATIONS:
1. Tell a captivating, chronological oceanic story of how this project emerged and grew over time, driven by its actual commits and README.
2. Structure the story as a 3-part deep-sea odyssey:
   - Act I: The Surface Drop & First Anchor (how the project originated from its initial commit, setting up the core foundation on the seabed).
   - Act II: Navigating Current Shifts & Coral Reef Expansion (how features, bug fixes, refactors, and new routes expanded the underwater ecosystem).
   - Act III: The Abyssal Citadel (how the project matured into a resilient deep-sea structure resting peacefully at the ocean floor).
3. Every paragraph MUST be rich in ocean and marine metaphors (pressure, bioluminescence, ocean currents, abyssal trenches, tides, coral formations, anchors).
4. Reflect the true functional purpose of the codebase while maintaining an immersive, poetic marine tone.
5. Length: 3 short paragraphs (approx 120–180 words total). Do NOT output raw hashes or bullet points.

Output ONLY the complete, captivating ocean story chronicle.`;
}

module.exports = {
  buildCommitSummaryPrompt,
  buildRepoSummaryPrompt,
};
