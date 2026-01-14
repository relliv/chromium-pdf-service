# Screenshot Options

Screenshot options control the output format and capture settings for generated screenshots.

## Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | `"png"` | Output format: `"png"` or `"jpeg"` |
| `quality` | number | - | JPEG quality (0-100). Only valid for JPEG |
| `fullPage` | boolean | `true` | Capture full scrollable page |
| `clip` | object | - | Capture specific region `{ x, y, width, height }` |
| `omitBackground` | boolean | `false` | Transparent background (PNG only) |
| `scale` | string | - | Scale mode: `"css"` or `"device"` |

::: warning
- Use either `fullPage` OR `clip`, not both
- `quality` is only valid when `type` is `"jpeg"`
- `omitBackground` only works with PNG format
:::

## Examples

### PNG Screenshot (Default)

```json
{
  "options": {
    "screenshot": {
      "type": "png",
      "fullPage": true
    }
  }
}
```

### JPEG with Quality

```json
{
  "options": {
    "screenshot": {
      "type": "jpeg",
      "quality": 80,
      "fullPage": true
    }
  }
}
```

::: tip
Lower quality values result in smaller file sizes. A quality of 80 is usually a good balance between size and visual quality.
:::

### Capture Specific Region

```json
{
  "options": {
    "screenshot": {
      "type": "png",
      "fullPage": false,
      "clip": {
        "x": 100,
        "y": 200,
        "width": 800,
        "height": 600
      }
    }
  }
}
```

The `clip` object defines:
- `x`: Left offset in pixels
- `y`: Top offset in pixels
- `width`: Width of the region in pixels
- `height`: Height of the region in pixels

### Transparent Background

```json
{
  "options": {
    "screenshot": {
      "type": "png",
      "omitBackground": true
    }
  }
}
```

::: tip
For transparent backgrounds to work, ensure your HTML content has a transparent background style:
```html
<body style="background: transparent;">
```
:::

### Viewport-Only Screenshot

To capture only the visible viewport (not full page):

```json
{
  "options": {
    "browser": {
      "viewport": { "width": 1920, "height": 1080 }
    },
    "screenshot": {
      "type": "png",
      "fullPage": false
    }
  }
}
```

### High-DPI Screenshot

Use `scale: "device"` for high-DPI (retina) screenshots:

```json
{
  "options": {
    "screenshot": {
      "type": "png",
      "fullPage": true,
      "scale": "device"
    }
  }
}
```

## Combining with Browser Options

Screenshot options work alongside browser options for full control:

```json
{
  "requestedKey": "full-control-screenshot",
  "url": "https://example.com",
  "options": {
    "browser": {
      "viewport": { "width": 1920, "height": 1080 },
      "timeout": 30000,
      "waitForSelector": "#content-loaded",
      "waitAfter": 1000,
      "disableAnimations": true
    },
    "screenshot": {
      "type": "png",
      "fullPage": true,
      "omitBackground": false
    }
  }
}
```

## Output Files

Screenshots are saved to the configured output directory with the following naming convention:

```
{outputDir}/{date}/{requestedKey}__{timestamp}.{ext}
```

Example: `pdf-files/15-01-2025/my-screenshot__15-01-2025_10-30-45.png`
