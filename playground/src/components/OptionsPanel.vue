<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue'

type OutputFormat = 'pdf' | 'screenshot'

interface BrowserOptions {
  viewportWidth: number
  viewportHeight: number
  timeout: number
  waitAfter: number
  waitForSelector: string
  disableAnimations: boolean
  colorScheme: 'light' | 'dark' | 'no-preference' | ''
}

interface PdfOptions {
  format: string
  landscape: boolean
  printBackground: boolean
  scale: number
  marginTop: string
  marginRight: string
  marginBottom: string
  marginLeft: string
}

interface ScreenshotOptions {
  type: 'png' | 'jpeg'
  quality: number
  fullPage: boolean
  omitBackground: boolean
}

const props = defineProps<{
  outputFormat: OutputFormat
}>()

const STORAGE_KEY = 'pdf-playground-options'

const defaultBrowserOptions: BrowserOptions = {
  viewportWidth: 1280,
  viewportHeight: 720,
  timeout: 30000,
  waitAfter: 0,
  waitForSelector: '',
  disableAnimations: false,
  colorScheme: '',
}

const defaultPdfOptions: PdfOptions = {
  format: 'A4',
  landscape: false,
  printBackground: true,
  scale: 1,
  marginTop: '20px',
  marginRight: '20px',
  marginBottom: '20px',
  marginLeft: '20px',
}

const defaultScreenshotOptions: ScreenshotOptions = {
  type: 'png',
  quality: 80,
  fullPage: true,
  omitBackground: false,
}

const browserOptions = reactive<BrowserOptions>({ ...defaultBrowserOptions })
const pdfOptions = reactive<PdfOptions>({ ...defaultPdfOptions })
const screenshotOptions = reactive<ScreenshotOptions>({ ...defaultScreenshotOptions })

const saveOptions = () => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ browser: browserOptions, pdf: pdfOptions, screenshot: screenshotOptions })
  )
}

const loadOptions = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.browser) Object.assign(browserOptions, parsed.browser)
      if (parsed.pdf) Object.assign(pdfOptions, parsed.pdf)
      if (parsed.screenshot) Object.assign(screenshotOptions, parsed.screenshot)
    } catch {
      // ignore
    }
  }
}

const resetOptions = () => {
  Object.assign(browserOptions, defaultBrowserOptions)
  Object.assign(pdfOptions, defaultPdfOptions)
  Object.assign(screenshotOptions, defaultScreenshotOptions)
  saveOptions()
}

watch([browserOptions, pdfOptions, screenshotOptions], saveOptions, { deep: true })

onMounted(() => {
  loadOptions()
})

const buildRequestOptions = () => {
  const options: Record<string, unknown> = {
    browser: {
      viewport: {
        width: browserOptions.viewportWidth,
        height: browserOptions.viewportHeight,
      },
      timeout: browserOptions.timeout,
      ...(browserOptions.waitAfter > 0 && { waitAfter: browserOptions.waitAfter }),
      ...(browserOptions.waitForSelector && { waitForSelector: browserOptions.waitForSelector }),
      ...(browserOptions.disableAnimations && { disableAnimations: true }),
      ...(browserOptions.colorScheme && { colorScheme: browserOptions.colorScheme }),
    },
  }

  if (props.outputFormat === 'pdf') {
    options.pdf = {
      format: pdfOptions.format,
      landscape: pdfOptions.landscape,
      printBackground: pdfOptions.printBackground,
      scale: pdfOptions.scale,
      margin: {
        top: pdfOptions.marginTop,
        right: pdfOptions.marginRight,
        bottom: pdfOptions.marginBottom,
        left: pdfOptions.marginLeft,
      },
    }
  } else {
    options.screenshot = {
      type: screenshotOptions.type,
      fullPage: screenshotOptions.fullPage,
      omitBackground: screenshotOptions.omitBackground,
      ...(screenshotOptions.type === 'jpeg' && { quality: screenshotOptions.quality }),
    }
  }

  return options
}

defineExpose({
  buildRequestOptions,
})
</script>

