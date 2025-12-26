# File Storage

## PDF Files

PDFs are organized in daily folders:

```
pdf-files/
├── 25-12-2025/
│   ├── invoice-123__25-12-2025_14-30-45.pdf
│   ├── report-456__25-12-2025_15-45-00.pdf
│   └── order-789__error__25-12-2025_16-00-30.png
├── 26-12-2025/
│   └── ...
```

## Filename Formats

**PDF filename format:**

```
{requestedKey}__{dd}-{mm}-{yyyy}_{hh}-{mm}-{ss}.pdf
```

Example: `invoice-123__25-12-2025_14-30-45.pdf`

**Error screenshot format:**

```
{requestedKey}__error__{dd}-{mm}-{yyyy}_{hh}-{mm}-{ss}.png
```

Example: `order-789__error__25-12-2025_16-00-30.png`

## Error Screenshots

When PDF generation fails, the service automatically captures a screenshot of the page state for debugging. The screenshot is saved in the same daily folder as the PDF would have been.

The error message will include the screenshot path:

```
Timeout 30000ms exceeded (screenshot: pdf-files/25-12-2025/my-key__error__25-12-2025_14-30-45.png)
```
