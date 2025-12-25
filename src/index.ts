import { buildApp } from './app.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import { settingsManager } from './services/settings-manager.js';

async function start(): Promise<void> {
  // Initialize settings
  await settingsManager.initialize();

  const app = await buildApp();

  try {
    await app.listen({ port: env.port, host: env.host });
    logger.info(`Server is running on http://${env.host}:${env.port}`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await app.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
