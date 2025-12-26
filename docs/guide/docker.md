# Docker Setup

## Using Docker Compose

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

## Using in Another Docker Compose Project

First, build the image:

```bash
cd /path/to/chromium-pdf-service
docker build -t chromium-pdf-service:latest .
```

Then in your project's `docker-compose.yml`:

```yaml
services:
  your-app:
    # your app config...

  pdf-service:
    image: chromium-pdf-service:latest
    ports:
      - "4500:3000"
    volumes:
      - ./pdf-files:/app/pdf-files
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
```

Access from your app container:

```
http://pdf-service:3000/api/pdf/from-url
```

Access from host machine:

```
http://localhost:4500/api/pdf/from-url
```
