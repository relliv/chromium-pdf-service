# Chromium PDF Service

[![Tests](https://github.com/relliv/chromium-pdf-service/actions/workflows/test.yml/badge.svg)](https://github.com/relliv/chromium-pdf-service/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple PDF generation service built with Fastify, TypeScript, Playwright, and Docker.

📖 **[Documentation](https://relliv.github.io/chromium-pdf-service/)**

## Features

- Generate PDFs from HTML, URLs, or uploaded files
- Queue system with priority, status tracking, and persistence
- Idempotent requests (same key returns existing PDF)
- Custom dimensions and page formats
- Disable CSS animations for reliable rendering
- Error screenshots for debugging
- Docker ready with health checks

## Quick Start

```bash
# Using Docker Compose
docker-compose up -d

# Local development
npm install
npx playwright install chromium
npm run dev
```

## API Example

```bash
curl -X POST http://localhost:3000/api/pdf/from-url \
  -H "Content-Type: application/json" \
  -d '{
    "requestedKey": "my-pdf",
    "url": "https://example.com",
    "options": {
      "pdf": { "format": "A4" }
    }
  }'
```

## Documentation

- [Getting Started](https://relliv.github.io/chromium-pdf-service/guide/getting-started)
- [API Reference](https://relliv.github.io/chromium-pdf-service/api/endpoints)
- [Configuration](https://relliv.github.io/chromium-pdf-service/config/settings)
- [Docker Setup](https://relliv.github.io/chromium-pdf-service/guide/docker)

## License

MIT
