# Queue System

The service includes a built-in job queue with priority support, status tracking, and automatic persistence.

## Features

- **Priority Support**: Jobs with higher priority (1-10) are processed first
- **Status Tracking**: Track job progress from queued to completed
- **Cancellation**: Cancel pending or processing jobs
- **Persistence**: Queue state survives service restarts

## Queue Persistence

Queue state is saved to `data/queue.json` and restored on service restart:

- Processing jobs are reset to "queued" on restart
- Completed/failed jobs are preserved
- Automatic retry on failure

## Queue Statistics

Get queue statistics via API:

```bash
GET /api/pdf/queue
```

Response:

```json
{
  "total": 10,
  "queued": 5,
  "processing": 2,
  "completed": 2,
  "failed": 1,
  "cancelled": 0
}
```

## Priority

Use the `priority` option to control job processing order:

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

Priority levels: 1 (lowest) to 10 (highest). Default is 5.
