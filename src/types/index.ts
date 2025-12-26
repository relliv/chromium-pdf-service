// Deep Partial utility type (preserves arrays as-is)
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? U[] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// PDF Job Status
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Browser Options
export interface BrowserOptions {
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  extraHTTPHeaders?: Record<string, string>;
  waitForSelector?: string; // CSS selector to wait for before generating PDF
  waitAfter?: number; // Additional wait time (ms) after page load or selector appears
  disableAnimations?: boolean; // Disable all CSS animations and transitions
}

// PDF Options
export interface PdfOptions {
  format?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
  width?: string | number; // e.g., '400px', 400, '10cm'
  height?: string | number; // e.g., '1000px', 1000, '20cm'
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  scale?: number;
  headerTemplate?: string;
  footerTemplate?: string;
  displayHeaderFooter?: boolean;
}

// Queue Options
export interface QueueOptions {
  priority?: number;
}

// PDF Generation Request
export interface PdfGenerationRequest {
  requestedKey: string;
  options?: {
    browser?: BrowserOptions;
    pdf?: PdfOptions;
    queue?: QueueOptions;
  };
}

// HTML PDF Request
export interface HtmlPdfRequest extends PdfGenerationRequest {
  html: string;
}

// URL PDF Request
export interface UrlPdfRequest extends PdfGenerationRequest {
  url: string;
}

// PDF Job
export interface PdfJob {
  requestedKey: string;
  type: 'html' | 'url' | 'file';
  source: string;
  status: JobStatus;
  progress: number;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  error?: string;
  options: {
    browser: BrowserOptions;
    pdf: PdfOptions;
  };
}

// Job Status Response
export interface JobStatusResponse {
  requestedKey: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  error?: string;
}

// Settings
export interface Settings {
  browser: {
    maxConcurrent: number;
    defaultTimeout: number;
    defaultViewport: {
      width: number;
      height: number;
    };
    launchOptions: {
      headless: boolean;
      args: string[];
    };
  };
  pdf: {
    defaultFormat: string;
    defaultMargin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    printBackground: boolean;
  };
  queue: {
    maxSize: number;
    processingTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  storage: {
    outputDir: string;
    cleanupAfterHours: number;
  };
}
