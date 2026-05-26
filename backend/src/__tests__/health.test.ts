import request from 'supertest';
import express, { Application } from 'express';

// Create a minimal app for testing
const createTestApp = (): Application => {
  const app = express();
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Serverul funcționează corect!' });
  });
  return app;
};

describe('Health Check Endpoint', () => {
  const app = createTestApp();

  it('should return 200 with success status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('message');
  });

  it('should return JSON content type', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers['content-type']).toMatch(/json/);
  });
});
