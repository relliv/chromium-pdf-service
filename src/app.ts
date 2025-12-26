import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { env, isDevelopment } from './config/env.js';
import { pdfRoutes } from './routes/pdf.routes.js';
import { statusRoutes } from './routes/status.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { authMiddleware } from './middleware/auth.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
  });

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register CORS
  await app.register(cors, {
    origin: env.allowedOrigins.length > 0 ? env.allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: env.allowedOrigins.length > 0,
  });

  // Register Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disabled for PDF/HTML content
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Register Rate Limiting
  await app.register(rateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
    keyGenerator: (request) => request.ip,
    skipOnError: false,
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Register API Key Authentication
  app.addHook('onRequest', authMiddleware);

  // Register Swagger (development only)
  if (isDevelopment) {
    await app.register(fastifySwagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Chromium PDF Service',
          description: 'PDF generation service built with Fastify, TypeScript, and Playwright',
          version: '1.0.0',
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          {
            url: `http://localhost:${env.port}`,
            description: 'Development server',
          },
        ],
        tags: [
          { name: 'PDF', description: 'PDF generation endpoints' },
          { name: 'Status', description: 'Job status endpoints' },
          { name: 'Settings', description: 'Service settings endpoints' },
          { name: 'Health', description: 'Health check endpoints' },
        ],
      },
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  }

  // Register routes
  await app.register(healthRoutes);
  await app.register(pdfRoutes);
  await app.register(statusRoutes);
  await app.register(settingsRoutes);

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
