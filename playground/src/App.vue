<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import axios from 'axios'
import OptionsPanel from './components/OptionsPanel.vue'
import HttpOptions from './components/HttpOptions.vue'

const STORAGE_KEY = 'pdf-playground-server'
const POLL_INTERVAL = 500

type ConversionType = 'html' | 'url'
type OutputFormat = 'pdf' | 'screenshot'
type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

interface JobState {
  requestedKey: string
  status: JobStatus
  progress?: number
  error?: string
}

const conversionType = ref<ConversionType>('html')
const outputFormat = ref<OutputFormat>('pdf')
const serverUrl = ref('http://localhost:3000')
const htmlContent = ref(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; }
    h1 { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Hello from PDF Playground!</h1>
  <p>This is a sample HTML document.</p>
</body>
</html>`)
const urlInput = ref('https://example.com')
const isLoading = ref(false)
const error = ref('')
const result = ref<{ url: string; type: string } | null>(null)
const isDark = ref(false)
const jobState = ref<JobState | null>(null)
const showOptions = ref(false)
const optionsPanelRef = ref<InstanceType<typeof OptionsPanel> | null>(null)
const httpOptionsRef = ref<InstanceType<typeof HttpOptions> | null>(null)

const baseUrl = () => serverUrl.value.replace(/\/$/, '')

const generateRequestedKey = () => {
  return `playground-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

watch(serverUrl, (val) => {
  localStorage.setItem(STORAGE_KEY, val)
})

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    serverUrl.value = saved
  }

  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    isDark.value = e.matches
  })
})

