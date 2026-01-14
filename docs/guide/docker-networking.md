# Docker Networking

When running the PDF service in Docker, you may need to access URLs on your host machine or local network. This guide covers common networking scenarios.

## Access Host Machine from Container

Use `host.docker.internal` to access services on your host:

```json
{
  "requestedKey": "local-page",
  "url": "http://host.docker.internal:8080/my-page"
}
```

::: tip
`host.docker.internal` works on **macOS** and **Windows**. For Linux, see the [Linux Host Access](#linux-host-access) section.
:::

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

## Local Domain Names (.test, .local, .dev)

If you use local domain names like `myapp.test` or `localhost.test` configured via `/etc/hosts` or local DNS (dnsmasq, etc.), the Docker container cannot resolve them by default.

### Solution 1: Use host.docker.internal (Recommended)

Replace your local domain with `host.docker.internal`:

```bash
# Instead of
http://myapp.test:3000

# Use
http://host.docker.internal:3000
```

### Solution 2: Add extra_hosts in Docker Compose

Map your local domain to the host gateway:

```yaml
services:
  chromium-pdf-service:
    image: relliv/chromium-pdf-service:latest
    extra_hosts:
      - "myapp.test:host-gateway"
      - "localhost.test:host-gateway"
```

### Solution 3: Use Your Machine's IP Address

Find your local IP and use it directly:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr /i "IPv4"
```

Then use the IP in your requests:

```json
{
  "requestedKey": "local-page",
  "url": "http://192.168.1.100:3000/my-page"
}
```

### Solution 4: Custom DNS Configuration

If you have a local DNS server, configure Docker to use it:

```yaml
services:
  chromium-pdf-service:
    image: relliv/chromium-pdf-service:latest
    dns:
      - 192.168.1.1  # Your router/DNS server
    extra_hosts:
      - "myapp.test:host-gateway"
```

## Linux Host Access

On Linux, `host.docker.internal` may not work by default. Use one of these approaches:

### Option 1: Add host-gateway (Docker 20.10+)

```yaml
services:
  chromium-pdf-service:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Option 2: Use --network host

```bash
docker run --network host relliv/chromium-pdf-service:latest
```

::: warning
Using `--network host` disables network isolation. The container shares the host's network stack.
:::

### Option 3: Use Host IP Directly

```bash
# Get your host IP
hostname -I | awk '{print $1}'

# Use in requests
http://172.17.0.1:8080/my-page  # Default Docker bridge gateway
```

## Playground Configuration

When using the [Playground](/development/playground) with a containerized PDF service:

1. **Service running in Docker, Playground on host:**
   - Set Server URL to `http://localhost:4500` (mapped port)

2. **Both running in Docker:**
   - Use container service name: `http://chromium-pdf-service:3000`

3. **Playground accessing local development sites:**
   - Use `host.docker.internal` instead of `localhost`
   - Or add `extra_hosts` mapping for your local domains

### Example: Local Development Setup

```yaml
# docker-compose.yml
services:
  chromium-pdf-service:
    image: relliv/chromium-pdf-service:latest
    ports:
      - "4500:3000"
    extra_hosts:
      - "host.docker.internal:host-gateway"
      - "myapp.test:host-gateway"
      - "api.local:host-gateway"
```

## Framework Dev Server Configuration

Many frontend frameworks block requests from unknown hosts by default. You need to configure them to allow `host.docker.internal`.

### Angular

Add `host.docker.internal` to `allowedHosts` in `angular.json`:

```json
{
  "projects": {
    "your-app": {
      "architect": {
        "serve": {
          "options": {
            "allowedHosts": [
              "localhost",
              "host.docker.internal"
            ]
          }
        }
      }
    }
  }
}
```

Or use the CLI flag:

```bash
ng serve --host 0.0.0.0 --allowed-hosts host.docker.internal
```

Or allow all hosts (development only):

```bash
ng serve --host 0.0.0.0 --disable-host-check
```

### Next.js

In `next.config.js`:

```js
module.exports = {
  allowedDevHosts: ['host.docker.internal'],
}
```

### Vite (Vue, React, Svelte)

In `vite.config.js`:

```js
export default {
  server: {
    host: '0.0.0.0',
    allowedHosts: ['host.docker.internal'],
  },
}
```

### Webpack Dev Server

In `webpack.config.js`:

```js
module.exports = {
  devServer: {
    host: '0.0.0.0',
    allowedHosts: ['host.docker.internal'],
  },
}
```

::: warning Security Note
Only allow specific hosts in production. Using `--disable-host-check` or allowing all hosts should be limited to local development.
:::

## Troubleshooting

### Container can't resolve hostname

```bash
# Test DNS resolution inside container
docker exec -it <container_id> nslookup myapp.test

# If it fails, use extra_hosts or direct IP
```

### Connection refused

1. Ensure the target service is running
2. Check if the port is exposed
3. Verify firewall settings allow Docker connections

### Timeout errors

1. Check if the URL is accessible from host first
2. Verify network connectivity between containers
3. Increase timeout in browser options:

```json
{
  "options": {
    "browser": {
      "timeout": 60000
    }
  }
}
```
