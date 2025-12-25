import type { Settings } from '../types/index.js';

export const defaultSettings: Settings = {
  browser: {
    maxConcurrent: 3,
    defaultTimeout: 30000, // 30 seconds
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    launchOptions: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    },
  },
  pdf: {
    defaultFormat: 'A4',
    defaultMargin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    printBackground: true,
  },
  queue: {
    maxSize: 100,
    processingTimeout: 60000, // 60 seconds per job
    retryAttempts: 2,
    retryDelay: 1000, // 1 second
  },
  storage: {
    outputDir: 'pdf-files',
    cleanupAfterHours: 24, // Auto-cleanup after 24 hours
  },
};
