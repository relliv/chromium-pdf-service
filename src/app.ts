import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { logger } from './utils/logger.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Root route
  app.get('/', async () => {
    return {
      service: 'chromium-pdf-service',
      version: '1.0.0',
      status: 'running',
    };
  });

  return app;
}
