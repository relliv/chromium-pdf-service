---
layout: home

hero:
  name: Chromium PDF Service
  text: PDF Generation Made Simple
  tagline: Generate PDFs from HTML, URLs, or files with Fastify, Playwright, and Docker
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/relliv/chromium-pdf-service

features:
  - icon: 📄
    title: Multiple Input Sources
    details: Generate PDFs from HTML content, URLs, or uploaded HTML files
  - icon: 📋
    title: Queue System
    details: Built-in job queue with priority support, status tracking, and cancellation
  - icon: 💾
    title: Queue Persistence
    details: Jobs survive service restarts with automatic state recovery
  - icon: 🔄
    title: Idempotent Requests
    details: Same requestedKey returns existing PDF, or use reCreate to force regeneration
  - icon: 📐
    title: Custom Dimensions
    details: Use predefined formats (A4, Letter) or custom width/height
  - icon: 🎬
    title: Disable Animations
    details: Option to disable CSS animations for reliable PDF rendering
  - icon: 📸
    title: Error Screenshots
    details: Captures page screenshot on failure for debugging
  - icon: 🐳
    title: Docker Ready
    details: Production-ready Docker configuration with Chromium
---
