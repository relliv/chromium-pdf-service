# Settings

The service can be configured via the settings API or by editing `data/settings.json`.

## Settings Schema

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
    "defaultMargin": {
      "top": "20mm",
      "right": "20mm",
      "bottom": "20mm",
      "left": "20mm"
    },
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

## Browser Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxConcurrent` | number | 3 | Maximum concurrent browser instances |
| `defaultTimeout` | number | 30000 | Default navigation timeout (ms) |
| `defaultViewport` | object | `{ width: 1920, height: 1080 }` | Default viewport size |
| `launchOptions` | object | - | Chromium launch options |

## PDF Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `defaultFormat` | string | "A4" | Default paper format |
| `defaultMargin` | object | 20mm all sides | Default margins |
| `printBackground` | boolean | true | Print background by default |

## Queue Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxSize` | number | 100 | Maximum queue size |
| `processingTimeout` | number | 60000 | Job timeout (ms) |
| `retryAttempts` | number | 2 | Retry attempts on failure |
| `retryDelay` | number | 1000 | Delay between retries (ms) |

## Storage Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `outputDir` | string | "pdf-files" | PDF output directory |
| `cleanupAfterHours` | number | 24 | Auto-cleanup after hours |

## API

### Get Settings

```bash
GET /api/settings
```

### Update Settings

```bash
PUT /api/settings
Content-Type: application/json

{
  "browser": {
    "maxConcurrent": 5
  }
}
```

### Reset to Defaults

```bash
POST /api/settings/reset
```
