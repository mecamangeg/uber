import { test, expect } from '@playwright/test';

test.describe('Dev Bypass Auth — Local Testing', () => {
  test('should redirect to /app/home (not welcome) with dev bypass', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/app/home', { timeout: 10000 });
  });

  test('should show mock user greeting on home', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForURL('**/app/home', { timeout: 10000 });
    const greeting = page.locator('.home__greeting');
    await expect(greeting).toContainText('Welcome Dev');
  });

  test('should display map container', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForURL('**/app/home', { timeout: 10000 });
    await expect(page.locator('.home__map-container')).toBeVisible();
  });

  test('should show recent rides section with mock data', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForURL('**/app/home', { timeout: 10000 });
    const titles = page.locator('.home__section-title');
    await expect(titles.last()).toContainText('Recent Rides');
  });

  test('should navigate through all tabs', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForURL('**/app/home', { timeout: 10000 });

    await expect(page.locator('nav.tab-bar')).toBeVisible();

    // Rides
    await page.locator('a[aria-label="Rides"]').click();
    await page.waitForURL('**/app/rides');
    await expect(page.locator('.rides__title')).toContainText('All Rides');

    // Chat
    await page.locator('a[aria-label="Chat"]').click();
    await page.waitForURL('**/app/chat');
    await expect(page.locator('.chat__empty-heading')).toContainText('No Messages Yet');

    // Profile
    await page.locator('a[aria-label="Profile"]').click();
    await page.waitForURL('**/app/profile');
    await expect(page.locator('.profile__title')).toContainText('My profile');

    // Back to Home
    await page.locator('a[aria-label="Home"]').click();
    await page.waitForURL('**/app/home');
  });

  test('should show mock profile data', async ({ page }) => {
    await page.goto('/app/profile');
    await page.waitForURL('**/app/profile', { timeout: 10000 });
    await expect(page.locator('.profile__title')).toContainText('My profile');
    const inputs = page.locator('.input-field__input');
    await expect(inputs).toHaveCount(4);
  });

  test('should navigate sign-out and go to sign-in', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForURL('**/app/home', { timeout: 10000 });
    await page.locator('button[aria-label="Sign out"]').click();
    await page.waitForURL('**/auth/sign-in');
  });

  test('auth pages still render correctly', async ({ page }) => {
    await page.goto('/auth/welcome');
    await expect(page.locator('.welcome__title')).toContainText('The perfect ride');

    await page.goto('/auth/sign-in');
    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
  });

  test('sign-in with dev bypass should redirect to home', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.locator('#signin-email').fill('test@test.com');
    await page.locator('#signin-password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/app/home', { timeout: 10000 });
    await expect(page.locator('.home__greeting')).toContainText('Welcome Dev');
  });
});