<template>
  <div class="options-panel">
    <div class="options-header">
      <h3>Browser Options</h3>
    </div>
    <div class="options-grid">
      <div class="option-field">
        <label>Viewport Width</label>
        <input type="number" v-model.number="browserOptions.viewportWidth" min="320" max="7680" />
      </div>
      <div class="option-field">
        <label>Viewport Height</label>
        <input type="number" v-model.number="browserOptions.viewportHeight" min="240" max="4320" />
      </div>
      <div class="option-field">
        <label>Timeout (ms)</label>
        <input type="number" v-model.number="browserOptions.timeout" min="1000" max="120000" step="1000" />
      </div>
      <div class="option-field">
        <label>Wait After (ms)</label>
        <input type="number" v-model.number="browserOptions.waitAfter" min="0" max="60000" step="100" />
      </div>
      <div class="option-field full-width">
        <label>Wait For Selector</label>
        <input type="text" v-model="browserOptions.waitForSelector" placeholder=".my-element" />
      </div>
      <div class="option-field checkbox">
        <label>
          <input type="checkbox" v-model="browserOptions.disableAnimations" />
          Disable Animations
        </label>
      </div>
      <div class="option-field">
        <label>Color Scheme</label>
        <select v-model="browserOptions.colorScheme">
          <option value="">Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="no-preference">No Preference</option>
        </select>
      </div>
    </div>

    <div class="options-header">
      <h3>{{ outputFormat === 'pdf' ? 'PDF Options' : 'Screenshot Options' }}</h3>
    </div>

    <div v-if="outputFormat === 'pdf'" class="options-grid">
      <div class="option-field">
        <label>Format</label>
        <select v-model="pdfOptions.format">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="A5">A5</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
        </select>
      </div>
      <div class="option-field">
        <label>Scale</label>
        <input type="number" v-model.number="pdfOptions.scale" min="0.1" max="2" step="0.1" />
      </div>
      <div class="option-field checkbox">
        <label>
          <input type="checkbox" v-model="pdfOptions.landscape" />
          Landscape
        </label>
      </div>
      <div class="option-field checkbox">
        <label>
          <input type="checkbox" v-model="pdfOptions.printBackground" />
          Print Background
        </label>
      </div>
      <div class="option-field">
        <label>Margin Top</label>
        <input type="text" v-model="pdfOptions.marginTop" placeholder="20px" />
      </div>
      <div class="option-field">
        <label>Margin Right</label>
        <input type="text" v-model="pdfOptions.marginRight" placeholder="20px" />
      </div>
      <div class="option-field">
        <label>Margin Bottom</label>
        <input type="text" v-model="pdfOptions.marginBottom" placeholder="20px" />
      </div>
      <div class="option-field">
        <label>Margin Left</label>
        <input type="text" v-model="pdfOptions.marginLeft" placeholder="20px" />
      </div>
    </div>

    <div v-else class="options-grid">
      <div class="option-field">
        <label>Type</label>
        <select v-model="screenshotOptions.type">
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
        </select>
      </div>
      <div class="option-field" v-if="screenshotOptions.type === 'jpeg'">
        <label>Quality ({{ screenshotOptions.quality }}%)</label>
        <input type="range" v-model.number="screenshotOptions.quality" min="0" max="100" />
      </div>
      <div class="option-field checkbox">
        <label>
          <input type="checkbox" v-model="screenshotOptions.fullPage" />
          Full Page
        </label>
      </div>
      <div class="option-field checkbox">
        <label>
          <input type="checkbox" v-model="screenshotOptions.omitBackground" />
          Omit Background
        </label>
      </div>
    </div>

    <button class="reset-btn" @click="resetOptions">Reset to Defaults</button>
  </div>
</template>

<style scoped>
.options-panel {
  margin-top: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.options-header {
  margin-bottom: 0.75rem;
}

.options-header:not(:first-child) {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.options-header h3 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-field.full-width {
  grid-column: span 2;
}

.option-field.checkbox {
  flex-direction: row;
  align-items: center;
}

.option-field.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.option-field.checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.option-field > label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.option-field input,
.option-field select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.option-field input:focus,
.option-field select:focus {
  outline: none;
  border-color: var(--primary);
}

.option-field input[type="range"] {
  padding: 0;
  height: 6px;
  cursor: pointer;
}

.option-field select {
  cursor: pointer;
}

.reset-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.reset-btn:hover {
  background: var(--border);
  color: var(--text);
}

@media (max-width: 600px) {
  .options-grid {
    grid-template-columns: 1fr;
  }

  .option-field.full-width {
    grid-column: span 1;
  }
}
</style>
