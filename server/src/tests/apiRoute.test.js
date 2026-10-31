import request from 'supertest';
import { createApp } from '../app.js';

describe('API routes', () => {
  const app = createApp();

  test('GET /api/health returns 200 and ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.ts).toBeDefined();
  });

  test('GET /api/v1/health returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/v1/repos/analyze rejects non-GitHub URLs', async () => {
    const res = await request(app)
      .post('/api/v1/repos/analyze')
      .send({ url: 'https://gitlab.com/some/repo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

