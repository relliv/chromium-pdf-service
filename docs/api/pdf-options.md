# PDF Options

PDF options control the output format and appearance of the generated PDF.

## Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `format` | string | `A4`, `Letter`, `Legal`, `A3`, `A5` |
| `width` | string/number | Custom width (e.g., `800`, `"10in"`, `"25cm"`) |
| `height` | string/number | Custom height (e.g., `600`, `"8in"`, `"20cm"`) |
| `landscape` | boolean | Landscape orientation |
| `margin` | object | `{ top, right, bottom, left }` |
| `printBackground` | boolean | Print background graphics |
| `scale` | number | Scale factor (0.1 - 2) |
| `headerTemplate` | string | HTML template for header |
| `footerTemplate` | string | HTML template for footer |
| `displayHeaderFooter` | boolean | Show header/footer |

::: warning
Use either `format` OR `width`/`height`, not both. Custom dimensions override format.
:::

## Examples

### Standard Format

```json
{
  "options": {
    "pdf": {
      "format": "A4",
      "printBackground": true
    }
  }
}
```

### Custom Dimensions

```json
{
  "options": {
    "pdf": {
      "width": 400,
      "height": 800,
      "printBackground": true
    }
  }
}
```

### With Units

```json
{
  "options": {
    "pdf": {
      "width": "10in",
      "height": "8in"
    }
  }
}
```

### Custom Margins

```json
{
  "options": {
    "pdf": {
      "format": "A4",
      "margin": {
        "top": "20mm",
        "right": "15mm",
        "bottom": "20mm",
        "left": "15mm"
      }
    }
  }
}
```

### Landscape Orientation

```json
{
  "options": {
    "pdf": {
      "format": "A4",
      "landscape": true
    }
  }
}
```

### Header and Footer

```json
{
  "options": {
    "pdf": {
      "format": "A4",
      "displayHeaderFooter": true,
      "headerTemplate": "<div style='font-size: 10px; text-align: center; width: 100%;'>My Header</div>",
      "footerTemplate": "<div style='font-size: 10px; text-align: center; width: 100%;'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
    }
  }
}
```
