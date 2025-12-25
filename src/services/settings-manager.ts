import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Settings } from '../types/index.js';
import { defaultSettings } from '../config/default-settings.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

class SettingsManager {
  private settings: Settings;
  private readonly settingsPath: string;

  constructor() {
    this.settings = { ...defaultSettings };
    this.settingsPath = env.settingsPath;
  }

  async initialize(): Promise<void> {
    try {
      await this.load();
      logger.info('Settings loaded successfully');
    } catch (error) {
      logger.warn('No existing settings found, using defaults');
      await this.save();
    }
  }

  async load(): Promise<Settings> {
    const content = await readFile(this.settingsPath, 'utf-8');
    const loadedSettings = JSON.parse(content) as Partial<Settings>;

    // Merge with defaults to ensure all properties exist
    this.settings = this.mergeWithDefaults(loadedSettings);
    return this.settings;
  }

  async save(): Promise<void> {
    const dir = dirname(this.settingsPath);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(
      this.settingsPath,
      JSON.stringify(this.settings, null, 2),
      'utf-8'
    );
    logger.info('Settings saved successfully');
  }

  get(): Settings {
    return { ...this.settings };
  }

  async update(newSettings: Partial<Settings>): Promise<Settings> {
    this.settings = this.mergeWithDefaults({
      ...this.settings,
      ...newSettings,
      browser: {
        ...this.settings.browser,
        ...newSettings.browser,
        defaultViewport: {
          ...this.settings.browser.defaultViewport,
          ...newSettings.browser?.defaultViewport,
        },
        launchOptions: {
          ...this.settings.browser.launchOptions,
          ...newSettings.browser?.launchOptions,
        },
      },
      pdf: {
        ...this.settings.pdf,
        ...newSettings.pdf,
        defaultMargin: {
          ...this.settings.pdf.defaultMargin,
          ...newSettings.pdf?.defaultMargin,
        },
      },
      queue: {
        ...this.settings.queue,
        ...newSettings.queue,
      },
      storage: {
        ...this.settings.storage,
        ...newSettings.storage,
      },
    });

    await this.save();
    return this.settings;
  }

  async reset(): Promise<Settings> {
    this.settings = { ...defaultSettings };
    await this.save();
    logger.info('Settings reset to defaults');
    return this.settings;
  }

  private mergeWithDefaults(partial: Partial<Settings>): Settings {
    return {
      browser: {
        maxConcurrent: partial.browser?.maxConcurrent ?? defaultSettings.browser.maxConcurrent,
        defaultTimeout: partial.browser?.defaultTimeout ?? defaultSettings.browser.defaultTimeout,
        defaultViewport: {
          width: partial.browser?.defaultViewport?.width ?? defaultSettings.browser.defaultViewport.width,
          height: partial.browser?.defaultViewport?.height ?? defaultSettings.browser.defaultViewport.height,
        },
        launchOptions: {
          headless: partial.browser?.launchOptions?.headless ?? defaultSettings.browser.launchOptions.headless,
          args: partial.browser?.launchOptions?.args ?? defaultSettings.browser.launchOptions.args,
        },
      },
      pdf: {
        defaultFormat: partial.pdf?.defaultFormat ?? defaultSettings.pdf.defaultFormat,
        defaultMargin: {
          top: partial.pdf?.defaultMargin?.top ?? defaultSettings.pdf.defaultMargin.top,
          right: partial.pdf?.defaultMargin?.right ?? defaultSettings.pdf.defaultMargin.right,
          bottom: partial.pdf?.defaultMargin?.bottom ?? defaultSettings.pdf.defaultMargin.bottom,
          left: partial.pdf?.defaultMargin?.left ?? defaultSettings.pdf.defaultMargin.left,
        },
        printBackground: partial.pdf?.printBackground ?? defaultSettings.pdf.printBackground,
      },
      queue: {
        maxSize: partial.queue?.maxSize ?? defaultSettings.queue.maxSize,
        processingTimeout: partial.queue?.processingTimeout ?? defaultSettings.queue.processingTimeout,
        retryAttempts: partial.queue?.retryAttempts ?? defaultSettings.queue.retryAttempts,
        retryDelay: partial.queue?.retryDelay ?? defaultSettings.queue.retryDelay,
      },
      storage: {
        outputDir: partial.storage?.outputDir ?? defaultSettings.storage.outputDir,
        cleanupAfterHours: partial.storage?.cleanupAfterHours ?? defaultSettings.storage.cleanupAfterHours,
      },
    };
  }
}

export const settingsManager = new SettingsManager();
