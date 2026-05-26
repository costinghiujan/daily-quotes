import { createQuoteSchema, moodSearchSchema, quoteIdSchema } from '../schemas/quoteSchemas';
import { registerSchema, loginSchema } from '../schemas/authSchemas';
import { validate } from '../middleware/validationMiddleware';
import express, { Application } from 'express';
import request from 'supertest';

/**
 * Helper to create a test app with a specific validation schema
 */
const createValidationTestApp = (
  schema: express.RequestHandler[],
  routeHandler: (req: express.Request, res: express.Response) => void,
): Application => {
  const app = express();
  app.use(express.json());
  app.post('/test', ...schema, validate, routeHandler);
  return app;
};

describe('Quote Validation Schemas', () => {
  describe('createQuoteSchema', () => {
    const app = createValidationTestApp(createQuoteSchema, (req, res) => {
      res.status(200).json({ success: true, data: req.body });
    });

    it('should reject empty text', async () => {
      const response = await request(app)
        .post('/test')
        .send({ text: '', author: 'Test Author' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should reject empty author', async () => {
      const response = await request(app)
        .post('/test')
        .send({ text: 'Test quote', author: '' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should reject text exceeding 1000 characters', async () => {
      const response = await request(app)
        .post('/test')
        .send({ text: 'x'.repeat(1001), author: 'Test Author' });
      expect(response.status).toBe(400);
    });

    it('should accept valid quote data', async () => {
      const response = await request(app)
        .post('/test')
        .send({ text: 'A valid quote', author: 'Test Author' });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should accept quote with optional category', async () => {
      const response = await request(app)
        .post('/test')
        .send({ text: 'A valid quote', author: 'Test Author', category: 'Inspiration' });
      expect(response.status).toBe(200);
    });
  });

  describe('moodSearchSchema', () => {
    const app = createValidationTestApp(moodSearchSchema, (req, res) => {
      res.status(200).json({ success: true });
    });

    it('should reject empty mood', async () => {
      const response = await request(app)
        .post('/test')
        .send({ mood: '' });
      expect(response.status).toBe(400);
    });

    it('should reject missing mood', async () => {
      const response = await request(app)
        .post('/test')
        .send({});
      expect(response.status).toBe(400);
    });

    it('should accept valid mood', async () => {
      const response = await request(app)
        .post('/test')
        .send({ mood: 'happiness joy gratitude' });
      expect(response.status).toBe(200);
    });
  });

  describe('quoteIdSchema', () => {
    const app = express();
    app.use(express.json());
    app.get('/test/:id', ...quoteIdSchema, validate, (req, res) => {
      res.status(200).json({ success: true });
    });

    it('should reject non-integer id', async () => {
      const response = await request(app).get('/test/abc');
      expect(response.status).toBe(400);
    });

    it('should reject negative id', async () => {
      const response = await request(app).get('/test/-1');
      expect(response.status).toBe(400);
    });

    it('should accept valid integer id', async () => {
      const response = await request(app).get('/test/42');
      expect(response.status).toBe(200);
    });
  });
});

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    const app = createValidationTestApp(registerSchema, (req, res) => {
      res.status(200).json({ success: true });
    });

    it('should reject missing username', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'test@test.com', password: 'Password1' });
      expect(response.status).toBe(400);
    });

    it('should reject short username', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: 'ab', email: 'test@test.com', password: 'Password1' });
      expect(response.status).toBe(400);
    });

    it('should reject weak password (no uppercase)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: 'testuser', email: 'test@test.com', password: 'password1' });
      expect(response.status).toBe(400);
    });

    it('should reject weak password (no digit)', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: 'testuser', email: 'test@test.com', password: 'Password' });
      expect(response.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: 'testuser', email: 'not-an-email', password: 'Password1' });
      expect(response.status).toBe(400);
    });

    it('should accept valid registration data', async () => {
      const response = await request(app)
        .post('/test')
        .send({ username: 'testuser', email: 'test@test.com', password: 'Password1' });
      expect(response.status).toBe(200);
    });
  });

  describe('loginSchema', () => {
    const app = createValidationTestApp(loginSchema, (req, res) => {
      res.status(200).json({ success: true });
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/test')
        .send({ password: 'Password1' });
      expect(response.status).toBe(400);
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'test@test.com' });
      expect(response.status).toBe(400);
    });

    it('should accept valid login data', async () => {
      const response = await request(app)
        .post('/test')
        .send({ email: 'test@test.com', password: 'Password1' });
      expect(response.status).toBe(200);
    });
  });
});
