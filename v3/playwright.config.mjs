import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';
export default defineConfig({
  testDir: './tests',
  testMatch: 'browser.spec.mjs',
  workers: 1,
  timeout: 90000,
  reporter: [
    ['list'],
    ['json', { outputFile: 'v3/test-results/browser.json' }],
  ],
  outputDir: './test-results/browser',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:8787',
    viewport: { width: 1440, height: 1100 },
    headless: true,
    launchOptions: {
      executablePath: await chromium.executablePath(),
      args: chromium.args.filter(
        (x) =>
          ![
            '--single-process',
            '--disable-web-security',
            '--allow-running-insecure-content',
          ].includes(x),
      ),
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
