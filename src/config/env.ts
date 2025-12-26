export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  settingsPath: process.env.SETTINGS_PATH ?? 'data/settings.json',
  outputDir: process.env.OUTPUT_DIR ?? 'pdf-files',
  logsDir: process.env.LOGS_DIR ?? 'logs',
  // Rate limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW ?? '60000', 10), // 1 minute
  // Authentication
  apiKeys: process.env.API_KEYS ? process.env.API_KEYS.split(',').map((k) => k.trim()) : [],
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [],
  // URL Security
  allowedUrlDomains: process.env.ALLOWED_URL_DOMAINS
    ? process.env.ALLOWED_URL_DOMAINS.split(',').map((d) => d.trim())
    : [],
  blockPrivateIps: process.env.BLOCK_PRIVATE_IPS !== 'false',
} as const;

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
