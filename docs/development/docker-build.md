# Docker Build & Test

This guide covers building and testing the Docker image locally.

## Building the Image

### Basic Build

```bash
docker build -t chromium-pdf-service:latest .
```

### Build with Version Tag

```bash
# With specific version
docker build -t chromium-pdf-service:1.0.0 .

# With multiple tags
docker build -t chromium-pdf-service:latest -t chromium-pdf-service:1.0.0 .
```

### Build with No Cache

```bash
docker build --no-cache -t chromium-pdf-service:latest .
```

### Build with Build Arguments

```bash
docker build \
  --build-arg NODE_ENV=production \
  -t chromium-pdf-service:latest .
```

## Running the Container

### Basic Run

```bash
docker run -d -p 3000:3000 chromium-pdf-service:latest
```

### Run with Environment Variables

```bash
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e RATE_LIMIT_MAX=100 \
  -e API_KEYS=my-secret-key \
  chromium-pdf-service:latest
```

### Run with Volume Mounts

```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/pdf-files:/app/pdf-files \
  -v $(pwd)/logs:/app/logs \
  chromium-pdf-service:latest
```

### Run with All Options

```bash
docker run -d \
  --name pdf-service \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e RATE_LIMIT_MAX=50 \
  -e API_KEYS=key1,key2 \
  -e BLOCK_PRIVATE_IPS=true \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/pdf-files:/app/pdf-files \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  chromium-pdf-service:latest
```

## Testing the Container

### 1. Check Container Status

```bash
# List running containers
docker ps

# Check container logs
docker logs pdf-service

# Follow logs in real-time
docker logs -f pdf-service
```

### 2. Test Health Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Readiness probe
curl http://localhost:3000/health/ready

# Liveness probe
curl http://localhost:3000/health/live
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-01-01T00:00:00.000Z"}
```

### 3. Test PDF Generation

```bash
# Generate PDF from HTML
curl -X POST http://localhost:3000/api/pdf/html \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-key" \
  -d '{
    "requestedKey": "test-001",
    "html": "<h1>Hello World</h1><p>Test PDF</p>"
  }'

# Check job status
curl http://localhost:3000/api/pdf/status/test-001 \
  -H "X-API-Key: my-secret-key"

# Download PDF (when completed)
curl -O http://localhost:3000/api/pdf/download/test-001 \
  -H "X-API-Key: my-secret-key"
```

### 4. Test URL to PDF

```bash
curl -X POST http://localhost:3000/api/pdf/url \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-key" \
  -d '{
    "requestedKey": "example-page",
    "url": "https://example.com"
  }'
```

## Docker Compose

### Development

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Build and start
docker-compose -f docker-compose.yml up -d --build

# Scale (if needed)
docker-compose up -d --scale pdf-service=2
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker logs pdf-service

# Check if port is in use
lsof -i :3000

# Run interactively for debugging
docker run -it --rm chromium-pdf-service:latest /bin/bash
```

### PDF Generation Fails

```bash
# Check Chromium is working
docker exec -it pdf-service npx playwright install --dry-run

# Check available memory
docker stats pdf-service

# Increase memory limit
docker run -d --memory=2g chromium-pdf-service:latest
```

### Permission Issues

```bash
# Check volume permissions
ls -la ./pdf-files

# Fix permissions
chmod 777 ./pdf-files ./data ./logs
```

### Browser Crashes

Add these flags if browser crashes:

```bash
docker run -d \
  --shm-size=2gb \
  -p 3000:3000 \
  chromium-pdf-service:latest
```

## Performance Tips

### 1. Use Multi-Stage Build

The Dockerfile already uses multi-stage builds to minimize image size.

### 2. Set Resource Limits

```bash
docker run -d \
  --memory=2g \
  --cpus=2 \
  -p 3000:3000 \
  chromium-pdf-service:latest
```

### 3. Use Health Checks

```bash
docker run -d \
  --health-cmd="curl -f http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  -p 3000:3000 \
  chromium-pdf-service:latest
```

### 4. Optimize for Production

```yaml
# docker-compose.prod.yml
services:
  pdf-service:
    image: chromium-pdf-service:latest
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Docker image
  run: docker build -t chromium-pdf-service:${{ github.sha }} .

- name: Test Docker image
  run: |
    docker run -d -p 3000:3000 --name test chromium-pdf-service:${{ github.sha }}
    sleep 5
    curl -f http://localhost:3000/health
    docker stop test
```
