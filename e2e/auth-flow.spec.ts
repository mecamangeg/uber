import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should redirect to welcome page on root visit', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/auth\/welcome/);
  });

  test('should display onboarding carousel on welcome page', async ({ page }) => {
    await page.goto('/auth/welcome');
    await expect(page.locator('.welcome__title')).toBeVisible();
    await expect(page.locator('.welcome__title')).toContainText('The perfect ride');
    await expect(page.locator('.welcome__dot')).toHaveCount(3);
  });

  test('should advance through onboarding slides', async ({ page }) => {
    await page.goto('/auth/welcome');

    // First slide
    await expect(page.locator('.welcome__title')).toContainText('The perfect ride');

    // Click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.welcome__title')).toContainText('Best car in your hands');

    // Click Next again
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('.welcome__title')).toContainText('Your ride, your way');

    // Should now show "Get Started"
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('should navigate to sign-up on skip', async ({ page }) => {
    await page.goto('/auth/welcome');
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page).toHaveURL(/auth\/sign-up/);
  });

  test('should display sign-in form', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.locator('.auth-page__hero-title')).toContainText('Welcome');
    await expect(page.locator('#signin-email')).toBeVisible();
    await expect(page.locator('#signin-password')).toBeVisible();
  });

  test('should show validation errors on empty sign-in submit', async ({ page }) => {
    await page.goto('/auth/sign-in');

    // Touch the fields and leave empty
    await page.locator('#signin-email').click();
    await page.locator('#signin-password').click();
    await page.locator('#signin-email').click(); // blur password

    await expect(page.locator('#signin-email-error')).toBeVisible();
    await expect(page.locator('#signin-password-error')).toBeVisible();
  });

  test('should display sign-up form with three fields', async ({ page }) => {
    await page.goto('/auth/sign-up');
    await expect(page.locator('.auth-page__hero-title')).toContainText('Create Your Account');
    // Name, email, password inputs
    const inputs = page.locator('.form-field__input');
    await expect(inputs).toHaveCount(3);
  });

  test('should link between sign-in and sign-up', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/auth\/sign-up/);

    await page.getByRole('link', { name: 'Log In' }).click();
    await expect(page).toHaveURL(/auth\/sign-in/);
  });

  test('should redirect unauthenticated user from /app/home to welcome', async ({ page }) => {
    await page.goto('/app/home');
    await expect(page).toHaveURL(/auth\/welcome/);
  });
});
