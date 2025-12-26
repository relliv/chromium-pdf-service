import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Chromium PDF Service',
  description: 'A PDF generation service built with Fastify, TypeScript, Playwright, and Docker',
  base: '/chromium-pdf-service/',

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://fav.farm/📜' }]],

  themeConfig: {
    logo: 'https://fav.farm/📜',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/endpoints' },
      { text: 'Configuration', link: '/config/settings' },
      { text: 'Development', link: '/development/' },
      {
        text: 'GitHub',
        link: 'https://github.com/relliv/chromium-pdf-service',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Docker Setup', link: '/guide/docker' },
            { text: 'Docker Networking', link: '/guide/docker-networking' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Queue System', link: '/guide/queue' },
            { text: 'File Storage', link: '/guide/file-storage' },
            { text: 'Logging', link: '/guide/logging' },
            { text: 'Security', link: '/guide/security' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Endpoints', link: '/api/endpoints' },
            { text: 'Examples', link: '/api/examples' },
            { text: 'Browser Options', link: '/api/browser-options' },
            { text: 'PDF Options', link: '/api/pdf-options' },
            { text: 'Queue Options', link: '/api/queue-options' },
          ],
        },
      ],
      '/config/': [
        {
          text: 'Configuration',
          items: [
            { text: 'Settings', link: '/config/settings' },
            { text: 'Environment Variables', link: '/config/env-variables' },
          ],
        },
      ],
      '/development/': [
        {
          text: 'Development',
          items: [
            { text: 'Getting Started', link: '/development/' },
            { text: 'Docker Build & Test', link: '/development/docker-build' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/relliv/chromium-pdf-service' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025',
    },

    search: {
      provider: 'local',
    },
  },
});
