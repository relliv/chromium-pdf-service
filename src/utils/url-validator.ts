import { env } from '../config/env.js';

// Private IP ranges to block (SSRF protection)
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^::1$/, // IPv6 loopback
  /^fc00:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
];

const BLOCKED_PROTOCOLS = ['file:', 'javascript:', 'data:', 'vbscript:'];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUrl(urlString: string): UrlValidationResult {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Block dangerous protocols
  if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: `Protocol not allowed: ${url.protocol}` };
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, error: `Protocol not allowed: ${url.protocol}` };
  }

  // Block private IPs if enabled
  if (env.blockPrivateIps) {
    const hostname = url.hostname;

    // Check localhost variations
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return { valid: false, error: 'Localhost URLs are not allowed' };
    }

    // Check private IP patterns
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
    }
  }

  // Check domain allowlist if configured
  if (env.allowedUrlDomains.length > 0) {
    const hostname = url.hostname.toLowerCase();
    const isAllowed = env.allowedUrlDomains.some((domain) => {
      const d = domain.toLowerCase();
      return hostname === d || hostname.endsWith('.' + d);
    });

    if (!isAllowed) {
      return { valid: false, error: `Domain not in allowlist: ${url.hostname}` };
    }
  }

  return { valid: true };
}
