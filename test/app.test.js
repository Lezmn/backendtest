const request = require('supertest');
const app = require('../src/config/app.js');

describe('Health Check', () => {
  test('GET /health should return 200 with status OK', async () => {
    const res = await request(app)
      .get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /invalid-route should return 404', async () => {
    const res = await request(app)
      .get('/invalid-route');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