const toggleTheme = () => {
  isDark.value = !isDark.value
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const pollJobStatus = async (requestedKey: string, format: OutputFormat): Promise<void> => {
  const statusEndpoint =
    format === 'pdf'
      ? `${baseUrl()}/api/pdf/status/${requestedKey}`
      : `${baseUrl()}/api/screenshot/status/${requestedKey}`

  while (true) {
    const response = await axios.get<JobState>(statusEndpoint)
    jobState.value = response.data

    if (response.data.status === 'completed') {
      return
    }

    if (response.data.status === 'failed' || response.data.status === 'cancelled') {
      throw new Error(response.data.error || `Job ${response.data.status}`)
    }

    await sleep(POLL_INTERVAL)
  }
}

const downloadResult = async (requestedKey: string, format: OutputFormat): Promise<Blob> => {
  const downloadEndpoint =
    format === 'pdf'
      ? `${baseUrl()}/api/pdf/download/${requestedKey}`
      : `${baseUrl()}/api/screenshot/download/${requestedKey}`

  const response = await axios.get(downloadEndpoint, { responseType: 'blob' })
  return response.data
}

const generateOutput = async () => {
  isLoading.value = true
  error.value = ''
  result.value = null
  jobState.value = null

  try {
    const requestedKey = generateRequestedKey()
    const format = outputFormat.value

    const base = format === 'pdf' ? '/api/pdf' : '/api/screenshot'
    const path = conversionType.value === 'html' ? `${base}/from-html` : `${base}/from-url`
    const endpoint = `${baseUrl()}${path}`

    const options = optionsPanelRef.value?.buildRequestOptions() ?? {}
    const httpOptions = httpOptionsRef.value?.buildHttpOptions() ?? {}

    // Merge HTTP options into browser options
    if (Object.keys(httpOptions).length > 0) {
      const existingBrowser = (options.browser as Record<string, unknown>) ?? {}
      options.browser = { ...existingBrowser, ...httpOptions }
    }

    const payload =
      conversionType.value === 'html'
        ? { requestedKey, html: htmlContent.value, reCreate: true, options }
        : { requestedKey, url: urlInput.value, reCreate: true, options }

    const queueResponse = await axios.post(endpoint, payload)
    jobState.value = {
      requestedKey: queueResponse.data.requestedKey,
      status: queueResponse.data.status,
    }

    await pollJobStatus(requestedKey, format)

    const blob = await downloadResult(requestedKey, format)
    result.value = {
      url: URL.createObjectURL(blob),
      type: format,
    }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const data = err.response.data
      if (data instanceof Blob) {
        const text = await data.text()
        try {
          const json = JSON.parse(text)
          error.value = json.message || json.error || 'Request failed'
        } catch {
          error.value = text || 'Request failed'
        }
      } else {
        error.value = data.message || data.error || 'Request failed'
      }
    } else {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="app" :class="{ dark: isDark }">
    <header>
      <h1>PDF Service Playground</h1>
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
        <span v-if="isDark">&#9788;</span>
        <span v-else>&#9790;</span>
      </button>
    </header>

    <main>
      <section class="server-section">
        <label>Server URL</label>
        <input
          v-model="serverUrl"
          type="url"
          placeholder="http://localhost:3000"
          class="server-input"
        />
      </section>

      <section class="controls">
        <div class="control-group">
          <label>Source</label>
          <div class="button-group">
            <button :class="{ active: conversionType === 'html' }" @click="conversionType = 'html'">
              HTML
            </button>
            <button :class="{ active: conversionType === 'url' }" @click="conversionType = 'url'">
              URL
            </button>
          </div>
        </div>

        <div class="control-group">
          <label>Output</label>
          <div class="button-group">
            <button :class="{ active: outputFormat === 'pdf' }" @click="outputFormat = 'pdf'">
              PDF
            </button>
            <button
              :class="{ active: outputFormat === 'screenshot' }"
              @click="outputFormat = 'screenshot'"
            >
              Screenshot
            </button>
          </div>
        </div>
      </section>

      <section class="input-section">
        <div v-if="conversionType === 'html'" class="input-wrapper">
          <label>HTML Content</label>
          <textarea v-model="htmlContent" placeholder="Enter HTML content..." />
        </div>

        <div v-else class="input-wrapper">
          <label>URL</label>
          <input v-model="urlInput" type="url" placeholder="https://example.com" />
        </div>
      </section>

      <section class="options-section">
        <button class="options-toggle" @click="showOptions = !showOptions">
          <span class="options-toggle-icon">{{ showOptions ? '▼' : '▶' }}</span>
          Options
        </button>
        <OptionsPanel v-show="showOptions" ref="optionsPanelRef" :output-format="outputFormat" />
        <HttpOptions v-show="showOptions" ref="httpOptionsRef" />
      </section>

      <button class="generate-btn" @click="generateOutput" :disabled="isLoading">
        <span v-if="isLoading" class="spinner"></span>
        {{ isLoading ? 'Generating...' : `Generate ${outputFormat.toUpperCase()}` }}
      </button>

      <div v-if="isLoading && jobState" class="status">
        <span class="status-label">Status:</span>
        <span :class="['status-value', jobState.status]">{{ jobState.status }}</span>
        <span v-if="jobState.requestedKey" class="status-key">{{ jobState.requestedKey }}</span>
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <section v-if="result" class="result">
        <div class="result-header">
          <h2>Result</h2>
          <a :href="result.url" :download="`output.${result.type === 'pdf' ? 'pdf' : 'png'}`" class="download-btn">
            Download
          </a>
        </div>
        <iframe v-if="result.type === 'pdf'" :src="result.url" class="preview-frame" />
        <img v-else :src="result.url" class="preview-image" alt="Screenshot result" />
      </section>
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  --bg: #f5f5f5;
  --bg-secondary: #ffffff;
  --text: #1e1e1e;
  --text-secondary: #6e6e6e;
  --border: #e0e0e0;
  --primary: #fcc72b;
  --primary-hover: #e5b526;
  --primary-text: #1e1e1e;
  --error: #f14c4c;
  --error-bg: #fef2f2;

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, sans-serif;
  transition: background 0.2s, color 0.2s;
}

.app.dark {
  --bg: #1e1e1e;
  --bg-secondary: #252526;
  --text: #cccccc;
  --text-secondary: #8c8c8c;
  --border: #3c3c3c;
  --error-bg: #3c1e1e;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-secondary);
}

header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.theme-toggle {
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.theme-toggle:hover {
  background: var(--border);
}

main {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.server-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.server-section label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.server-input {
  font-family: ui-monospace, monospace;
}

.controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.button-group {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.button-group button:not(:last-child) {
  border-right: 1px solid var(--border);
}

.button-group button:hover {
  background: var(--border);
}

.button-group button.active {
  background: var(--primary);
  color: var(--primary-text);
}

.input-section {
  margin-bottom: 1.5rem;
}

.options-section {
  margin-bottom: 1.5rem;
}

.options-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.options-toggle:hover {
  background: var(--border);
}

.options-toggle-icon {
  font-size: 0.625rem;
  color: var(--text-secondary);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-wrapper label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

textarea,
input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

textarea {
  min-height: 200px;
}

textarea:focus,
input:focus {
  outline: none;
  border-color: var(--primary);
}

.generate-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: var(--primary-text);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.generate-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: var(--primary-text);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-label {
  color: var(--text-secondary);
}

.status-value {
  font-weight: 500;
  text-transform: capitalize;
}

.status-value.queued {
  color: var(--text-secondary);
}

.status-value.processing {
  color: var(--primary);
}

.status-value.completed {
  color: #4ade80;
}

.status-key {
  margin-left: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.error {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--error-bg);
  color: var(--error);
  font-size: 0.875rem;
}

.result {
  margin-top: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

.download-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.download-btn:hover {
  background: var(--border);
}

.preview-frame {
  width: 100%;
  height: 500px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
}

.preview-image {
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
}

@media (max-width: 600px) {
  .controls {
    flex-direction: column;
    gap: 1rem;
  }

  header {
    padding: 1rem;
  }

  main {
    padding: 1rem;
  }
}
</style>
