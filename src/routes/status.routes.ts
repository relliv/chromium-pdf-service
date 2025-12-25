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
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // DELETE /api/pdf/cancel/:requestedKey - Cancel a job
  app.delete(
    '/api/pdf/cancel/:requestedKey',
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
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // GET /api/pdf/download/:requestedKey - Download generated PDF
  app.get(
    '/api/pdf/download/:requestedKey',
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
            details: error.errors,
          });
        }
        throw error;
      }
    }
  );

  // GET /api/pdf/queue - Get queue statistics
  app.get('/api/pdf/queue', async (_request: FastifyRequest, reply: FastifyReply) => {
    const stats = queueManager.getQueueStats();
    return reply.send(stats);
  });
}
