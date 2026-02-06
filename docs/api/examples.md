# Example Requests

This page provides complete, ready-to-use examples for common PDF generation scenarios.

## 1. Simple Invoice PDF

Generate a basic invoice from HTML content.

```bash
curl -X POST http://localhost:3000/api/pdf/from-html \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "invoice-2025-001",
    "html": "<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;padding:40px}.header{border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:30px}.amount{font-size:24px;color:#2563eb;font-weight:bold}</style></head><body><div class=\"header\"><h1>Invoice #2025-001</h1><p>Date: January 15, 2025</p></div><table width=\"100%\"><tr><td>Web Development Services</td><td align=\"right\">$2,500.00</td></tr><tr><td>Hosting (Annual)</td><td align=\"right\">$300.00</td></tr></table><hr><p class=\"amount\">Total: $2,800.00</p></body></html>",
    "options": {
      "pdf": {
        "format": "A4",
        "printBackground": true,
        "margin": { "top": "20mm", "bottom": "20mm", "left": "20mm", "right": "20mm" }
      }
    }
  }'
```

## 1.1 Simple Invoice PDF with custom dimensions

Generate a basic invoice from URL and custom dimensions.

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
      "requestedKey": "e818261b-ddf0-44b6-ac98-39becdac8fe2",
      "url": "https://example.com/payment/summary?transactionKey=e818261b-ddf0-44b6-ac98-39becdac8fe2&pdfView=true",
      "reCreate": true,
      "options": {
          "pdf": {
              "printBackground": true,
              "landscape": false,
              "width": 800,
              "height": 1300,
              "margin": {
                  "top": "0mm",
                  "right": "0mm",
                  "bottom": "0mm",
                  "left": "0mm"
              }
          },
          "browser": {
              "timeout": 20000,
              "disableAnimations": true,
              "viewport": {
                  "width": 400,
                  "height": 1000
              },
              "waitForSelector": "#order-number",
              "waitAfter": 3000
          },
          "queue": {
              "priority": 10
          }
      }
  }'
```

## 2. Website Screenshot as PDF

Capture a full webpage and convert it to PDF with custom viewport.

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "website-capture-github",
    "url": "https://github.com",
    "options": {
      "browser": {
        "viewport": { "width": 1920, "height": 1080 },
        "timeout": 30000
      }
    }
  }'
```

## 3. Authenticated Page PDF

Generate PDF from a page that requires authentication headers.

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "dashboard-report",
    "url": "https://app.example.com/dashboard",
    "options": {
      "browser": {
        "extraHTTPHeaders": {
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "X-API-Key": "your-api-key"
        },
        "timeout": 60000
      },
      "pdf": {
        "format": "A4",
        "printBackground": true
      }
    }
  }'
```

## 4. Single Page Application (SPA) PDF

Wait for dynamic content to load before generating PDF.

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "spa-dashboard",
    "url": "https://app.example.com/analytics",
    "options": {
      "browser": {
        "viewport": { "width": 1440, "height": 900 },
        "waitForSelector": "#charts-loaded",
        "waitAfter": 3000,
        "timeout": 90000
      },
      "pdf": {
        "format": "A3",
        "printBackground": true,
        "landscape": true
      }
    }
  }'
```

::: tip
Use `waitForSelector` to wait for a specific element that indicates the page is fully loaded, then `waitAfter` for additional time to ensure all animations complete.
:::

## 5. High Priority Report

Generate a PDF with high priority that jumps ahead in the queue.

```bash
curl -X POST http://localhost:3000/api/pdf/from-html \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "urgent-report-q4",
    "html": "<!DOCTYPE html><html><head><style>body{font-family:Georgia,serif;max-width:800px;margin:0 auto;padding:40px}h1{color:#dc2626}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:12px;text-align:left}</style></head><body><h1>Q4 Financial Report - URGENT</h1><p>Generated: 2025-01-15</p><table><tr><th>Metric</th><th>Value</th><th>Change</th></tr><tr><td>Revenue</td><td>$1.2M</td><td>+15%</td></tr><tr><td>Expenses</td><td>$800K</td><td>+5%</td></tr><tr><td>Profit</td><td>$400K</td><td>+35%</td></tr></table></body></html>",
    "options": {
      "pdf": {
        "format": "Letter",
        "printBackground": true
      },
      "queue": {
        "priority": 10
      }
    }
  }'
```

