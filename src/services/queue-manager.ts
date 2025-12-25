import { EventEmitter } from 'node:events';
import { unlink, writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { PdfJob, JobStatus } from '../types/index.js';
import { settingsManager } from './settings-manager.js';
import { logger } from '../utils/logger.js';

const QUEUE_FILE_PATH = join(process.cwd(), 'data', 'queue.json');

export interface QueuedJob extends PdfJob {
  resolve?: (value: PdfJob) => void;
  reject?: (error: Error) => void;
}

interface PersistedJob {
  requestedKey: string;
  type: PdfJob['type'];
  source: string;
  priority: number;
  status: JobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  error?: string;
  options: PdfJob['options'];
}

class QueueManager extends EventEmitter {
  private queue: Map<string, QueuedJob> = new Map();
  private processing: Set<string> = new Set();
  private isProcessing = false;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.loadFromFile();
  }

  private async loadFromFile(): Promise<void> {
    try {
      if (!existsSync(QUEUE_FILE_PATH)) {
        return;
      }

      const data = await readFile(QUEUE_FILE_PATH, 'utf-8');
      const jobs: PersistedJob[] = JSON.parse(data);

      for (const job of jobs) {
        // Reset processing jobs to queued (they were interrupted)
        const status = job.status === 'processing' ? 'queued' : job.status;

        const queuedJob: QueuedJob = {
          requestedKey: job.requestedKey,
          type: job.type,
          source: job.source,
          priority: job.priority,
          status,
          progress: status === 'queued' ? 0 : job.progress,
          createdAt: new Date(job.createdAt),
          updatedAt: new Date(job.updatedAt),
          filePath: job.filePath,
          error: job.error,
          options: job.options,
        };

        this.queue.set(job.requestedKey, queuedJob);
      }

      logger.info({ jobCount: jobs.length }, 'Queue loaded from file');

      // Restart processing for queued jobs
      this.processQueue();
    } catch (error) {
      logger.warn({ error }, 'Failed to load queue from file');
    }
  }

  private scheduleSave(): void {
    // Debounce saves to avoid excessive writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile().catch((err) => {
        logger.warn({ error: err }, 'Failed to save queue to file');
      });
    }, 100);
  }

  private async saveToFile(): Promise<void> {
    try {
      const dir = dirname(QUEUE_FILE_PATH);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      const jobs: PersistedJob[] = Array.from(this.queue.values()).map((job) => ({
        requestedKey: job.requestedKey,
        type: job.type,
        source: job.source,
        priority: job.priority,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        filePath: job.filePath,
        error: job.error,
        options: job.options,
      }));

      await writeFile(QUEUE_FILE_PATH, JSON.stringify(jobs, null, 2), 'utf-8');
    } catch (error) {
      logger.error({ error }, 'Failed to save queue to file');
    }
  }

  async addJob(
    job: Omit<PdfJob, 'status' | 'progress' | 'createdAt' | 'updatedAt'>
  ): Promise<PdfJob> {
    const settings = settingsManager.get();

    // Check queue size limit
    if (this.queue.size >= settings.queue.maxSize) {
      throw new Error(`Queue is full. Maximum size: ${settings.queue.maxSize}`);
    }

    // Check if job with same key already exists
    if (this.queue.has(job.requestedKey)) {
      throw new Error(`Job with requestedKey '${job.requestedKey}' already exists`);
    }

    const now = new Date();
    const queuedJob: QueuedJob = {
      ...job,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.queue.set(job.requestedKey, queuedJob);
    logger.info({ requestedKey: job.requestedKey, type: job.type }, 'Job added to queue');

    // Persist queue
    this.scheduleSave();

    // Start processing if not already running
    this.processQueue();

    return queuedJob;
  }

  getJob(requestedKey: string): PdfJob | undefined {
    return this.queue.get(requestedKey);
  }

  getJobStatus(requestedKey: string):
    | {
        requestedKey: string;
        status: JobStatus;
        progress: number;
        createdAt: string;
        updatedAt: string;
        filePath?: string;
        error?: string;
      }
    | undefined {
    const job = this.queue.get(requestedKey);
    if (!job) return undefined;

    return {
      requestedKey: job.requestedKey,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      filePath: job.filePath,
      error: job.error,
    };
  }

  cancelJob(requestedKey: string): boolean {
    const job = this.queue.get(requestedKey);

    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    if (job.status === 'processing') {
      // Mark as cancelled, processor will handle cleanup
      job.status = 'cancelled';
      job.updatedAt = new Date();
      logger.info({ requestedKey }, 'Job cancelled during processing');
      this.scheduleSave();
      return true;
    }

    // Remove from queue if still queued
    job.status = 'cancelled';
    job.updatedAt = new Date();
    logger.info({ requestedKey }, 'Job cancelled while queued');
    this.scheduleSave();
    return true;
  }

  /**
   * Remove a job from the queue entirely and delete the PDF file (for reCreate functionality)
   * Returns true if job was removed, false if job doesn't exist or is processing
   */
  async removeJob(requestedKey: string): Promise<boolean> {
    const job = this.queue.get(requestedKey);

    if (!job) {
      return false;
    }

    // Don't remove if currently processing
    if (job.status === 'processing') {
      return false;
    }

    // Delete the PDF file if it exists
    if (job.filePath && existsSync(job.filePath)) {
      try {
        await unlink(job.filePath);
        logger.info({ requestedKey, filePath: job.filePath }, 'PDF file deleted');
      } catch (error) {
        logger.warn({ requestedKey, filePath: job.filePath, error }, 'Failed to delete PDF file');
      }
    }

    this.queue.delete(requestedKey);
    logger.info({ requestedKey }, 'Job removed from queue');
    this.scheduleSave();
    return true;
  }

  updateJobProgress(requestedKey: string, progress: number): void {
    const job = this.queue.get(requestedKey);
    if (job && job.status === 'processing') {
      job.progress = Math.min(100, Math.max(0, progress));
      job.updatedAt = new Date();
      this.scheduleSave();
    }
  }

  updateJobStatus(
    requestedKey: string,
    status: JobStatus,
    extra?: { filePath?: string; error?: string }
  ): void {
    const job = this.queue.get(requestedKey);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
      if (extra?.filePath) job.filePath = extra.filePath;
      if (extra?.error) job.error = extra.error;

      if (status === 'completed') {
        job.progress = 100;
        this.processing.delete(requestedKey);
        logger.info({ requestedKey, filePath: job.filePath }, 'Job completed');
      } else if (status === 'failed') {
        this.processing.delete(requestedKey);
        logger.error({ requestedKey, error: job.error }, 'Job failed');
      }

      this.scheduleSave();
    }
  }

  getNextJob(): QueuedJob | undefined {
    const settings = settingsManager.get();

    // Check concurrent limit
    if (this.processing.size >= settings.browser.maxConcurrent) {
      return undefined;
    }

    // Get jobs sorted by priority (higher first) and then by creation time
    const pendingJobs = Array.from(this.queue.values())
      .filter((job) => job.status === 'queued')
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return pendingJobs[0];
  }

  markAsProcessing(requestedKey: string): void {
    const job = this.queue.get(requestedKey);
    if (job && job.status === 'queued') {
      job.status = 'processing';
      job.updatedAt = new Date();
      this.processing.add(requestedKey);
      logger.info({ requestedKey }, 'Job processing started');
      this.scheduleSave();
    }
  }

  getQueueStats(): {
    total: number;
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const jobs = Array.from(this.queue.values());
    return {
      total: jobs.length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      processing: jobs.filter((j) => j.status === 'processing').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
    };
  }

  cleanupOldJobs(maxAgeMs: number): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, job] of this.queue.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        now - job.updatedAt.getTime() > maxAgeMs
      ) {
        this.queue.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, 'Cleaned up old jobs');
      this.scheduleSave();
    }

    return cleaned;
  }

  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    setImmediate(() => {
      const nextJob = this.getNextJob();
      if (nextJob) {
        this.emit('process', nextJob);
      }
      this.isProcessing = false;
    });
  }

  triggerProcessing(): void {
    this.processQueue();
  }
}

export const queueManager = new QueueManager();
