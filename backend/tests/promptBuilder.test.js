const { buildCommitSummaryPrompt, buildRepoSummaryPrompt } = require('../src/utils/promptBuilder');

describe('promptBuilder', () => {
  test('buildCommitSummaryPrompt returns non-empty prompt', () => {
    const commit = {
      message: 'feat: add awesome feature',
      author: { name: 'Alice' },
      files: ['src/index.js'],
    };
    const prompt = buildCommitSummaryPrompt(commit, 'diff text');
    expect(prompt).toContain('feat: add awesome feature');
    expect(prompt).toContain('Alice');
    expect(prompt).toContain('src/index.js');
  });

  test('buildRepoSummaryPrompt returns non-empty prompt', () => {
    const repoInfo = { fullName: 'owner/repo' };
    const recentCommits = [{ hash: '1234567', message: 'Initial commit' }];
    const prompt = buildRepoSummaryPrompt(repoInfo, recentCommits);
    expect(prompt).toContain('owner/repo');
    expect(prompt).toContain('Initial commit');
  });
});
