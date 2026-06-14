import request from 'supertest';
import express, { Application } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Mocks — must be declared before any module imports that use them
// ---------------------------------------------------------------------------

const mockQuery = jest.fn();

jest.mock('../config/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { loginUser } from '../controllers/authController';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password_hash: '$2b$10$hashedpassword',
  profile_picture_url: null,
};

const MOCK_SESSION_ID = 42;
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build an Express app that only registers the login route with its controller.
 * This keeps the test surface minimal and focused on auth logic alone.
 */
function createLoginApp(): Application {
  const app = express();
  app.use(express.json());
  app.post('/api/auth/login', loginUser);
  return app;
}

/**
 * Convenience wrapper around supertest POST /api/auth/login
 */
function postLogin(
  app: Application,
  body: Record<string, unknown>,
): request.Test {
  return request(app)
    .post('/api/auth/login')
    .send(body)
    .set('User-Agent', 'Jest/1.0');
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('POST /api/auth/login — Integration', () => {
  let app: Application;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = createLoginApp();
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  // -----------------------------------------------------------------------
  // Happy path
  // -----------------------------------------------------------------------

  describe('Happy path — valid credentials', () => {
    it('returns 200 with a JWT token and sanitised user data', async () => {
      // Arrange
      mockQuery
        // First call: user lookup
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        // Second call: session insert
        .mockResolvedValueOnce({ rows: [{ id: MOCK_SESSION_ID }] });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT);

      // Act
      const response = await postLogin(app, {
        identifier: 'test@example.com',
        password: 'correct-password',
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        message: 'Autentificare reușită!',
        data: {
          user: {
            id: MOCK_USER.id,
            username: MOCK_USER.username,
            email: MOCK_USER.email,
          },
          token: MOCK_JWT,
        },
      });

      // The password_hash must never leak into the response
      expect(response.body.data.user).not.toHaveProperty('password_hash');

      // Verify the query was called with the correct SQL and params
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('SELECT id, username, email, password_hash'),
        [expect.any(String)],
      );

      // Verify bcrypt was called with the raw password and the stored hash
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct-password',
        MOCK_USER.password_hash,
      );

      // Verify JWT was signed with the correct payload
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: MOCK_USER.id, sessionId: MOCK_SESSION_ID },
        'test-secret-key',
        { expiresIn: '30d' },
      );
    });

    it('allows login via username instead of email', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [{ id: MOCK_SESSION_ID }] });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(MOCK_JWT);

      const response = await postLogin(app, {
        identifier: 'testuser',
        password: 'correct-password',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  // -----------------------------------------------------------------------
  // Unhappy paths — validation
  // -----------------------------------------------------------------------

  describe('Unhappy path — missing credentials', () => {
    it('returns 400 when identifier is missing', async () => {
      const response = await postLogin(app, { password: 'some-pass' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringMatching(/email|username/i),
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when password is missing', async () => {
      const response = await postLogin(app, { identifier: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringMatching(/parola/i),
      });
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('returns 400 when both fields are missing', async () => {
      const response = await postLogin(app, {});

      expect(response.status).toBe(400);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Unhappy paths — authentication failures
  // -----------------------------------------------------------------------

  describe('Unhappy path — invalid password', () => {
    it('returns 401 when password does not match', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [MOCK_USER] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await postLogin(app, {
        identifier: 'test@example.com',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('invalide'),
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('Unhappy path — user not found', () => {
    it('returns 401 when no user matches the identifier', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await postLogin(app, {
        identifier: 'unknown@example.com',
        password: 'some-password',
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('invalide'),
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('Edge cases', () => {
    it('returns 500 when JWT_SECRET is not configured', async () => {
      delete process.env.JWT_SECRET;

      mockQuery
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [{ id: MOCK_SESSION_ID }] });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await postLogin(app, {
        identifier: 'test@example.com',
        password: 'correct-password',
      });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('Eroare internă'),
      });

      // Restore for subsequent tests
      process.env.JWT_SECRET = 'test-secret-key';
    });

    it('returns 500 when the database throws an unexpected error', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection lost'));

      const response = await postLogin(app, {
        identifier: 'test@example.com',
        password: 'correct-password',
      });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        status: 'error',
        message: expect.stringContaining('Eroare internă'),
      });
    });
  });
});
