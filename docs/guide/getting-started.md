# Getting Started

Chromium PDF Service is a simple PDF generation service built with Fastify, TypeScript, Playwright, and Docker.

::: tip Suitable Use Cases
This service is designed for internal tools, proof of concepts, development environments, and trusted networks. For public-facing production deployments, additional security hardening (authentication, rate limiting, etc.) is recommended.
:::

## Features

- **Multiple Input Sources**: Generate PDFs from HTML content, URLs, or uploaded HTML files
- **Queue System**: Built-in job queue with priority support, status tracking, and cancellation
- **Queue Persistence**: Jobs survive service restarts (saved to `data/queue.json`)
- **Idempotent Requests**: Same `requestedKey` returns existing PDF if already completed
- **Custom Dimensions**: Use predefined formats (A4, Letter) or custom width/height
- **Disable Animations**: Option to disable CSS animations for reliable PDF rendering
- **Error Screenshots**: Captures page screenshot on failure for debugging
- **Docker Ready**: Production-ready Docker configuration with Chromium
- **Health Checks**: Kubernetes-compatible health, readiness, and liveness endpoints
- **Logging**: Structured JSON logging with Pino (stdout + daily log files)

## Quick Start

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

## Job Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting in queue |
| `processing` | Job is being processed |
| `completed` | PDF generated successfully |
| `failed` | PDF generation failed (screenshot captured) |
| `cancelled` | Job was cancelled |
