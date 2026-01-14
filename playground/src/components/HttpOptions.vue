<script setup lang="ts">
import { reactive, watch, onMounted } from 'vue'

interface HttpHeader {
  key: string
  value: string
}

interface HttpOptionsState {
  userAgent: string
  headers: HttpHeader[]
}

const STORAGE_KEY = 'pdf-playground-http-options'

const defaultOptions: HttpOptionsState = {
  userAgent: '',
  headers: [],
}

const options = reactive<HttpOptionsState>({ ...defaultOptions, headers: [] })

const saveOptions = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
}

const loadOptions = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.userAgent !== undefined) options.userAgent = parsed.userAgent
      if (parsed.headers) options.headers = parsed.headers
    } catch {
      // ignore
    }
  }
}

const resetOptions = () => {
  options.userAgent = ''
  options.headers = []
  saveOptions()
}

const addHeader = () => {
  options.headers.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  options.headers.splice(index, 1)
}

watch(options, saveOptions, { deep: true })

onMounted(() => {
  loadOptions()
})

const buildHttpOptions = () => {
  const result: Record<string, unknown> = {}

  if (options.userAgent.trim()) {
    result.userAgent = options.userAgent.trim()
  }

  const validHeaders = options.headers.filter((h) => h.key.trim() && h.value.trim())
  if (validHeaders.length > 0) {
    result.extraHTTPHeaders = validHeaders.reduce(
      (acc, h) => {
        acc[h.key.trim()] = h.value.trim()
        return acc
      },
      {} as Record<string, string>
    )
  }

  return result
}

defineExpose({
  buildHttpOptions,
})
</script>

<template>
  <div class="http-options">
    <div class="options-header">
      <h3>HTTP Options</h3>
    </div>

    <div class="options-content">
      <div class="option-field full-width">
        <label>User Agent</label>
        <input
          type="text"
          v-model="options.userAgent"
          placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) ..."
        />
      </div>

      <div class="headers-section">
        <div class="headers-header">
          <label>Extra HTTP Headers</label>
          <button type="button" class="add-header-btn" @click="addHeader">+ Add Header</button>
        </div>

        <div v-if="options.headers.length === 0" class="no-headers">
          No custom headers configured
        </div>

        <div v-for="(header, index) in options.headers" :key="index" class="header-row">
          <input
            type="text"
            v-model="header.key"
            placeholder="Header name"
            class="header-key"
          />
          <input
            type="text"
            v-model="header.value"
            placeholder="Header value"
            class="header-value"
          />
          <button type="button" class="remove-header-btn" @click="removeHeader(index)">
            &times;
          </button>
        </div>
      </div>
    </div>

    <button class="reset-btn" @click="resetOptions">Reset HTTP Options</button>
  </div>
</template>

<style scoped>
.http-options {
  margin-top: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
}

.options-header {
  margin-bottom: 0.75rem;
}

.options-header h3 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.options-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-field.full-width {
  width: 100%;
}

.option-field > label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.option-field input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.option-field input:focus {
  outline: none;
  border-color: var(--primary);
}

.headers-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.headers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.headers-header label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.add-header-btn {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.add-header-btn:hover {
  background: var(--border);
  color: var(--text);
}

.no-headers {
  padding: 0.75rem;
  border: 1px dashed var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  text-align: center;
}

.header-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.header-key {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.header-value {
  flex: 2;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text);
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}

.header-key:focus,
.header-value:focus {
  outline: none;
  border-color: var(--primary);
}

.remove-header-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-header-btn:hover {
  background: var(--error-bg);
  border-color: var(--error);
  color: var(--error);
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
  .header-row {
    flex-wrap: wrap;
  }

  .header-key,
  .header-value {
    flex: 1 1 100%;
  }

  .remove-header-btn {
    margin-left: auto;
  }
}
</style>
