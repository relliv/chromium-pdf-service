# Development Guide

This guide covers setting up and developing the Chromium PDF Service locally.

## Prerequisites

- Node.js >= 24.0.0
- npm or yarn
- Docker (optional, for containerized development)

## Local Setup

### 1. Clone and Install

```bash
git clone https://github.com/relliv/chromium-pdf-service.git
cd chromium-pdf-service

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit as needed
vim .env
```

### 3. Run Development Server

```bash
npm run dev
```

The service starts at `http://localhost:3000` with hot-reload enabled.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run docs:dev` | Start documentation dev server |
| `npm run docs:build` | Build documentation |

## Project Structure

```
chromium-pdf-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Fastify app setup
│   ├── config/
│   │   ├── env.ts            # Environment variables
│   │   └── default-settings.ts
│   ├── routes/
│   │   ├── pdf.routes.ts     # PDF generation endpoints
│   │   ├── status.routes.ts  # Job status endpoints
│   │   ├── health.routes.ts  # Health check endpoints
│   │   └── settings.routes.ts
│   ├── services/
│   │   ├── pdf-generator.ts  # Core PDF generation
│   │   ├── queue-manager.ts  # Job queue management
│   │   └── settings-manager.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── auth.ts           # API key authentication
│   ├── schemas/              # Zod validation schemas
│   ├── types/                # TypeScript types
│   └── utils/
│       ├── logger.ts
│       ├── filename.ts
│       ├── url-validator.ts
│       └── html-sanitizer.ts
├── tests/                    # Test files
├── docs/                     # VitePress documentation
├── data/                     # Runtime data (settings, queue)
├── pdf-files/                # Generated PDFs
└── logs/                     # Log files
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Structure

```
tests/
├── routes/           # Route/endpoint tests
├── services/         # Service layer tests
├── middleware/       # Middleware tests
├── schemas/          # Schema validation tests
└── utils/            # Utility function tests
```

## Code Quality

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Type Checking

```bash
npm run typecheck
```

## API Documentation

Swagger UI is available in development mode:

```
http://localhost:3000/docs
```

## Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev
```

### View Logs

Logs are written to:
- Console (pretty-printed in development)
- `logs/` directory (JSON format)

## Making Changes

### Adding a New Route

1. Create route file in `src/routes/`
2. Define Zod schemas in `src/schemas/`
3. Register route in `src/app.ts`
4. Add tests in `tests/routes/`

### Adding a New Service

1. Create service file in `src/services/`
2. Export singleton instance
3. Add tests in `tests/services/`

### Adding Environment Variables

1. Add to `src/config/env.ts`
2. Update `.env.example`
3. Update `docs/config/env-variables.md`
