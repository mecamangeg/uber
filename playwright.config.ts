import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4300',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx ng serve --configuration development --port 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
