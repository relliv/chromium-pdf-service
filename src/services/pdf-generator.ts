import { chromium, Browser } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PdfJob, BrowserOptions, PdfOptions } from '../types/index.js';
import { settingsManager } from './settings-manager.js';
import { queueManager, QueuedJob } from './queue-manager.js';
import { generatePdfFilename } from '../utils/filename.js';
import { logger } from '../utils/logger.js';

class PdfGenerator {
  private browser: Browser | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Listen for queue process events
    queueManager.on('process', (job: QueuedJob) => {
      this.processJob(job).catch((err) => {
        logger.error({ error: err, requestedKey: job.requestedKey }, 'Failed to process job');
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
    logger.info('Launching browser...');

    this.browser = await chromium.launch({
      headless: settings.browser.launchOptions.headless,
      args: settings.browser.launchOptions.args,
    });

    logger.info('Browser launched successfully');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      await this.initialize();
    }
    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }
    return this.browser;
  }

  private async processJob(job: QueuedJob): Promise<void> {
    const settings = settingsManager.get();

    // Check if job was cancelled
    if (job.status === 'cancelled') {
      return;
    }

    queueManager.markAsProcessing(job.requestedKey);

    const timeoutMs = settings.queue.processingTimeout;
    let attempts = 0;
    const maxAttempts = settings.queue.retryAttempts + 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        // Check again if cancelled
        const currentJob = queueManager.getJob(job.requestedKey);
        if (currentJob?.status === 'cancelled') {
          return;
        }

        const result = await this.generatePdfWithTimeout(job, timeoutMs);

        queueManager.updateJobStatus(job.requestedKey, 'completed', {
          filePath: result,
        });

        // Trigger next job processing
        queueManager.triggerProcessing();
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (attempts < maxAttempts) {
          logger.warn(
            { requestedKey: job.requestedKey, attempt: attempts, error: errorMessage },
            'Job failed, retrying...'
          );
          await this.delay(settings.queue.retryDelay);
        } else {
          queueManager.updateJobStatus(job.requestedKey, 'failed', {
            error: errorMessage,
          });
        }
      }
    }

    // Trigger next job processing
    queueManager.triggerProcessing();
  }

  private async generatePdfWithTimeout(job: PdfJob, timeoutMs: number): Promise<string> {
    return Promise.race([
      this.generatePdf(job),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF generation timed out')), timeoutMs);
      }),
    ]);
  }

  private async generatePdf(job: PdfJob): Promise<string> {
    const browser = await this.ensureBrowser();
    const settings = settingsManager.get();

    // Merge options with defaults
    const browserOptions: BrowserOptions = {
      timeout: job.options.browser.timeout ?? settings.browser.defaultTimeout,
      viewport: {
        width: job.options.browser.viewport?.width ?? settings.browser.defaultViewport.width,
        height: job.options.browser.viewport?.height ?? settings.browser.defaultViewport.height,
      },
      userAgent: job.options.browser.userAgent,
      extraHTTPHeaders: job.options.browser.extraHTTPHeaders,
    };

    // If width/height are provided, don't use format (custom dimensions take precedence)
    const hasCustomDimensions = job.options.pdf.width || job.options.pdf.height;

    const pdfOptions: PdfOptions = {
      format: hasCustomDimensions
        ? undefined
        : (job.options.pdf.format ?? (settings.pdf.defaultFormat as PdfOptions['format'])),
      width: job.options.pdf.width,
      height: job.options.pdf.height,
      landscape: job.options.pdf.landscape,
      margin: {
        top: job.options.pdf.margin?.top ?? settings.pdf.defaultMargin.top,
        right: job.options.pdf.margin?.right ?? settings.pdf.defaultMargin.right,
        bottom: job.options.pdf.margin?.bottom ?? settings.pdf.defaultMargin.bottom,
        left: job.options.pdf.margin?.left ?? settings.pdf.defaultMargin.left,
      },
      printBackground: job.options.pdf.printBackground ?? settings.pdf.printBackground,
      scale: job.options.pdf.scale,
      headerTemplate: job.options.pdf.headerTemplate,
      footerTemplate: job.options.pdf.footerTemplate,
      displayHeaderFooter: job.options.pdf.displayHeaderFooter,
    };

    const context = await browser.newContext({
      viewport: browserOptions.viewport,
      userAgent: browserOptions.userAgent,
      extraHTTPHeaders: browserOptions.extraHTTPHeaders,
    });

    const page = await context.newPage();
    page.setDefaultTimeout(browserOptions.timeout ?? 30000);

    try {
      queueManager.updateJobProgress(job.requestedKey, 10);

      // Load content based on job type
      if (job.type === 'html') {
        await page.setContent(job.source, { waitUntil: 'networkidle' });
      } else if (job.type === 'url') {
        await page.goto(job.source, { waitUntil: 'networkidle' });
      } else if (job.type === 'file') {
        // For file type, source contains the HTML content read from file
        await page.setContent(job.source, { waitUntil: 'networkidle' });
      }

      queueManager.updateJobProgress(job.requestedKey, 50);

      // Check if cancelled mid-process
      const currentJob = queueManager.getJob(job.requestedKey);
      if (currentJob?.status === 'cancelled') {
        throw new Error('Job was cancelled');
      }

      // Ensure output directory exists
      const outputDir = settings.storage.outputDir;
      if (!existsSync(outputDir)) {
        await mkdir(outputDir, { recursive: true });
      }

      // Generate filename and path
      const filename = generatePdfFilename(job.requestedKey);
      const filePath = join(outputDir, filename);

      queueManager.updateJobProgress(job.requestedKey, 70);

      // Generate PDF
      await page.pdf({
        path: filePath,
        format: pdfOptions.format,
        width: pdfOptions.width,
        height: pdfOptions.height,
        landscape: pdfOptions.landscape,
        margin: pdfOptions.margin,
        printBackground: pdfOptions.printBackground,
        scale: pdfOptions.scale,
        displayHeaderFooter: pdfOptions.displayHeaderFooter,
        headerTemplate: pdfOptions.headerTemplate,
        footerTemplate: pdfOptions.footerTemplate,
      });

      queueManager.updateJobProgress(job.requestedKey, 100);

      logger.info({ requestedKey: job.requestedKey, filePath }, 'PDF generated successfully');

      return filePath;
    } finally {
      await page.close();
      await context.close();
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
      pdf?: Partial<PdfOptions>;
      priority?: number;
    }
  ): Promise<PdfJob> {
    return queueManager.addJob({
      requestedKey,
      type: 'html',
      source: html,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        pdf: options?.pdf ?? {},
      },
    });
  }

  async generateFromUrl(
    requestedKey: string,
    url: string,
    options?: {
      browser?: Partial<BrowserOptions>;
      pdf?: Partial<PdfOptions>;
      priority?: number;
    }
  ): Promise<PdfJob> {
    return queueManager.addJob({
      requestedKey,
      type: 'url',
      source: url,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        pdf: options?.pdf ?? {},
      },
    });
  }

  async generateFromFile(
    requestedKey: string,
    htmlContent: string,
    options?: {
      browser?: Partial<BrowserOptions>;
      pdf?: Partial<PdfOptions>;
      priority?: number;
    }
  ): Promise<PdfJob> {
    return queueManager.addJob({
      requestedKey,
      type: 'file',
      source: htmlContent,
      priority: options?.priority ?? 5,
      options: {
        browser: options?.browser ?? {},
        pdf: options?.pdf ?? {},
      },
    });
  }
}

export const pdfGenerator = new PdfGenerator();
