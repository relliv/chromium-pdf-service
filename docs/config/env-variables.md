# Environment Variables

Configure the service using environment variables.

## Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level |
| `SETTINGS_PATH` | `data/settings.json` | Settings file path |
| `OUTPUT_DIR` | `pdf-files` | PDF output directory |
| `LOGS_DIR` | `logs` | Process logs directory |

## Usage

### Local Development

```bash
PORT=4000 LOG_LEVEL=debug npm run dev
```

### Docker Compose

```yaml
services:
  pdf-service:
    image: chromium-pdf-service:latest
    environment:
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
      - OUTPUT_DIR=/app/pdf-files
      - LOGS_DIR=/app/logs
```

### Docker Run

```bash
docker run -d \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -p 4500:3000 \
  chromium-pdf-service:latest
```

## Log Levels

| Level | Description |
|-------|-------------|
| `trace` | Very detailed debugging |
| `debug` | Debugging information |
| `info` | General information (default) |
| `warn` | Warning messages |
| `error` | Error messages only |
| `fatal` | Fatal errors only |
