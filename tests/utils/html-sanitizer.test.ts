import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock env before importing
vi.mock('../../src/config/env.js', () => ({
  env: {
    sanitizeHtml: true,
  },
}));

import { sanitizeHtml } from '../../src/utils/html-sanitizer.js';
import { env } from '../../src/config/env.js';

describe('HTML Sanitizer', () => {
  beforeEach(() => {
    (env as { sanitizeHtml: boolean }).sanitizeHtml = true;
  });

  describe('when sanitization is enabled', () => {
    it('should remove script tags', () => {
      const html = '<div>Hello</div><script>alert("xss")</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<div>Hello</div>');
    });

    it('should remove iframe tags', () => {
      const html = '<div>Content</div><iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('<div>Content</div>');
    });

    it('should remove object tags', () => {
      const html = '<object data="malware.swf"></object><p>Safe</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<object');
      expect(result).toContain('<p>Safe</p>');
    });

    it('should remove embed tags', () => {
      const html = '<embed src="malware.swf"><p>Safe</p>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<embed');
    });

    it('should remove form tags', () => {
      const html = '<form action="evil.com"><input></form><div>Safe</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<form');
      expect(result).toContain('<div>Safe</div>');
    });

    it('should remove onerror attribute', () => {
      const html = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onerror');
    });

    it('should remove onclick attribute', () => {
      const html = '<button onclick="evil()">Click</button>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click');
    });

    it('should remove onload attribute', () => {
      const html = '<body onload="malicious()"><p>Content</p></body>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onload');
    });

    it('should remove onmouseover attribute', () => {
      const html = '<div onmouseover="steal()">Hover me</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('Hover me');
    });

    it('should preserve safe HTML elements', () => {
      const html = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
        <ul><li>Item 1</li><li>Item 2</li></ul>
        <a href="https://example.com">Link</a>
        <img src="image.png" alt="Image">
      `;
      const result = sanitizeHtml(html);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<li>Item 1</li>');
      expect(result).toContain('href="https://example.com"');
    });

    it('should preserve CSS styles', () => {
      const html = '<div style="color: red; font-size: 16px;">Styled</div>';
      const result = sanitizeHtml(html);
      expect(result).toContain('style=');
      expect(result).toContain('Styled');
    });

    it('should preserve class attributes', () => {
      const html = '<div class="container main">Content</div>';
      const result = sanitizeHtml(html);
      expect(result).toContain('class="container main"');
    });

    it('should handle nested malicious content', () => {
      const html = '<div><p><script>evil()</script>Safe text</p></div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe text');
    });
  });

  describe('when sanitization is disabled', () => {
    it('should return HTML unchanged', () => {
      (env as { sanitizeHtml: boolean }).sanitizeHtml = false;
      const html = '<script>alert("xss")</script><div>Content</div>';
      const result = sanitizeHtml(html);
      expect(result).toBe(html);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle plain text', () => {
      const result = sanitizeHtml('Just plain text');
      expect(result).toBe('Just plain text');
    });

    it('should handle malformed HTML', () => {
      const html = '<div><p>Unclosed tags';
      const result = sanitizeHtml(html);
      expect(result).toContain('Unclosed tags');
    });
  });
});
