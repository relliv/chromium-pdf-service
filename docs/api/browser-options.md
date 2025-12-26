# Browser Options

Browser options control how the page is loaded and rendered.

## Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `timeout` | number | Navigation timeout in ms (max 120000) |
| `viewport` | object | `{ width, height }` |
| `userAgent` | string | Custom user agent |
| `extraHTTPHeaders` | object | Additional HTTP headers |
| `waitForSelector` | string | CSS selector to wait for before generating PDF |
| `waitAfter` | number | Additional wait time (ms) after page load or selector appears (max 60000) |
| `disableAnimations` | boolean | Disable all CSS animations and transitions |

## Examples

### Custom Viewport

```json
{
  "options": {
    "browser": {
      "viewport": {
        "width": 1920,
        "height": 1080
      }
    }
  }
}
```

### Custom User Agent

```json
{
  "options": {
    "browser": {
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  }
}
```

### Custom Headers

```json
{
  "options": {
    "browser": {
      "extraHTTPHeaders": {
        "Authorization": "Bearer your-token",
        "Accept-Language": "en-US"
      }
    }
  }
}
```

### Wait for Element

```json
{
  "options": {
    "browser": {
      "waitForSelector": "#content-loaded",
      "waitAfter": 1000
    }
  }
}
```

### Disable Animations

```json
{
  "options": {
    "browser": {
      "disableAnimations": true
    }
  }
}
```

::: tip
Use `disableAnimations: true` when your page has CSS animations that might cause elements to be invisible or transformed when the PDF is captured.
:::
