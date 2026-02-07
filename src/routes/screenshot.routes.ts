import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { screenshotGenerator } from '../services/screenshot-generator.js';
import { screenshotQueueManager } from '../services/screenshot-queue-manager.js';
import { htmlScreenshotRequestSchema, urlScreenshotRequestSchema } from '../schemas/screenshot.schema.js';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Check if a completed screenshot already exists for the given requestedKey.
 * If it exists, returns the response object; otherwise returns null.
 */
function getExistingCompletedScreenshot(requestedKey: string) {
  const existingJob = screenshotQueueManager.getJobStatus(requestedKey);
  if (existingJob && existingJob.status === 'completed' && existingJob.filePath) {
    return {
      message: 'Screenshot already exists',
      requestedKey: existingJob.requestedKey,
      status: existingJob.status,
      filePath: existingJob.filePath,
      createdAt: existingJob.createdAt,
      updatedAt: existingJob.updatedAt,
    };
  }
  return null;
}

export async function screenshotRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1,
    },
  });

  // POST /api/screenshot/from-html - Generate screenshot from HTML content
  app.post('/api/screenshot/from-html', {
    schema: {
      description: 'Generate screenshot from HTML content',
      tags: ['Screenshot'],
      body: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string', description: 'Unique identifier for the screenshot job' },
          html: { type: 'string', description: 'HTML content to capture' },
          reCreate: { type: 'boolean', description: 'Force recreate screenshot if already exists' },
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
              screenshot: { type: 'object', description: 'Screenshot options' },
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
          description: 'Screenshot already exists',
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
      const body = htmlScreenshotRequestSchema.parse(request.body);

      logger.info({ requestedKey: body.requestedKey, reCreate: body.reCreate }, 'Screenshot from HTML request');

      if (body.reCreate) {
        logger.info({ requestedKey: body.requestedKey }, 'Removing existing screenshot job for reCreate');
        await screenshotQueueManager.removeJob(body.requestedKey);
      } else {
        const existingScreenshot = getExistingCompletedScreenshot(body.requestedKey);
        if (existingScreenshot) {
          return reply.status(200).send(existingScreenshot);
        }
      }

      const job = await screenshotGenerator.generateFromHtml(body.requestedKey, body.html, {
        browser: body.options?.browser,
        screenshot: body.options?.screenshot,
        priority: body.options?.queue?.priority,
      });

      return reply.status(202).send({
        message: 'Screenshot generation job queued',
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

  // POST /api/screenshot/from-url - Generate screenshot from URL
  app.post('/api/screenshot/from-url', {
    schema: {
      description: 'Generate screenshot from a URL',
      tags: ['Screenshot'],
      body: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string', description: 'Unique identifier for the screenshot job' },
          url: { type: 'string', format: 'uri', description: 'URL to capture' },
          reCreate: { type: 'boolean', description: 'Force recreate screenshot if already exists' },
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
              screenshot: { type: 'object', description: 'Screenshot options' },
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
          description: 'Screenshot already exists',
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
      logger.info({ rawBody: request.body }, 'Raw screenshot request body received');

      const body = urlScreenshotRequestSchema.parse(request.body);

      logger.info({ requestedKey: body.requestedKey, reCreate: body.reCreate }, 'Screenshot from URL request');

      if (body.reCreate) {
        logger.info({ requestedKey: body.requestedKey }, 'Removing existing screenshot job for reCreate');
        await screenshotQueueManager.removeJob(body.requestedKey);
      } else {
        const existingScreenshot = getExistingCompletedScreenshot(body.requestedKey);
        if (existingScreenshot) {
          return reply.status(200).send(existingScreenshot);
        }
      }

      const job = await screenshotGenerator.generateFromUrl(body.requestedKey, body.url, {
        browser: body.options?.browser,
        screenshot: body.options?.screenshot,
        priority: body.options?.queue?.priority,
      });

      return reply.status(202).send({
        message: 'Screenshot generation job queued',
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

  // POST /api/screenshot/from-file - Generate screenshot from uploaded HTML file
  app.post('/api/screenshot/from-file', {
    schema: {
      description: 'Generate screenshot from an uploaded HTML file',
      tags: ['Screenshot'],
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
          description: 'Screenshot already exists',
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

      const filename = data.filename.toLowerCase();
      if (!filename.endsWith('.html') && !filename.endsWith('.htm')) {
        return reply.status(400).send({
          error: 'Invalid file type. Only .html and .htm files are allowed.',
        });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const htmlContent = Buffer.concat(chunks).toString('utf-8');

      const fields = data.fields;

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

      if (!requestedKey || !/^[a-zA-Z0-9_-]+$/.test(requestedKey)) {
        return reply.status(400).send({
          error: 'requestedKey must be alphanumeric with dashes and underscores',
        });
      }

      const reCreateField = fields['reCreate'];
      const reCreate =
        reCreateField &&
        typeof reCreateField === 'object' &&
        'value' in reCreateField &&
        String(reCreateField.value) === 'true';

      if (reCreate) {
        await screenshotQueueManager.removeJob(requestedKey);
      } else {
        const existingScreenshot = getExistingCompletedScreenshot(requestedKey);
        if (existingScreenshot) {
          return reply.status(200).send(existingScreenshot);
        }
      }

      let options: {
        browser?: Record<string, unknown>;
        screenshot?: Record<string, unknown>;
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

      const job = await screenshotGenerator.generateFromFile(requestedKey, htmlContent, {
        browser: options.browser,
        screenshot: options.screenshot,
        priority: options.queue?.priority,
      });

      return reply.status(202).send({
        message: 'Screenshot generation job queued',
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

  // GET /api/screenshot/status/:requestedKey - Get screenshot job status
  app.get('/api/screenshot/status/:requestedKey', {
    schema: {
      description: 'Get screenshot job status',
      tags: ['Screenshot'],
      params: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string' },
        },
        required: ['requestedKey'],
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
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { requestedKey: string } }>, reply: FastifyReply) => {
    const { requestedKey } = request.params;
    const jobStatus = screenshotQueueManager.getJobStatus(requestedKey);

    if (!jobStatus) {
      return reply.status(404).send({
        error: `Screenshot job with requestedKey '${requestedKey}' not found`,
      });
    }

    return reply.send(jobStatus);
  });

  // GET /api/screenshot/download/:requestedKey - Download generated screenshot
  app.get('/api/screenshot/download/:requestedKey', {
    schema: {
      description: 'Download the generated screenshot file',
      tags: ['Screenshot'],
      params: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string' },
        },
        required: ['requestedKey'],
      },
      response: {
        200: {
          description: 'Screenshot file',
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
          description: 'Screenshot not ready',
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
  }, async (request: FastifyRequest<{ Params: { requestedKey: string } }>, reply: FastifyReply) => {
    const { requestedKey } = request.params;
    const job = screenshotQueueManager.getJobStatus(requestedKey);

    if (!job) {
      return reply.status(404).send({
        error: 'Job not found',
        requestedKey,
      });
    }

    if (job.status !== 'completed') {
      return reply.status(409).send({
        error: 'Screenshot not ready',
        requestedKey,
        status: job.status,
        message:
          job.status === 'failed'
            ? `Screenshot generation failed: ${job.error}`
            : `Screenshot is still ${job.status}`,
      });
    }

    if (!job.filePath) {
      return reply.status(404).send({
        error: 'Screenshot file not found',
        requestedKey,
        message: 'The screenshot file path is missing',
      });
    }

    if (!existsSync(job.filePath)) {
      return reply.status(404).send({
        error: 'Screenshot file not found',
        requestedKey,
        message: 'The screenshot file may have been deleted',
      });
    }

    const fileStats = await stat(job.filePath);
    const filename = basename(job.filePath);
    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    const mimeType = ext === 'jpeg' || ext === 'jpg' ? 'image/jpeg' : 'image/png';

    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.header('Content-Length', fileStats.size);

    return reply.send(createReadStream(job.filePath));
  });

  // DELETE /api/screenshot/:requestedKey - Cancel or remove a screenshot job
  app.delete('/api/screenshot/:requestedKey', {
    schema: {
      description: 'Cancel or remove a screenshot job',
      tags: ['Screenshot'],
      params: {
        type: 'object',
        properties: {
          requestedKey: { type: 'string' },
        },
        required: ['requestedKey'],
      },
      response: {
        200: {
          description: 'Job cancelled/removed',
          type: 'object',
          properties: {
            message: { type: 'string' },
            requestedKey: { type: 'string' },
          },
        },
        404: {
          description: 'Job not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Params: { requestedKey: string } }>, reply: FastifyReply) => {
    const { requestedKey } = request.params;

    const cancelled = screenshotQueueManager.cancelJob(requestedKey);

    if (!cancelled) {
      const removed = await screenshotQueueManager.removeJob(requestedKey);
      if (!removed) {
        return reply.status(404).send({
          error: `Screenshot job with requestedKey '${requestedKey}' not found or cannot be cancelled`,
        });
      }
    }

    return reply.send({
      message: 'Screenshot job cancelled/removed',
      requestedKey,
    });
  });
}
