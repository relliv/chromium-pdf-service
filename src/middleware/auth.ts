import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config/env.js';

const PUBLIC_PATHS = ['/health', '/health/ready', '/health/live', '/'];

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip auth if no API keys configured
  if (!env.apiKeys || env.apiKeys.length === 0) {
    return;
  }

  // Skip auth for public paths
  if (PUBLIC_PATHS.some((path) => request.url === path || request.url.startsWith('/docs'))) {
    return;
  }

  const apiKey = request.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing X-API-Key header',
    });
  }

  if (!env.apiKeys.includes(apiKey)) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }
}
