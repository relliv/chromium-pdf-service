# Logging

Logs are written to both stdout and daily JSON log files.

## Log Files

Logs are stored in the `logs` directory with daily rotation:

```
logs/
├── 25-12-2025.json
├── 26-12-2025.json
└── ...
```

**Log file format:** `dd-mm-yyyy.json`

## Log Structure

Each line in the log file is a JSON object containing:

```json
{
  "level": 30,
  "time": 1735123456789,
  "service": "chromium-pdf-service",
  "requestedKey": "invoice-123",
  "msg": "Job completed"
}
```

### Log Levels

| Level | Name | Description |
|-------|------|-------------|
| 10 | trace | Very detailed debugging |
| 20 | debug | Debugging information |
| 30 | info | General information |
| 40 | warn | Warning messages |
| 50 | error | Error messages |
| 60 | fatal | Fatal errors |

## Configuration

Set log level via environment variable:

```bash
LOG_LEVEL=debug npm start
```

Or in Docker:

```yaml
environment:
  - LOG_LEVEL=info
```
