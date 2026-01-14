# Playground App

A Vue.js playground app is included for testing the PDF and Screenshot APIs interactively.

## Setup

```bash
cd playground
npm install
npm run dev
```

The playground runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:3000`.

::: tip
Make sure the PDF service is running (`npm run dev` in the root directory) before using the playground.
:::

## Features

- **Server URL Configuration** - Connect to any instance of the PDF service
- **Source Selection** - Generate from HTML content or URL
- **Output Format** - Choose between PDF or Screenshot
- **Browser Options** - Configure viewport, timeout, wait conditions, animations
- **PDF Options** - Set format, orientation, margins, scale, background printing
- **Screenshot Options** - Choose PNG/JPEG, quality, full page capture, transparent background
- **Live Preview** - View generated PDFs and screenshots inline
- **Download** - Download generated files directly
- **Dark/Light Theme** - Automatic theme detection with manual toggle

## Tech Stack

- Vue 3 with Composition API
- Vite for development and building
- Axios for API requests
- TypeScript
- CSS Variables for theming

## Project Structure

```
playground/
├── src/
│   ├── main.ts              # App entry point
│   ├── App.vue              # Main application component
│   └── components/
│       └── OptionsPanel.vue # Browser/PDF/Screenshot options
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Configuration Persistence

All settings are automatically saved to localStorage:

| Key | Description |
|-----|-------------|
| `pdf-playground-server` | Server URL |
| `pdf-playground-options` | Browser, PDF, and Screenshot options |

## Available Options

### Browser Options

| Option | Description |
|--------|-------------|
| Viewport Width | Browser viewport width (320-7680px) |
| Viewport Height | Browser viewport height (240-4320px) |
| Timeout | Maximum wait time in milliseconds |
| Wait After | Additional wait time after page load |
| Wait For Selector | CSS selector to wait for before capture |
| Disable Animations | Disable CSS animations and transitions |

### PDF Options

| Option | Description |
|--------|-------------|
| Format | Paper size (A4, A3, A5, Letter, Legal) |
| Scale | Content scale factor (0.1-2) |
| Landscape | Landscape orientation |
| Print Background | Include background colors/images |
| Margins | Top, right, bottom, left margins |

### Screenshot Options

| Option | Description |
|--------|-------------|
| Type | Image format (PNG or JPEG) |
| Quality | JPEG quality (0-100%, only for JPEG) |
| Full Page | Capture entire scrollable page |
| Omit Background | Transparent background (PNG only) |

## Building for Production

```bash
cd playground
npm run build
```

The built files will be in `playground/dist/` and can be served by any static file server.

## Development

### Adding New Options

1. Update the interfaces in `OptionsPanel.vue`
2. Add default values to the defaults objects
3. Add form fields in the template
4. Update `buildRequestOptions()` to include the new option
