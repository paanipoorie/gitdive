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

  test('buildRepoSummaryPrompt returns repository story prompt for 5 commits', () => {
    const repoInfo = { fullName: 'owner/repo-5' };
    const commits = Array.from({ length: 5 }, (_, i) => ({
      hash: `hash500${i}`,
      message: `Commit message ${i + 1}`,
      date: '2026-07-20T10:00:00Z',
    }));
    const prompt = buildRepoSummaryPrompt(repoInfo, '# Sample README', commits);
    expect(prompt).toContain('owner/repo-5');
    expect(prompt).toContain('Total Commits: 5');
    expect(prompt).toContain('Sample README');
    expect(prompt).toContain('Commit hash500');
  });

  test('buildRepoSummaryPrompt handles repository story prompt for 50+ commits', () => {
    const repoInfo = { fullName: 'owner/repo-50' };
    const commits = Array.from({ length: 55 }, (_, i) => ({
      hash: `hash50${i.toString().padStart(2, '0')}`,
      message: `Feature commit ${i + 1}`,
      date: '2026-07-21T10:00:00Z',
    }));
    const prompt = buildRepoSummaryPrompt(repoInfo, '# 50 Commits Repo', commits);
    expect(prompt).toContain('owner/repo-50');
    expect(prompt).toContain('Total Commits: 55');
    expect(prompt).toContain('50 Commits Repo');
  });

  test('buildRepoSummaryPrompt handles repository story prompt for 200+ commits with sampling', () => {
    const repoInfo = { fullName: 'owner/repo-200' };
    const commits = Array.from({ length: 220 }, (_, i) => ({
      hash: `hash200_${i}`,
      message: `Large repo commit ${i + 1}`,
      date: '2026-07-22T10:00:00Z',
    }));
    const prompt = buildRepoSummaryPrompt(repoInfo, '# 200 Commits Repo', commits);
    expect(prompt).toContain('owner/repo-200');
    expect(prompt).toContain('Total Commits: 220');
    expect(prompt).toContain('200 Commits Repo');
  });
});
