export const env = {
  host: process.env.HOST ?? '0.0.0.0',
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  settingsPath: process.env.SETTINGS_PATH ?? 'data/settings.json',
  outputDir: process.env.OUTPUT_DIR ?? 'pdf-files',
  logsDir: process.env.LOGS_DIR ?? 'logs',
} as const;

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
