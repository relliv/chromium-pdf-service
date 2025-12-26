# API Endpoints

## PDF Generation

### Generate PDF from HTML

```bash
POST /api/pdf/from-html
Content-Type: application/json
```

```json
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

### Generate PDF from URL

```bash
POST /api/pdf/from-url
Content-Type: application/json
```

```json
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

### Generate PDF with Custom Dimensions

```json
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

### Generate PDF with Loading Rules

```json
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

::: tip
This waits for the `#chart-container` element to appear, then waits an additional 2 seconds before generating the PDF.
:::

### Generate PDF with Animations Disabled

```json
{
  "requestedKey": "no-animation-pdf",
  "url": "https://example.com/animated-page",
  "options": {
    "browser": {
      "disableAnimations": true
    },
    "pdf": {
      "format": "A4",
      "printBackground": true
    }
  }
}
```

### Generate PDF with Custom Headers

```json
{
  "requestedKey": "auth-page",
  "url": "https://example.com/protected",
  "options": {
    "browser": {
      "userAgent": "Mozilla/5.0 Custom Agent",
      "extraHTTPHeaders": {
        "Authorization": "Bearer your-token",
        "X-Custom-Header": "custom-value"
      }
    }
  }
}
```

### Generate PDF from File

```bash
POST /api/pdf/from-file
Content-Type: multipart/form-data

file: <HTML file>
requestedKey: report-001
options: {"pdf": {"format": "Letter"}}
```

## Job Management

### Get Job Status

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
  "filePath": "pdf-files/15-01-2025/invoice-12345__15-01-2025_10-30-05.pdf"
}
```

### Cancel Job

```bash
DELETE /api/pdf/cancel/:requestedKey
```

### Download PDF

```bash
GET /api/pdf/download/:requestedKey
```

### Queue Statistics

```bash
GET /api/pdf/queue
```

## Health Checks

```bash
GET /health       # Basic health check
GET /health/ready # Readiness probe
GET /health/live  # Liveness probe with queue stats
```

## Settings

### Get Current Settings

```bash
GET /api/settings
```

### Update Settings

```bash
PUT /api/settings
Content-Type: application/json
```

```json
{
  "browser": {
    "maxConcurrent": 5
  },
  "queue": {
    "maxSize": 200
  }
}
```

### Reset to Defaults

```bash
POST /api/settings/reset
```
