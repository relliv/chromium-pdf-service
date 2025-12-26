import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';

// Mock env before importing
vi.mock('../../src/config/env.js', () => ({
  env: {
    apiKeys: [],
  },
}));

import { authMiddleware } from '../../src/middleware/auth.js';
import { env } from '../../src/config/env.js';

describe('Auth Middleware', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    app.addHook('onRequest', authMiddleware);

    // Add test routes
    app.get('/api/test', async () => ({ message: 'success' }));
    app.get('/health', async () => ({ status: 'ok' }));
    app.get('/health/ready', async () => ({ status: 'ready' }));
    app.get('/health/live', async () => ({ status: 'live' }));
    app.get('/', async () => ({ service: 'test' }));
    app.get('/docs', async () => ({ docs: true }));
    app.get('/docs/openapi.json', async () => ({ openapi: '3.0.0' }));

    await app.ready();
  });

  describe('when API keys are not configured', () => {
    beforeEach(() => {
      (env as { apiKeys: string[] }).apiKeys = [];
    });

    it('should allow requests without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'success' });
    });
  });

  describe('when API keys are configured', () => {
    beforeEach(() => {
      (env as { apiKeys: string[] }).apiKeys = ['valid-key-1', 'valid-key-2'];
    });

    it('should allow requests with valid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          'x-api-key': 'valid-key-1',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'success' });
    });

    it('should allow requests with second valid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          'x-api-key': 'valid-key-2',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should reject requests without API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'Unauthorized',
        message: 'Missing X-API-Key header',
      });
    });

    it('should reject requests with invalid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          'x-api-key': 'invalid-key',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
    });

    it('should reject requests with empty API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/test',
        headers: {
          'x-api-key': '',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('public paths (no auth required)', () => {
    beforeEach(() => {
      (env as { apiKeys: string[] }).apiKeys = ['secret-key'];
    });

    it('should allow /health without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow /health/ready without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow /health/live without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/live',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow / (root) without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow /docs without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should allow /docs/* paths without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/openapi.json',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
