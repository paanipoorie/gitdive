const request = require('supertest');
const app = require('../src/app');
const { trackDir } = require('../src/utils/tempDir');

describe('API Integration Tests', () => {
  beforeAll(() => {
    trackDir('/home/nish4nt/dev/gitdive', { repoId: 'test-api-session' });
  });

  describe('GET /api/health', () => {
    test('returns status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
    });
  });

  describe('POST /api/repos/validate', () => {
    test('rejects malformed GitHub URLs', async () => {
      const res = await request(app).post('/api/repos/validate').send({ url: 'not-a-url' });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/repos/:repoId/commits', () => {
    test('returns commit history for tracked session', async () => {
      const res = await request(app).get('/api/repos/test-api-session/commits?limit=3');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.commits)).toBe(true);
    });
  });

  describe('GET /api/repos/:repoId/timeline', () => {
    test('returns minimal commit timeline', async () => {
      const res = await request(app).get('/api/repos/test-api-session/timeline?limit=3');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.timeline)).toBe(true);
    });
  });

  describe('GET /api/repos/:repoId/stats', () => {
    test('returns aggregated statistics', async () => {
      const res = await request(app).get('/api/repos/test-api-session/stats');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalCommits');
    });
  });
});
