import pino from 'pino';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { env, isDevelopment } from '../config/env.js';

/**
 * Get the log file path for the current date
 * Format: dd-mm-yyyy.json
 */
function getLogFilePath(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const filename = `${day}-${month}-${year}.json`;
  return join(env.logsDir, filename);
}

/**
 * Ensure the logs directory exists
 */
function ensureLogsDir(): void {
  if (!existsSync(env.logsDir)) {
    mkdirSync(env.logsDir, { recursive: true });
  }
}

// Ensure logs directory exists
ensureLogsDir();

// Create file stream for logging
const logFilePath = getLogFilePath();
const fileStream = createWriteStream(logFilePath, { flags: 'a' });

// Create multistream for logging to both stdout and file
const streams: pino.StreamEntry[] = [
  // File stream (always JSON)
  { stream: fileStream },
];

// Add stdout stream
if (isDevelopment) {
  // In development, use pino-pretty for console output
  streams.push({
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }),
  });
} else {
  // In production, use standard JSON output to stdout
  streams.push({ stream: process.stdout });
}

export const logger = pino(
  {
    level: env.logLevel,
    base: {
      service: 'chromium-pdf-service',
    },
  },
  pino.multistream(streams)
);

export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return logger.child(context);
}

/**
 * Rotate to a new log file (call this at midnight or when needed)
 */
export function rotateLogFile(): void {
  ensureLogsDir();
  const newLogFilePath = getLogFilePath();

  // Only rotate if it's a new day
  if (newLogFilePath !== logFilePath) {
    fileStream.end();
    const newFileStream = createWriteStream(newLogFilePath, { flags: 'a' });
    streams[0] = { stream: newFileStream };
  }
}
