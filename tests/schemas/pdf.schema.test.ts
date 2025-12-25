import { describe, it, expect } from 'vitest';
import {
  htmlPdfRequestSchema,
  urlPdfRequestSchema,
  statusParamsSchema,
  browserOptionsSchema,
  pdfOptionsSchema,
} from '../../src/schemas/pdf.schema.js';

describe('PDF Schemas', () => {
  describe('htmlPdfRequestSchema', () => {
    it('should validate a valid HTML request', () => {
      const validRequest = {
        requestedKey: 'test-key-123',
        html: '<html><body>Hello</body></html>',
      };

      const result = htmlPdfRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate request with all options', () => {
      const fullRequest = {
        requestedKey: 'invoice-001',
        html: '<html><body>Invoice</body></html>',
        options: {
          browser: {
            timeout: 30000,
            viewport: { width: 1920, height: 1080 },
          },
          pdf: {
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm' },
          },
          queue: {
            priority: 5,
          },
        },
      };

      const result = htmlPdfRequestSchema.safeParse(fullRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty requestedKey', () => {
      const invalidRequest = {
        requestedKey: '',
        html: '<html></html>',
      };

      const result = htmlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject requestedKey with invalid characters', () => {
      const invalidRequest = {
        requestedKey: 'test key with spaces',
        html: '<html></html>',
      };

      const result = htmlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept requestedKey with dashes and underscores', () => {
      const validRequest = {
        requestedKey: 'test-key_123',
        html: '<html></html>',
      };

      const result = htmlPdfRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty html', () => {
      const invalidRequest = {
        requestedKey: 'test-key',
        html: '',
      };

      const result = htmlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject missing html field', () => {
      const invalidRequest = {
        requestedKey: 'test-key',
      };

      const result = htmlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('urlPdfRequestSchema', () => {
    it('should validate a valid URL request', () => {
      const validRequest = {
        requestedKey: 'website-123',
        url: 'https://example.com',
      };

      const result = urlPdfRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidRequest = {
        requestedKey: 'test',
        url: 'not-a-valid-url',
      };

      const result = urlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject URL without protocol', () => {
      const invalidRequest = {
        requestedKey: 'test',
        url: 'example.com',
      };

      const result = urlPdfRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept URL with path and query params', () => {
      const validRequest = {
        requestedKey: 'test',
        url: 'https://example.com/page?param=value&other=123',
      };

      const result = urlPdfRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('statusParamsSchema', () => {
    it('should validate valid requestedKey', () => {
      const result = statusParamsSchema.safeParse({ requestedKey: 'valid-key-123' });
      expect(result.success).toBe(true);
    });

    it('should reject empty requestedKey', () => {
      const result = statusParamsSchema.safeParse({ requestedKey: '' });
      expect(result.success).toBe(false);
    });

    it('should reject special characters', () => {
      const result = statusParamsSchema.safeParse({ requestedKey: 'key@#$%' });
      expect(result.success).toBe(false);
    });
  });

  describe('browserOptionsSchema', () => {
    it('should validate valid browser options', () => {
      const options = {
        timeout: 30000,
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Custom User Agent',
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should reject negative timeout', () => {
      const options = {
        timeout: -1000,
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should reject timeout exceeding max', () => {
      const options = {
        timeout: 200000, // exceeds 120000 max
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should reject viewport exceeding max dimensions', () => {
      const options = {
        viewport: { width: 10000, height: 10000 },
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should accept empty object', () => {
      const result = browserOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept waitForSelector option', () => {
      const options = {
        waitForSelector: '#content-loaded',
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should accept waitAfter option', () => {
      const options = {
        waitAfter: 2000,
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should accept both waitForSelector and waitAfter', () => {
      const options = {
        waitForSelector: '.chart-container',
        waitAfter: 3000,
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should reject waitAfter exceeding max (60000)', () => {
      const options = {
        waitAfter: 70000,
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should reject empty waitForSelector', () => {
      const options = {
        waitForSelector: '',
      };

      const result = browserOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });
  });

  describe('pdfOptionsSchema', () => {
    it('should validate valid PDF options', () => {
      const options = {
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should reject invalid format', () => {
      const options = {
        format: 'InvalidFormat',
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should accept all valid formats', () => {
      const formats = ['A4', 'Letter', 'Legal', 'A3', 'A5'];

      for (const format of formats) {
        const result = pdfOptionsSchema.safeParse({ format });
        expect(result.success).toBe(true);
      }
    });

    it('should reject scale exceeding max', () => {
      const options = {
        scale: 3, // exceeds max of 2
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
    });

    it('should accept scale within range', () => {
      const options = {
        scale: 1.5,
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should accept width and height as numbers', () => {
      const options = {
        width: 400,
        height: 1000,
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should accept width and height as strings with units', () => {
      const options = {
        width: '400px',
        height: '25cm',
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it('should accept various dimension formats', () => {
      const validDimensions = ['100', '100px', '10in', '25.4cm', '254mm'];

      for (const dim of validDimensions) {
        const result = pdfOptionsSchema.safeParse({ width: dim });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid dimension formats', () => {
      const invalidDimensions = ['abc', '100em', '100%', 'px100'];

      for (const dim of invalidDimensions) {
        const result = pdfOptionsSchema.safeParse({ width: dim });
        expect(result.success).toBe(false);
      }
    });

    it('should reject using both format and width/height', () => {
      const options = {
        format: 'A4',
        width: 400,
        height: 1000,
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Cannot use both format and width/height');
      }
    });

    it('should allow width/height without format', () => {
      const options = {
        width: 400,
        height: 1000,
        printBackground: true,
        margin: { top: '10mm' },
      };

      const result = pdfOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });
  });
});
