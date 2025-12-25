import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the settings manager before importing queue manager
vi.mock('../../src/services/settings-manager.js', () => ({
  settingsManager: {
    get: vi.fn(() => ({
      browser: {
        maxConcurrent: 100, // High enough to not block getNextJob in tests
        defaultTimeout: 30000,
        defaultViewport: { width: 1920, height: 1080 },
        launchOptions: { headless: true, args: [] },
      },
      pdf: {
        defaultFormat: 'A4',
        defaultMargin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        printBackground: true,
      },
      queue: {
        maxSize: 1000, // Large enough for all tests
        processingTimeout: 60000,
        retryAttempts: 2,
        retryDelay: 1000,
      },
      storage: {
        outputDir: 'pdf-files',
        cleanupAfterHours: 24,
      },
    })),
  },
}));

// Mock the logger
vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
const { queueManager } = await import('../../src/services/queue-manager.js');

describe('QueueManager', () => {
  beforeEach(() => {
    // Clear all jobs before each test
    // We need to access the internal queue - this is a workaround
    vi.clearAllMocks();
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const job = await queueManager.addJob({
        requestedKey: 'test-job-1',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: {
          browser: {},
          pdf: {},
        },
      });

      expect(job.requestedKey).toBe('test-job-1');
      expect(job.status).toBe('queued');
      expect(job.progress).toBe(0);
      expect(job.type).toBe('html');
    });

    it('should reject duplicate requestedKey', async () => {
      await queueManager.addJob({
        requestedKey: 'duplicate-key',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      await expect(
        queueManager.addJob({
          requestedKey: 'duplicate-key',
          type: 'html',
          source: '<html></html>',
          priority: 5,
          options: { browser: {}, pdf: {} },
        })
      ).rejects.toThrow("Job with requestedKey 'duplicate-key' already exists");
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();

      const job = await queueManager.addJob({
        requestedKey: 'timestamp-test',
        type: 'url',
        source: 'https://example.com',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      const after = new Date();

      expect(job.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(job.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(job.updatedAt.getTime()).toBe(job.createdAt.getTime());
    });
  });

  describe('getJob', () => {
    it('should return job by requestedKey', async () => {
      await queueManager.addJob({
        requestedKey: 'get-job-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      const job = queueManager.getJob('get-job-test');

      expect(job).toBeDefined();
      expect(job?.requestedKey).toBe('get-job-test');
    });

    it('should return undefined for non-existent job', () => {
      const job = queueManager.getJob('non-existent-key');

      expect(job).toBeUndefined();
    });
  });

  describe('getJobStatus', () => {
    it('should return job status with ISO timestamps', async () => {
      await queueManager.addJob({
        requestedKey: 'status-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      const status = queueManager.getJobStatus('status-test');

      expect(status).toBeDefined();
      expect(status?.requestedKey).toBe('status-test');
      expect(status?.status).toBe('queued');
      expect(status?.progress).toBe(0);
      expect(status?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(status?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return undefined for non-existent job', () => {
      const status = queueManager.getJobStatus('non-existent');

      expect(status).toBeUndefined();
    });
  });

  describe('cancelJob', () => {
    it('should cancel a queued job', async () => {
      await queueManager.addJob({
        requestedKey: 'cancel-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      const cancelled = queueManager.cancelJob('cancel-test');

      expect(cancelled).toBe(true);

      const status = queueManager.getJobStatus('cancel-test');
      expect(status?.status).toBe('cancelled');
    });

    it('should return false for non-existent job', () => {
      const cancelled = queueManager.cancelJob('non-existent');

      expect(cancelled).toBe(false);
    });
  });

  describe('removeJob', () => {
    it('should remove a completed job from queue', async () => {
      await queueManager.addJob({
        requestedKey: 'remove-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      // Mark as completed
      queueManager.markAsProcessing('remove-test');
      queueManager.updateJobStatus('remove-test', 'completed', { filePath: '/test/path.pdf' });

      const removed = queueManager.removeJob('remove-test');

      expect(removed).toBe(true);
      expect(queueManager.getJobStatus('remove-test')).toBeUndefined();
    });

    it('should remove a queued job', async () => {
      await queueManager.addJob({
        requestedKey: 'remove-queued',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      const removed = queueManager.removeJob('remove-queued');

      expect(removed).toBe(true);
      expect(queueManager.getJobStatus('remove-queued')).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const removed = queueManager.removeJob('non-existent');

      expect(removed).toBe(false);
    });

    it('should return false for processing job', async () => {
      await queueManager.addJob({
        requestedKey: 'remove-processing',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('remove-processing');

      const removed = queueManager.removeJob('remove-processing');

      expect(removed).toBe(false);
      expect(queueManager.getJobStatus('remove-processing')).toBeDefined();
    });
  });

  describe('updateJobProgress', () => {
    it('should update progress for processing job', async () => {
      await queueManager.addJob({
        requestedKey: 'progress-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('progress-test');
      queueManager.updateJobProgress('progress-test', 50);

      const status = queueManager.getJobStatus('progress-test');
      expect(status?.progress).toBe(50);
    });

    it('should clamp progress to 0-100 range', async () => {
      await queueManager.addJob({
        requestedKey: 'clamp-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('clamp-test');

      queueManager.updateJobProgress('clamp-test', 150);
      let status = queueManager.getJobStatus('clamp-test');
      expect(status?.progress).toBe(100);

      queueManager.updateJobProgress('clamp-test', -50);
      status = queueManager.getJobStatus('clamp-test');
      expect(status?.progress).toBe(0);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to completed with filePath', async () => {
      await queueManager.addJob({
        requestedKey: 'complete-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('complete-test');
      queueManager.updateJobStatus('complete-test', 'completed', {
        filePath: '/path/to/file.pdf',
      });

      const status = queueManager.getJobStatus('complete-test');
      expect(status?.status).toBe('completed');
      expect(status?.progress).toBe(100);
      expect(status?.filePath).toBe('/path/to/file.pdf');
    });

    it('should update job status to failed with error', async () => {
      await queueManager.addJob({
        requestedKey: 'fail-test',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('fail-test');
      queueManager.updateJobStatus('fail-test', 'failed', {
        error: 'Something went wrong',
      });

      const status = queueManager.getJobStatus('fail-test');
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe('Something went wrong');
    });
  });

  describe('getQueueStats', () => {
    it('should return correct queue statistics', async () => {
      // Add jobs with different statuses
      await queueManager.addJob({
        requestedKey: 'stats-1',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      await queueManager.addJob({
        requestedKey: 'stats-2',
        type: 'html',
        source: '<html></html>',
        priority: 5,
        options: { browser: {}, pdf: {} },
      });

      queueManager.markAsProcessing('stats-1');

      const stats = queueManager.getQueueStats();

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.processing).toBeGreaterThanOrEqual(1);
      expect(stats.queued).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getNextJob', () => {
    it('should return highest priority job first', async () => {
      await queueManager.addJob({
        requestedKey: 'low-priority',
        type: 'html',
        source: '<html></html>',
        priority: 1,
        options: { browser: {}, pdf: {} },
      });

      await queueManager.addJob({
        requestedKey: 'high-priority',
        type: 'html',
        source: '<html></html>',
        priority: 10,
        options: { browser: {}, pdf: {} },
      });

      const nextJob = queueManager.getNextJob();

      expect(nextJob?.requestedKey).toBe('high-priority');
    });
  });
});
