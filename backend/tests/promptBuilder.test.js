const { buildCommitSummaryPrompt, buildRepoSummaryPrompt } = require('../src/utils/promptBuilder');

describe('promptBuilder', () => {
  test('buildCommitSummaryPrompt returns non-empty ocean narrator prompt', () => {
    const commit = {
      message: 'feat: add awesome feature',
      author: { name: 'Alice' },
      files: ['src/index.js'],
    };
    const prompt = buildCommitSummaryPrompt(commit, 'diff text');
    expect(prompt).toContain('Jacques Cousteau');
    expect(prompt).toContain('feat: add awesome feature');
    expect(prompt).toContain('src/index.js');
  });

  test('buildRepoSummaryPrompt returns non-empty ocean floor prompt', () => {
    const repoInfo = { fullName: 'owner/repo' };
    const recentCommits = [{ hash: '1234567', message: 'Initial commit' }];
    const prompt = buildRepoSummaryPrompt(repoInfo, recentCommits);
    expect(prompt).toContain('owner/repo');
    expect(prompt).toContain('Initial commit');
    expect(prompt).toContain('seabed floor');
  });
});
