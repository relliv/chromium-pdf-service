import { z } from 'zod';

// Browser settings schema
export const browserSettingsSchema = z.object({
  maxConcurrent: z.number().int().min(1).max(10).optional(),
  defaultTimeout: z.number().int().min(1000).max(120000).optional(),
  defaultViewport: z
    .object({
      width: z.number().int().positive().max(7680).optional(),
      height: z.number().int().positive().max(4320).optional(),
    })
    .optional(),
  launchOptions: z
    .object({
      headless: z.boolean().optional(),
      args: z.array(z.string()).optional(),
    })
    .optional(),
});

// PDF settings schema
export const pdfSettingsSchema = z.object({
  defaultFormat: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5']).optional(),
  defaultMargin: z
    .object({
      top: z.string().max(20).optional(),
      right: z.string().max(20).optional(),
      bottom: z.string().max(20).optional(),
      left: z.string().max(20).optional(),
    })
    .optional(),
  printBackground: z.boolean().optional(),
});

// Queue settings schema
export const queueSettingsSchema = z.object({
  maxSize: z.number().int().min(1).max(1000).optional(),
  processingTimeout: z.number().int().min(5000).max(300000).optional(),
  retryAttempts: z.number().int().min(0).max(5).optional(),
  retryDelay: z.number().int().min(100).max(30000).optional(),
});

// Storage settings schema
export const storageSettingsSchema = z.object({
  outputDir: z.string().min(1).max(255).optional(),
  cleanupAfterHours: z.number().int().min(1).max(720).optional(), // Max 30 days
});

// Full settings update schema
export const settingsUpdateSchema = z.object({
  browser: browserSettingsSchema.optional(),
  pdf: pdfSettingsSchema.optional(),
  queue: queueSettingsSchema.optional(),
  storage: storageSettingsSchema.optional(),
});

// Type exports
export type BrowserSettings = z.infer<typeof browserSettingsSchema>;
export type PdfSettings = z.infer<typeof pdfSettingsSchema>;
export type QueueSettings = z.infer<typeof queueSettingsSchema>;
export type StorageSettings = z.infer<typeof storageSettingsSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
