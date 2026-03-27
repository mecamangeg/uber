import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have skip-to-content link', async ({ page }) => {
    await page.goto('/auth/welcome');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should have main content landmark', async ({ page }) => {
    await page.goto('/auth/welcome');
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should catch-all unknown routes to welcome', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page).toHaveURL(/auth\/welcome/);
  });
});
