# Queue Options

Queue options control job priority and processing order.

## Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `priority` | number | Priority level 1-10 (higher = processed first) |

## Request Options

| Option | Type | Description |
|--------|------|-------------|
| `reCreate` | boolean | Force recreate PDF even if one already exists |

## Examples

### High Priority Job

```json
{
  "requestedKey": "urgent-report",
  "url": "https://example.com",
  "options": {
    "queue": {
      "priority": 10
    }
  }
}
```

### Force Recreate

```json
{
  "requestedKey": "existing-report",
  "url": "https://example.com",
  "reCreate": true
}
```

::: tip
By default, if a PDF with the same `requestedKey` already exists and is completed, the service will return the existing PDF. Use `reCreate: true` to force regeneration.
:::
