import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import multipart from '@fastify/multipart';
import { pdfGenerator } from '../services/pdf-generator.js';
import {
  htmlPdfRequestSchema,
  urlPdfRequestSchema,
  HtmlPdfRequest,
  UrlPdfRequest,
} from '../schemas/pdf.schema.js';
import { ZodError } from 'zod';

export async function pdfRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1,
    },
  });

  // POST /api/pdf/from-html - Generate PDF from HTML content
  app.post('/api/pdf/from-html', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = htmlPdfRequestSchema.parse(request.body);

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
          details: error.errors,
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
  app.post('/api/pdf/from-url', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = urlPdfRequestSchema.parse(request.body);

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
          details: error.errors,
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
  app.post('/api/pdf/from-file', async (request: FastifyRequest, reply: FastifyReply) => {
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
      if (!requestedKeyField || typeof requestedKeyField !== 'object' || !('value' in requestedKeyField)) {
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
