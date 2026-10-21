import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://didaktik.dev',
  // Скрипты всегда отдельными файлами: так работает CSP со script-src 'self' без 'unsafe-inline'
  vite: { build: { assetsInlineLimit: 0 } },
});
