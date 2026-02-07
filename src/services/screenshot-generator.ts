import { chromium, Browser } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ScreenshotJob, BrowserOptions, ScreenshotOptions } from '../types/index.js';
import { settingsManager } from './settings-manager.js';
import { screenshotQueueManager, QueuedScreenshotJob } from './screenshot-queue-manager.js';
import { generateScreenshotFilename, generateDateFolder } from '../utils/filename.js';
import { logger } from '../utils/logger.js';
import { validateUrl } from '../utils/url-validator.js';
import { sanitizeHtml } from '../utils/html-sanitizer.js';

class ScreenshotGenerator {
  private browser: Browser | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    screenshotQueueManager.on('process', (job: QueuedScreenshotJob) => {
      this.processJob(job).catch((err) => {
        logger.error(
          { error: err, requestedKey: job.requestedKey },
          'Failed to process screenshot job'
        );
      });
    });
  }

  async initialize(): Promise<void> {
    if (this.browser) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.launchBrowser();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async launchBrowser(): Promise<void> {
    const settings = settingsManager.get();
    logger.info('Launching browser for screenshots...');

    this.browser = await chromium.launch({
      headless: settings.browser.launchOptions.headless,
      args: settings.browser.launchOptions.args,
    });

    logger.info('Browser launched successfully for screenshots');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Screenshot browser closed');
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      await this.initialize();
    }
    if (!this.browser) {
      throw new Error('Failed to initialize browser for screenshots');
    }
    return this.browser;
  }

  private async processJob(job: QueuedScreenshotJob): Promise<void> {
    const settings = settingsManager.get();

    if (job.status === 'cancelled') {
      return;
    }

    screenshotQueueManager.markAsProcessing(job.requestedKey);

    const timeoutMs = settings.queue.processingTimeout;
    let attempts = 0;
    const maxAttempts = settings.queue.retryAttempts + 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const currentJob = screenshotQueueManager.getJob(job.requestedKey);
        if (currentJob?.status === 'cancelled') {
          return;
        }

        const result = await this.generateScreenshotWithTimeout(job, timeoutMs);

        screenshotQueueManager.updateJobStatus(job.requestedKey, 'completed', {
          filePath: result,
        });

        screenshotQueueManager.triggerProcessing();
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (attempts < maxAttempts) {
          logger.warn(
            { requestedKey: job.requestedKey, attempt: attempts, error: errorMessage },
            'Screenshot job failed, retrying...'
          );
          await this.delay(settings.queue.retryDelay);
        } else {
          screenshotQueueManager.updateJobStatus(job.requestedKey, 'failed', {
            error: errorMessage,
          });
        }
      }
    }

    screenshotQueueManager.triggerProcessing();
  }

  private async generateScreenshotWithTimeout(
    job: ScreenshotJob,
    timeoutMs: number
  ): Promise<string> {
    return Promise.race([
      this.generateScreenshot(job),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Screenshot generation timed out')), timeoutMs);
      }),
    ]);
  }

  private async generateScreenshot(job: ScreenshotJob): Promise<string> {
    const settings = settingsManager.get();

    const browserOptions: BrowserOptions = {
      timeout: job.options.browser.timeout ?? settings.browser.defaultTimeout,
      viewport: {
        width: job.options.browser.viewport?.width ?? settings.browser.defaultViewport.width,
        height: job.options.browser.viewport?.height ?? settings.browser.defaultViewport.height,
      },
      userAgent: job.options.browser.userAgent,
      extraHTTPHeaders: job.options.browser.extraHTTPHeaders,
      waitForSelector: job.options.browser.waitForSelector,
      waitAfter: job.options.browser.waitAfter,
      disableAnimations: job.options.browser.disableAnimations,
      colorScheme: job.options.browser.colorScheme,
      launchOptions: job.options.browser.launchOptions,
    };

    // Use a dedicated browser instance if custom launch options are provided
    const useCustomBrowser = !!browserOptions.launchOptions;
    const browser = useCustomBrowser
      ? await chromium.launch({
          headless: browserOptions.launchOptions?.headless ?? settings.browser.launchOptions.headless,
          args: browserOptions.launchOptions?.args ?? settings.browser.launchOptions.args,
        })
      : await this.ensureBrowser();

    const screenshotOptions: ScreenshotOptions = {
      type: job.options.screenshot.type ?? 'png',
      quality: job.options.screenshot.quality,
      fullPage: job.options.screenshot.fullPage ?? true,
      clip: job.options.screenshot.clip,
      omitBackground: job.options.screenshot.omitBackground,
      scale: job.options.screenshot.scale,
    };

    const context = await browser.newContext({
      viewport: browserOptions.viewport,
      userAgent: browserOptions.userAgent,
      extraHTTPHeaders: browserOptions.extraHTTPHeaders,
      reducedMotion: browserOptions.disableAnimations ? 'reduce' : undefined,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(browserOptions.timeout ?? 30000);

    // Emulate color scheme if specified
    if (browserOptions.colorScheme) {
      await page.emulateMedia({ colorScheme: browserOptions.colorScheme });
    }

    try {
      screenshotQueueManager.updateJobProgress(job.requestedKey, 10);

      if (job.type === 'html') {
        await page.setContent(job.source, { waitUntil: 'networkidle' });
      } else if (job.type === 'url') {
        await page.goto(job.source, { waitUntil: 'networkidle' });
      } else if (job.type === 'file') {
        await page.setContent(job.source, { waitUntil: 'networkidle' });
      }

      if (browserOptions.disableAnimations) {
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation: none !important;
              animation-duration: 0s !important;
              animation-delay: 0s !important;
              transition: none !important;
              transition-duration: 0s !important;
              transition-delay: 0s !important;
            }
          `,
        });
        await this.delay(50);
      }

      screenshotQueueManager.updateJobProgress(job.requestedKey, 40);

      if (browserOptions.waitForSelector) {
        logger.info(
          { requestedKey: job.requestedKey, selector: browserOptions.waitForSelector },
          'Waiting for selector'
        );
        await page.waitForSelector(browserOptions.waitForSelector, {
          state: 'visible',
          timeout: browserOptions.timeout ?? 30000,
        });
      }

      screenshotQueueManager.updateJobProgress(job.requestedKey, 50);

      if (browserOptions.waitAfter && browserOptions.waitAfter > 0) {
        logger.info(
          { requestedKey: job.requestedKey, waitAfter: browserOptions.waitAfter },
          'Waiting additional time'
        );
        await this.delay(browserOptions.waitAfter);
      }

      screenshotQueueManager.updateJobProgress(job.requestedKey, 60);

      const currentJob = screenshotQueueManager.getJob(job.requestedKey);
      if (currentJob?.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }

      const now = new Date();
      const dateFolder = generateDateFolder(now);
      const outputDir = join(settings.storage.outputDir, dateFolder);
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      const format = screenshotOptions.type ?? 'png';
      const filename = generateScreenshotFilename(job.requestedKey, format, now);
      const filePath = join(outputDir, filename);

      screenshotQueueManager.updateJobProgress(job.requestedKey, 70);

      // Build screenshot options for Playwright
      const playwrightOptions: {
        path: string;
        type: 'png' | 'jpeg';
        quality?: number;
        fullPage?: boolean;
        clip?: { x: number; y: number; width: number; height: number };
        omitBackground?: boolean;
        scale?: 'css' | 'device';
      } = {
        path: filePath,
        type: format,
      };

      if (format === 'jpeg' && screenshotOptions.quality !== undefined) {
        playwrightOptions.quality = screenshotOptions.quality;
      }

      if (screenshotOptions.clip) {
        playwrightOptions.clip = screenshotOptions.clip;
      } else if (screenshotOptions.fullPage !== false) {
        playwrightOptions.fullPage = true;
      }

      if (screenshotOptions.omitBackground !== undefined) {
        playwrightOptions.omitBackground = screenshotOptions.omitBackground;
      }

      if (screenshotOptions.scale) {
        playwrightOptions.scale = screenshotOptions.scale;
      }

      await page.screenshot(playwrightOptions);

      screenshotQueueManager.updateJobProgress(job.requestedKey, 100);

      logger.info(
        { requestedKey: job.requestedKey, filePath },
        'Screenshot generated successfully'
      );

      return filePath;
    } finally {
      await page.close();
      await context.close();
      // Close the custom browser if one was created for this job
      if (useCustomBrowser && browser) {
        await browser.close();
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generateFromHtml(
    requestedKey: string,
    html: string,
    options?: {
      browser?: Partial<BrowserOptions>;
      screenshot?: Partial<ScreenshotOptions>;
      priority?: number;
    }
  ): Promise<ScreenshotJob> {
    const sanitizedHtml = sanitizeHtml(html);

    return screenshotQueueManager.addJob({
      requestedKey,
      type: 'html',
      source: sanitizedHtml,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        screenshot: options?.screenshot ?? {},
      },
    });
  }

  async generateFromUrl(
    requestedKey: string,
    url: string,
    options?: {
      browser?: Partial<BrowserOptions>;
      screenshot?: Partial<ScreenshotOptions>;
      priority?: number;
    }
  ): Promise<ScreenshotJob> {
    const validation = validateUrl(url);
    if (!validation.valid) {
      throw new Error(`URL validation failed: ${validation.error}`);
    }

    return screenshotQueueManager.addJob({
      requestedKey,
      type: 'url',
      source: url,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        screenshot: options?.screenshot ?? {},
      },
    });
  }

  async generateFromFile(
    requestedKey: string,
    htmlContent: string,
    options?: {
      browser?: Partial<BrowserOptions>;
      screenshot?: Partial<ScreenshotOptions>;
      priority?: number;
    }
  ): Promise<ScreenshotJob> {
    const sanitizedHtml = sanitizeHtml(htmlContent);

    return screenshotQueueManager.addJob({
      requestedKey,
      type: 'file',
      source: sanitizedHtml,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        screenshot: options?.screenshot ?? {},
      },
    });
  }
}

export const screenshotGenerator = new ScreenshotGenerator();
