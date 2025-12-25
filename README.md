# Chromium PDF Service

A simple PDF generation service built with Fastify, TypeScript, Playwright, and Docker. Generate PDFs from HTML, URLs, or uploaded files with full control over browser and PDF options.

## ✨ Features

- **Multiple Input Sources**: Generate PDFs from HTML content, URLs, or uploaded HTML files
- **Queue System**: Built-in job queue with priority support, status tracking, and cancellation
- **Idempotent Requests**: Same `requestedKey` returns existing PDF if already completed (use `reCreate: true` to force regeneration)
- **Custom Dimensions**: Use predefined formats (A4, Letter) or custom width/height
- **Configurable**: Customizable browser options, PDF settings, and queue limits
- **Docker Ready**: Production-ready Docker configuration with Chromium
- **Health Checks**: Kubernetes-compatible health, readiness, and liveness endpoints
- **Logging**: Structured JSON logging with Pino

## 🚀 Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Local Development

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### PDF Generation

#### Generate PDF from HTML

```bash
POST /api/pdf/from-html
Content-Type: application/json

{
  "requestedKey": "invoice-12345",
  "html": "<html><body><h1>Hello World</h1></body></html>",
  "options": {
    "pdf": {
      "format": "A4",
      "printBackground": true
    }
  }
}
```

#### Generate PDF from URL

```bash
POST /api/pdf/from-url
Content-Type: application/json

{
  "requestedKey": "website-snapshot",
  "url": "https://example.com",
  "options": {
    "browser": {
      "timeout": 30000,
      "viewport": { "width": 1920, "height": 1080 }
    }
  }
}
```

#### Generate PDF with Custom Dimensions

```bash
POST /api/pdf/from-url
Content-Type: application/json

{
  "requestedKey": "custom-size-pdf",
  "url": "https://example.com",
  "options": {
    "browser": {
      "viewport": { "width": 400, "height": 800 }
    },
    "pdf": {
      "width": 400,
      "height": 800,
      "printBackground": true
    }
  }
}
```

#### Generate PDF with Loading Rules

```bash
POST /api/pdf/from-url
Content-Type: application/json

{
  "requestedKey": "spa-page",
  "url": "https://example.com/dashboard",
  "options": {
    "browser": {
      "timeout": 60000,
      "waitForSelector": "#chart-container",
      "waitAfter": 2000
    },
    "pdf": {
      "format": "A4",
      "printBackground": true
    }
  }
}
```

> This waits for the `#chart-container` element to appear, then waits an additional 2 seconds before generating the PDF.

#### Generate PDF from File

```bash
POST /api/pdf/from-file
Content-Type: multipart/form-data

file: <HTML file>
requestedKey: report-001
options: {"pdf": {"format": "Letter"}}
```

### Job Management

#### Get Job Status

```bash
GET /api/pdf/status/:requestedKey
```

Response:

```json
{
  "requestedKey": "invoice-12345",
  "status": "completed",
  "progress": 100,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:05.000Z",
  "filePath": "pdf-files/invoice-12345__2025-01-15-10-30-05.pdf"
}
```

#### Cancel Job

```bash
DELETE /api/pdf/cancel/:requestedKey
```

#### Download PDF

```bash
GET /api/pdf/download/:requestedKey
```

#### Queue Statistics

```bash
GET /api/pdf/queue
```

### Settings

#### Get Current Settings

```bash
GET /api/settings
```

#### Update Settings

```bash
PUT /api/settings
Content-Type: application/json

{
  "browser": {
    "maxConcurrent": 5
  },
  "queue": {
    "maxSize": 200
  }
}
```

#### Reset to Defaults

```bash
POST /api/settings/reset
```

### Health Checks

```bash
GET /health       # Basic health check
GET /health/ready # Readiness probe
GET /health/live  # Liveness probe with queue stats
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level |
| `SETTINGS_PATH` | `data/settings.json` | Settings file path |
| `OUTPUT_DIR` | `pdf-files` | PDF output directory |
| `LOGS_DIR` | `logs` | Process logs directory |

### Settings Schema

```json
{
  "browser": {
    "maxConcurrent": 3,
    "defaultTimeout": 30000,
    "defaultViewport": { "width": 1920, "height": 1080 },
    "launchOptions": {
      "headless": true,
      "args": ["--no-sandbox", "--disable-setuid-sandbox"]
    }
  },
  "pdf": {
    "defaultFormat": "A4",
    "defaultMargin": { "top": "20mm", "right": "20mm", "bottom": "20mm", "left": "20mm" },
    "printBackground": true
  },
  "queue": {
    "maxSize": 100,
    "processingTimeout": 60000,
    "retryAttempts": 2,
    "retryDelay": 1000
  },
  "storage": {
    "outputDir": "pdf-files",
    "cleanupAfterHours": 24
  }
}
```

## 🔧 Request Options

### Browser Options

| Option | Type | Description |
|--------|------|-------------|
| `timeout` | number | Navigation timeout in ms (max 120000) |
| `viewport` | object | `{ width, height }` |
| `userAgent` | string | Custom user agent |
| `extraHTTPHeaders` | object | Additional HTTP headers |
| `waitForSelector` | string | CSS selector to wait for before generating PDF |
| `waitAfter` | number | Additional wait time (ms) after page load or selector appears (max 60000) |

### Request Options

| Option | Type | Description |
|--------|------|-------------|
| `reCreate` | boolean | Force recreate PDF even if one already exists for this requestedKey |

### PDF Options

| Option | Type | Description |
|--------|------|-------------|
| `format` | string | `A4`, `Letter`, `Legal`, `A3`, `A5` |
| `width` | string/number | Custom width (e.g., `800`, `"10in"`, `"25cm"`) |
| `height` | string/number | Custom height (e.g., `600`, `"8in"`, `"20cm"`) |
| `landscape` | boolean | Landscape orientation |
| `margin` | object | `{ top, right, bottom, left }` |
| `printBackground` | boolean | Print background graphics |
| `scale` | number | Scale factor (0.1 - 2) |
| `headerTemplate` | string | HTML template for header |
| `footerTemplate` | string | HTML template for footer |
| `displayHeaderFooter` | boolean | Show header/footer |

> **Note:** Use either `format` OR `width`/`height`, not both. Custom dimensions override format.

### Queue Options

| Option | Type | Description |
|--------|------|-------------|
| `priority` | number | Priority level 1-10 (higher = processed first) |

## 📝 Logging

Logs are written to both stdout and daily JSON log files in the `logs` directory.

**Log file format:** `dd-mm-yyyy.json`

Example: `25-12-2025.json`

Each line in the log file is a JSON object containing:
- `level`: Log level (info, warn, error)
- `time`: Unix timestamp
- `service`: Service name
- `msg`: Log message
- Additional context fields

## 📁 File Naming

Generated PDFs are stored with the format:

```txt
{requestedKey}__{year}-{month}-{day}-{hour}-{minute}-{second}.pdf
```

Example: `invoice-12345__2025-01-15-10-30-45.pdf`

## 📊 Job Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting in queue |
| `processing` | Job is being processed |
| `completed` | PDF generated successfully |
| `failed` | PDF generation failed |
| `cancelled` | Job was cancelled |

## 📄 License

MIT
