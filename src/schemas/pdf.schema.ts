import { z } from 'zod';

// Browser options schema
export const browserOptionsSchema = z.object({
  timeout: z.number().int().positive().max(120000).optional(),
  viewport: z
    .object({
      width: z.number().int().positive().max(7680),
      height: z.number().int().positive().max(4320),
    })
    .optional(),
  userAgent: z.string().max(500).optional(),
  extraHTTPHeaders: z.record(z.string(), z.string()).optional(),
  waitForSelector: z.string().min(1).max(500).optional(), // CSS selector to wait for
  waitAfter: z.number().int().min(0).max(60000).optional(), // Wait time in ms (max 60s)
  disableAnimations: z.boolean().optional(), // Disable all CSS animations and transitions
  colorScheme: z.enum(['light', 'dark', 'no-preference']).optional(), // Emulate prefers-color-scheme
  launchOptions: z
    .object({
      headless: z.boolean().optional(),
      args: z.array(z.string().max(500)).max(50).optional(), // Max 50 args, each max 500 chars
    })
    .optional(),
});

// PDF dimension value (can be number in pixels or string with unit)
const pdfDimensionSchema = z.union([
  z.number().int().positive().max(10000),
  z.string().max(20).regex(/^\d+(\.\d+)?(px|in|cm|mm)?$/, 'Invalid dimension format'),
]);

// PDF options schema
export const pdfOptionsSchema = z
  .object({
    format: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5']).optional(),
    width: pdfDimensionSchema.optional(),
    height: pdfDimensionSchema.optional(),
    landscape: z.boolean().optional(),
    margin: z
      .object({
        top: z.string().max(20).optional(),
        right: z.string().max(20).optional(),
        bottom: z.string().max(20).optional(),
        left: z.string().max(20).optional(),
      })
      .optional(),
    printBackground: z.boolean().optional(),
    scale: z.number().positive().max(2).optional(),
    headerTemplate: z.string().max(10000).optional(),
    footerTemplate: z.string().max(10000).optional(),
    displayHeaderFooter: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If width or height is provided, format should not be used
      if ((data.width || data.height) && data.format) {
        return false;
      }
      return true;
    },
    { message: 'Cannot use both format and width/height. Use either format OR width/height.' }
  );

// Queue options schema
export const queueOptionsSchema = z.object({
  priority: z.number().int().min(1).max(10).optional(),
});

// Combined options schema
export const requestOptionsSchema = z.object({
  browser: browserOptionsSchema.optional(),
  pdf: pdfOptionsSchema.optional(),
  queue: queueOptionsSchema.optional(),
});

// Base PDF request schema
const basePdfRequestSchema = z.object({
  requestedKey: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, 'requestedKey must be alphanumeric with dashes and underscores'),
  options: requestOptionsSchema.optional(),
  reCreate: z.boolean().optional(), // Force recreate PDF even if one already exists
});

// HTML PDF request schema
export const htmlPdfRequestSchema = basePdfRequestSchema.extend({
  html: z.string().min(1).max(10_000_000), // Max 10MB HTML
});

// URL PDF request schema
export const urlPdfRequestSchema = basePdfRequestSchema.extend({
  url: z.string().url().max(2048),
});

// File PDF request schema (requestedKey only, file comes as multipart)
export const filePdfRequestSchema = basePdfRequestSchema;

// Status request params schema
export const statusParamsSchema = z.object({
  requestedKey: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, 'requestedKey must be alphanumeric with dashes and underscores'),
});

// Type exports
export type BrowserOptions = z.infer<typeof browserOptionsSchema>;
export type PdfOptions = z.infer<typeof pdfOptionsSchema>;
export type QueueOptions = z.infer<typeof queueOptionsSchema>;
export type RequestOptions = z.infer<typeof requestOptionsSchema>;
export type HtmlPdfRequest = z.infer<typeof htmlPdfRequestSchema>;
export type UrlPdfRequest = z.infer<typeof urlPdfRequestSchema>;
export type FilePdfRequest = z.infer<typeof filePdfRequestSchema>;
export type StatusParams = z.infer<typeof statusParamsSchema>;
