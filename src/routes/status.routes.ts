import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { queueManager } from '../services/queue-manager.js';
import { statusParamsSchema, StatusParams } from '../schemas/pdf.schema.js';
import { ZodError } from 'zod';

export async function statusRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/pdf/status/:requestedKey - Get job status
  app.get(
    '/api/pdf/status/:requestedKey',
    {
      schema: {
        description: 'Get the status of a PDF generation job',
        tags: ['Status'],
        params: {
          type: 'object',
          required: ['requestedKey'],
          properties: {
            requestedKey: { type: 'string', description: 'The unique job identifier' },
          },
        },
        response: {
          200: {
            description: 'Job status',
            type: 'object',
            additionalProperties: true,
            properties: {
              requestedKey: { type: 'string' },
              status: { type: 'string' },
              progress: { type: 'number' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              filePath: { type: 'string' },
              error: { type: 'string' },
            },
          },
          404: {
            description: 'Job not found',
            type: 'object',
            additionalProperties: true,
            properties: {
              error: { type: 'string' },
              requestedKey: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: StatusParams }>, reply: FastifyReply) => {
      try {
        const params = statusParamsSchema.parse(request.params);

        const status = queueManager.getJobStatus(params.requestedKey);

        if (!status) {
          return reply.status(404).send({
            error: 'Job not found',
            requestedKey: params.requestedKey,
          });
        }

        return reply.send(status);
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

  // DELETE /api/pdf/cancel/:requestedKey - Cancel a job
  app.delete(
    '/api/pdf/cancel/:requestedKey',
    {
      schema: {
        description: 'Cancel a pending PDF generation job',
        tags: ['Status'],
        params: {
          type: 'object',
          required: ['requestedKey'],
          properties: {
            requestedKey: { type: 'string', description: 'The unique job identifier' },
          },
        },
        response: {
          200: {
            description: 'Job cancelled successfully',
            type: 'object',
            additionalProperties: true,
            properties: {
              message: { type: 'string' },
              requestedKey: { type: 'string' },
              status: { type: 'string' },
            },
          },
          404: {
            description: 'Job not found',
            type: 'object',
            additionalProperties: true,
            properties: {
              error: { type: 'string' },
              requestedKey: { type: 'string' },
            },
          },
          409: {
            description: 'Job cannot be cancelled',
            type: 'object',
            additionalProperties: true,
            properties: {
              error: { type: 'string' },
              requestedKey: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: StatusParams }>, reply: FastifyReply) => {
      try {
        const params = statusParamsSchema.parse(request.params);

        const cancelled = queueManager.cancelJob(params.requestedKey);

        if (!cancelled) {
          const job = queueManager.getJobStatus(params.requestedKey);

          if (!job) {
            return reply.status(404).send({
              error: 'Job not found',
              requestedKey: params.requestedKey,
            });
          }

          return reply.status(409).send({
            error: 'Job cannot be cancelled',
            requestedKey: params.requestedKey,
            status: job.status,
            message: `Job is already ${job.status}`,
          });
        }

        return reply.send({
          message: 'Job cancelled successfully',
          requestedKey: params.requestedKey,
          status: 'cancelled',
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

  // GET /api/pdf/download/:requestedKey - Download generated PDF
  app.get(
    '/api/pdf/download/:requestedKey',
    {
      schema: {
        description: 'Download the generated PDF file',
        tags: ['Status'],
        params: {
          type: 'object',
          required: ['requestedKey'],
          properties: {
            requestedKey: { type: 'string', description: 'The unique job identifier' },
          },
        },
        response: {
          200: {
            description: 'PDF file',
            type: 'string',
            format: 'binary',
          },
          404: {
            description: 'Job or file not found',
            type: 'object',
            additionalProperties: true,
            properties: {
              error: { type: 'string' },
              requestedKey: { type: 'string' },
              message: { type: 'string' },
            },
          },
          409: {
            description: 'PDF not ready',
            type: 'object',
            additionalProperties: true,
            properties: {
              error: { type: 'string' },
              requestedKey: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: StatusParams }>, reply: FastifyReply) => {
      try {
        const params = statusParamsSchema.parse(request.params);

        const job = queueManager.getJobStatus(params.requestedKey);

        if (!job) {
          return reply.status(404).send({
            error: 'Job not found',
            requestedKey: params.requestedKey,
          });
        }

        if (job.status !== 'completed') {
          return reply.status(409).send({
            error: 'PDF not ready',
            requestedKey: params.requestedKey,
            status: job.status,
            message:
              job.status === 'failed'
                ? `PDF generation failed: ${job.error}`
                : `PDF is still ${job.status}`,
          });
        }

        if (!job.filePath || !existsSync(job.filePath)) {
          return reply.status(404).send({
            error: 'PDF file not found',
            requestedKey: params.requestedKey,
            message: 'The PDF file may have been deleted',
          });
        }

        const fileStats = await stat(job.filePath);
        const filename = basename(job.filePath);

        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="${filename}"`);
        reply.header('Content-Length', fileStats.size);

        return reply.send(createReadStream(job.filePath));
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

  // GET /api/pdf/queue - Get queue statistics
  app.get('/api/pdf/queue', {
    schema: {
      description: 'Get queue statistics',
      tags: ['Status'],
      response: {
        200: {
          description: 'Queue statistics',
          type: 'object',
          additionalProperties: true,
          properties: {
            queued: { type: 'number' },
            processing: { type: 'number' },
            completed: { type: 'number' },
            failed: { type: 'number' },
            cancelled: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const stats = queueManager.getQueueStats();
    return reply.send(stats);
  });
}