::: info Priority Levels
Priority ranges from 1 (lowest) to 10 (highest). Default is 5. Higher priority jobs are processed first.
:::

## 6. Animated Page with Animations Disabled

Generate PDF from a page with CSS animations, ensuring elements are fully visible.

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "landing-page-pdf",
    "url": "https://example.com/animated-landing",
    "options": {
      "browser": {
        "viewport": { "width": 1920, "height": 1080 },
        "disableAnimations": true,
        "waitAfter": 1000
      },
      "pdf": {
        "format": "A4",
        "printBackground": true
      }
    }
  }'
```

::: tip Why disable animations?
CSS animations can cause elements to be captured mid-animation, resulting in invisible or partially visible elements. The `disableAnimations` option ensures all elements are in their final state.
:::

## 7. Custom Size Social Media Card

Generate a PDF with custom dimensions for social media export.

```bash
curl -X POST http://localhost:3000/api/pdf/from-html \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "social-card-promo",
    "html": "<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1200px;height:630px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;font-family:system-ui}.card{text-align:center;color:white}h1{font-size:64px;margin-bottom:20px}p{font-size:28px;opacity:0.9}</style></head><body><div class=\"card\"><h1>New Feature Released!</h1><p>Check out our latest updates</p></div></body></html>",
    "options": {
      "browser": {
        "viewport": { "width": 1200, "height": 630 }
      },
      "pdf": {
        "width": 1200,
        "height": 630,
        "printBackground": true
      }
    }
  }'
```

## Checking Job Status

After submitting a request, check the status:

```bash
curl http://localhost:3000/api/pdf/status/invoice-2025-001
```

Response:

```json
{
  "requestedKey": "invoice-2025-001",
  "status": "completed",
  "filePath": "pdf-files/15-01-2025/invoice-2025-001__15-01-2025_10-30-45.pdf",
  "createdAt": "2025-01-15T10:30:40.000Z",
  "updatedAt": "2025-01-15T10:30:45.000Z"
}
```

## Downloading the PDF

Once the status is `completed`, download the PDF:

```bash
curl -O http://localhost:3000/api/pdf/download/invoice-2025-001
```

## Screenshot Examples

### 8. Full Page Screenshot

Capture a full webpage as a PNG image.

```bash
curl -X POST http://localhost:3000/api/screenshot/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "homepage-screenshot",
    "url": "https://github.com",
    "options": {
      "browser": {
        "viewport": { "width": 1920, "height": 1080 }
      },
      "screenshot": {
        "type": "png",
        "fullPage": true
      }
    }
  }'
```

### 9. JPEG Screenshot with Quality

Generate a compressed JPEG screenshot.

```bash
curl -X POST http://localhost:3000/api/screenshot/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "compressed-capture",
    "url": "https://example.com",
    "options": {
      "browser": {
        "viewport": { "width": 1280, "height": 720 }
      },
      "screenshot": {
        "type": "jpeg",
        "quality": 80,
        "fullPage": false
      }
    }
  }'
```

### 10. Screenshot with Transparent Background

Capture an element with transparent background (PNG only).

```bash
curl -X POST http://localhost:3000/api/screenshot/from-html \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "transparent-logo",
    "html": "<!DOCTYPE html><html><head><style>body{margin:0;background:transparent}.logo{width:200px;height:200px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:20px;display:flex;align-items:center;justify-content:center;color:white;font-size:48px;font-family:system-ui}</style></head><body><div class=\"logo\">LOGO</div></body></html>",
    "options": {
      "browser": {
        "viewport": { "width": 200, "height": 200 }
      },
      "screenshot": {
        "type": "png",
        "omitBackground": true,
        "fullPage": false
      }
    }
  }'
```

### Checking Screenshot Status

```bash
curl http://localhost:3000/api/screenshot/status/homepage-screenshot
```

Response:

```json
{
  "requestedKey": "homepage-screenshot",
  "status": "completed",
  "filePath": "pdf-files/15-01-2025/homepage-screenshot__15-01-2025_10-30-45.png",
  "createdAt": "2025-01-15T10:30:40.000Z",
  "updatedAt": "2025-01-15T10:30:45.000Z"
}
```

### Downloading the Screenshot

Once the status is `completed`, download the screenshot:

```bash
curl -O http://localhost:3000/api/screenshot/download/homepage-screenshot
```
