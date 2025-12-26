# Docker Networking

## Access Host Machine from Container

Use `host.docker.internal` to access services on your host:

```json
{
  "requestedKey": "local-page",
  "url": "http://host.docker.internal:8080/my-page"
}
```

## Access Other Containers

When containers are on the same network, use service names:

```json
{
  "requestedKey": "other-service",
  "url": "http://my-web-app:3000/page-to-print"
}
```

## URL Reference

| From | URL Pattern |
|------|-------------|
| Host machine | `http://localhost:4500/...` |
| Inside Docker (same network) | `http://pdf-service:3000/...` |
| PDF service → host | `http://host.docker.internal:PORT/...` |
| PDF service → other container | `http://service-name:PORT/...` |

## Setting Up a Shared Network

1. Create a shared network:

```bash
docker network create my-network
```

2. Connect both containers to it:

```yaml
# docker-compose.yml for PDF service
services:
  pdf-service:
    # ...
    networks:
      - my-network

networks:
  my-network:
    external: true
```

```yaml
# docker-compose.yml for your web app
services:
  my-web-app:
    # ...
    networks:
      - my-network

networks:
  my-network:
    external: true
```
