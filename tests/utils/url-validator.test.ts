import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock env before importing
vi.mock('../../src/config/env.js', () => ({
  env: {
    allowedUrlDomains: [],
    blockPrivateIps: true,
  },
}));

import { validateUrl } from '../../src/utils/url-validator.js';
import { env } from '../../src/config/env.js';

describe('URL Validator', () => {
  beforeEach(() => {
    // Reset to defaults
    (env as { allowedUrlDomains: string[]; blockPrivateIps: boolean }).allowedUrlDomains = [];
    (env as { blockPrivateIps: boolean }).blockPrivateIps = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('valid URLs', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept URLs with paths and query params', () => {
      const result = validateUrl('https://example.com/path/to/page?param=value');
      expect(result.valid).toBe(true);
    });

    it('should accept URLs with ports', () => {
      const result = validateUrl('https://example.com:8080/api');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid URL formats', () => {
    it('should reject malformed URLs', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject empty strings', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
    });
  });

  describe('dangerous protocols', () => {
    it('should block file: protocol', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol not allowed');
    });

    it('should block javascript: protocol', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol not allowed');
    });

    it('should block data: protocol', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol not allowed');
    });

    it('should block ftp: protocol', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Protocol not allowed');
    });
  });

  describe('private IP blocking', () => {
    it('should block localhost', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Localhost URLs are not allowed');
    });

    it('should block 127.0.0.1', () => {
      const result = validateUrl('http://127.0.0.1:8080');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Localhost URLs are not allowed');
    });

    it('should block 10.x.x.x range', () => {
      const result = validateUrl('http://10.0.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Private IP addresses are not allowed');
    });

    it('should block 192.168.x.x range', () => {
      const result = validateUrl('http://192.168.1.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Private IP addresses are not allowed');
    });

    it('should block 172.16-31.x.x range', () => {
      const result = validateUrl('http://172.16.0.1');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Private IP addresses are not allowed');
    });

    it('should allow private IPs when blockPrivateIps is false', () => {
      (env as { blockPrivateIps: boolean }).blockPrivateIps = false;
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(true);
    });
  });

  describe('domain allowlist', () => {
    it('should allow any domain when allowlist is empty', () => {
      const result = validateUrl('https://any-domain.com');
      expect(result.valid).toBe(true);
    });

    it('should allow domains in the allowlist', () => {
      (env as { allowedUrlDomains: string[] }).allowedUrlDomains = ['example.com', 'trusted.org'];
      const result = validateUrl('https://example.com/path');
      expect(result.valid).toBe(true);
    });

    it('should allow subdomains of allowed domains', () => {
      (env as { allowedUrlDomains: string[] }).allowedUrlDomains = ['example.com'];
      const result = validateUrl('https://api.example.com');
      expect(result.valid).toBe(true);
    });

    it('should block domains not in the allowlist', () => {
      (env as { allowedUrlDomains: string[] }).allowedUrlDomains = ['example.com'];
      const result = validateUrl('https://malicious.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Domain not in allowlist');
    });

    it('should be case-insensitive for domain matching', () => {
      (env as { allowedUrlDomains: string[] }).allowedUrlDomains = ['Example.COM'];
      const result = validateUrl('https://EXAMPLE.com/path');
      expect(result.valid).toBe(true);
    });
  });
});
