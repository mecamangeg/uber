import { test, expect } from '@playwright/test';

test('capture console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(5000);

  const html = await page.content();
  console.log('URL:', page.url());
  console.log('Body length:', html.length);
  console.log('Has app-root:', html.includes('app-root'));
  console.log('Console errors:', JSON.stringify(errors, null, 2));
});
