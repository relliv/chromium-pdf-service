import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { pdfGenerator } from '../services/pdf-generator.js';
import { queueManager } from '../services/queue-manager.js';
import { htmlPdfRequestSchema, urlPdfRequestSchema } from '../schemas/pdf.schema.js';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Check if a completed PDF already exists for the given requestedKey.
 * If it exists, returns the response object; otherwise returns null.
 */
function getExistingCompletedPdf(requestedKey: string) {
  const existingJob = queueManager.getJobStatus(requestedKey);
  if (existingJob && existingJob.status === 'completed' && existingJob.filePath) {
    return {
      message: 'PDF already exists',
      requestedKey: existingJob.requestedKey,
      status: existingJob.status,
      filePath: existingJob.filePath,
      createdAt: existingJob.createdAt,
      updatedAt: existingJob.updatedAt,
    };
  }
  return null;
}

export async function pdfRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1,
    },
  });

  // POST /api/pdf/from-html - Generate PDF from HTML content
  app.post('/api/pdf/from-html', {
    schema: {
      description: 'Generate PDF from HTML content',
      tags: ['PDF'],
      body: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string', description: 'Unique identifier for the PDF job' },
          html: { type: 'string', description: 'HTML content to convert to PDF' },
          reCreate: { type: 'boolean', description: 'Force recreate PDF if already exists' },
          options: {
            type: 'object',
            properties: {
              browser: {
                type: 'object',
                description: 'Browser options',
                properties: {
                  timeout: { type: 'number' },
                  viewport: {
                    type: 'object',
                    properties: {
                      width: { type: 'number' },
                      height: { type: 'number' },
                    },
                  },
                  userAgent: { type: 'string' },
                  extraHTTPHeaders: { type: 'object' },
                  waitForSelector: { type: 'string' },
                  waitAfter: { type: 'number' },
                  disableAnimations: { type: 'boolean' },
                  colorScheme: { type: 'string', enum: ['light', 'dark', 'no-preference'] },
                  launchOptions: {
                    type: 'object',
                    description: 'Browser launch options',
                    properties: {
                      headless: { type: 'boolean' },
                      args: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
              pdf: { type: 'object', description: 'PDF options' },
              queue: { type: 'object', properties: { priority: { type: 'number' } } },
            },
          },
        },
      },
      response: {
        202: {
          description: 'Job queued successfully',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        200: {
          description: 'PDF already exists',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            filePath: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = htmlPdfRequestSchema.parse(request.body);

      logger.info({ requestedKey: body.requestedKey, reCreate: body.reCreate }, 'PDF from HTML request');

      // If reCreate is requested, remove existing job and PDF file first
      if (body.reCreate) {
        logger.info({ requestedKey: body.requestedKey }, 'Removing existing job for reCreate');
        await queueManager.removeJob(body.requestedKey);
      } else {
        // Check if a completed PDF already exists for this requestedKey
        const existingPdf = getExistingCompletedPdf(body.requestedKey);
        if (existingPdf) {
          return reply.status(200).send(existingPdf);
        }
      }

      const job = await pdfGenerator.generateFromHtml(body.requestedKey, body.html, {
        browser: body.options?.browser,
        pdf: body.options?.pdf,
        priority: body.options?.queue?.priority,
      });

      return reply.status(202).send({
        message: 'PDF generation job queued',
        requestedKey: job.requestedKey,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        // Queue full or duplicate key errors
        if (error.message.includes('Queue is full') || error.message.includes('already exists')) {
          return reply.status(409).send({
            error: error.message,
          });
        }
      }

      throw error;
    }
  });

  // POST /api/pdf/from-url - Generate PDF from URL
  app.post('/api/pdf/from-url', {
    schema: {
      description: 'Generate PDF from a URL',
      tags: ['PDF'],
      body: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string', description: 'Unique identifier for the PDF job' },
          url: { type: 'string', format: 'uri', description: 'URL to convert to PDF' },
          reCreate: { type: 'boolean', description: 'Force recreate PDF if already exists' },
          options: {
            type: 'object',
            properties: {
              browser: {
                type: 'object',
                description: 'Browser options',
                properties: {
                  timeout: { type: 'number' },
                  viewport: {
                    type: 'object',
                    properties: {
                      width: { type: 'number' },
                      height: { type: 'number' },
                    },
                  },
                  userAgent: { type: 'string' },
                  extraHTTPHeaders: { type: 'object' },
                  waitForSelector: { type: 'string' },
                  waitAfter: { type: 'number' },
                  disableAnimations: { type: 'boolean' },
                  colorScheme: { type: 'string', enum: ['light', 'dark', 'no-preference'] },
                  launchOptions: {
                    type: 'object',
                    description: 'Browser launch options',
                    properties: {
                      headless: { type: 'boolean' },
                      args: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
              pdf: { type: 'object', description: 'PDF options' },
              queue: { type: 'object', properties: { priority: { type: 'number' } } },
            },
          },
        },
      },
      response: {
        202: {
          description: 'Job queued successfully',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        200: {
          description: 'PDF already exists',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            filePath: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Log raw request body for debugging
      logger.info({ rawBody: request.body }, 'Raw request body received');

      const body = urlPdfRequestSchema.parse(request.body);

      logger.info({ requestedKey: body.requestedKey, reCreate: body.reCreate }, 'PDF from URL request');

      // If reCreate is requested, remove existing job and PDF file first
      if (body.reCreate) {
        logger.info({ requestedKey: body.requestedKey }, 'Removing existing job for reCreate');
        await queueManager.removeJob(body.requestedKey);
      } else {
        // Check if a completed PDF already exists for this requestedKey
        const existingPdf = getExistingCompletedPdf(body.requestedKey);
        if (existingPdf) {
          return reply.status(200).send(existingPdf);
        }
      }

      const job = await pdfGenerator.generateFromUrl(body.requestedKey, body.url, {
        browser: body.options?.browser,
        pdf: body.options?.pdf,
        priority: body.options?.queue?.priority,
      });

      return reply.status(202).send({
        message: 'PDF generation job queued',
        requestedKey: job.requestedKey,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('Queue is full') || error.message.includes('already exists')) {
          return reply.status(409).send({
            error: error.message,
          });
        }
      }

      throw error;
    }
  });

  // POST /api/pdf/from-file - Generate PDF from uploaded HTML file
  app.post('/api/pdf/from-file', {
    schema: {
      description: 'Generate PDF from an uploaded HTML file',
      tags: ['PDF'],
      consumes: ['multipart/form-data'],
      response: {
        202: {
          description: 'Job queued successfully',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        200: {
          description: 'PDF already exists',
          type: 'object',
          additionalProperties: true,
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
            status: { type: 'string' },
            filePath: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          error: 'No file uploaded',
        });
      }

      // Check file type
      const filename = data.filename.toLowerCase();
      if (!filename.endsWith('.html') && !filename.endsWith('.htm')) {
        return reply.status(400).send({
          error: 'Invalid file type. Only .html and .htm files are allowed.',
        });
      }

      // Read file content
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const htmlContent = Buffer.concat(chunks).toString('utf-8');

      // Get requestedKey and options from fields
      const fields = data.fields;

      // Extract requestedKey
      const requestedKeyField = fields['requestedKey'];
      if (
        !requestedKeyField ||
        typeof requestedKeyField !== 'object' ||
        !('value' in requestedKeyField)
      ) {
        return reply.status(400).send({
          error: 'requestedKey is required',
        });
      }
      const requestedKey = String(requestedKeyField.value);

      // Validate requestedKey
      if (!requestedKey || !/^[a-zA-Z0-9_-]+$/.test(requestedKey)) {
        return reply.status(400).send({
          error: 'requestedKey must be alphanumeric with dashes and underscores',
        });
      }

      // Extract reCreate flag
      const reCreateField = fields['reCreate'];
      const reCreate =
        reCreateField &&
        typeof reCreateField === 'object' &&
        'value' in reCreateField &&
        String(reCreateField.value) === 'true';

      // If reCreate is requested, remove existing job and PDF file first
      if (reCreate) {
        await queueManager.removeJob(requestedKey);
      } else {
        // Check if a completed PDF already exists for this requestedKey
        const existingPdf = getExistingCompletedPdf(requestedKey);
        if (existingPdf) {
          return reply.status(200).send(existingPdf);
        }
      }

      // Extract options if provided
      let options: {
        browser?: Record<string, unknown>;
        pdf?: Record<string, unknown>;
        queue?: { priority?: number };
      } = {};

      const optionsField = fields['options'];
      if (optionsField && typeof optionsField === 'object' && 'value' in optionsField) {
        try {
          options = JSON.parse(String(optionsField.value));
        } catch {
          return reply.status(400).send({
            error: 'Invalid options JSON',
          });
        }
      }

      const job = await pdfGenerator.generateFromFile(requestedKey, htmlContent, {
        browser: options.browser,
        pdf: options.pdf,
        priority: options.queue?.priority,
      });

      return reply.status(202).send({
        message: 'PDF generation job queued',
        requestedKey: job.requestedKey,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Queue is full') || error.message.includes('already exists')) {
          return reply.status(409).send({
            error: error.message,
          });
        }
      }

      throw error;
    }
  });
}
