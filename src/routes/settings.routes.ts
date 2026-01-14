import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { settingsManager } from '../services/settings-manager.js';
import { settingsUpdateSchema, SettingsUpdate } from '../schemas/settings.schema.js';
import { ZodError } from 'zod';

export async function settingsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/settings - Get current settings
  app.get('/api/settings', {
    schema: {
      description: 'Get current service settings',
      tags: ['Settings'],
      response: {
        200: {
          description: 'Current settings',
          type: 'object',
          additionalProperties: true,
          properties: {
            browser: { type: 'object', additionalProperties: true },
            pdf: { type: 'object', additionalProperties: true },
            queue: { type: 'object', additionalProperties: true },
            storage: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const settings = settingsManager.get();
    return reply.send(settings);
  });

  // PUT /api/settings - Update settings
  app.put(
    '/api/settings',
    {
      schema: {
        description: 'Update service settings',
        tags: ['Settings'],
        body: {
          type: 'object',
          additionalProperties: true,
          properties: {
            browser: { type: 'object', description: 'Browser settings' },
            pdf: { type: 'object', description: 'PDF generation settings' },
            queue: { type: 'object', description: 'Queue settings' },
            storage: { type: 'object', description: 'Storage settings' },
          },
        },
        response: {
          200: {
            description: 'Settings updated successfully',
            type: 'object',
            additionalProperties: true,
            properties: {
              message: { type: 'string' },
              settings: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  browser: { type: 'object', additionalProperties: true },
                  pdf: { type: 'object', additionalProperties: true },
                  queue: { type: 'object', additionalProperties: true },
                  storage: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: SettingsUpdate }>, reply: FastifyReply) => {
      try {
        const body = settingsUpdateSchema.parse(request.body);

        const updatedSettings = await settingsManager.update(body);

        return reply.send({
          message: 'Settings updated successfully',
          settings: updatedSettings,
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return reply.status(400).send({
            error: 'Validation failed',
            details: error.issues,
          });
        }
        throw error;
      }
    }
  );

  // POST /api/settings/reset - Reset settings to defaults
  app.post('/api/settings/reset', {
    schema: {
      description: 'Reset all settings to their default values',
      tags: ['Settings'],
      response: {
        200: {
          description: 'Settings reset successfully',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            settings: {
              type: 'object',
              additionalProperties: true,
              properties: {
                browser: { type: 'object', additionalProperties: true },
                pdf: { type: 'object', additionalProperties: true },
                queue: { type: 'object', additionalProperties: true },
                storage: { type: 'object', additionalProperties: true },
              },
            },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const defaultSettings = await settingsManager.reset();

    return reply.send({
      message: 'Settings reset to defaults',
      settings: defaultSettings,
    });
  });
}
