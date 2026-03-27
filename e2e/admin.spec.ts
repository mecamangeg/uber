import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('should navigate to /admin/dashboard', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await expect(page.locator('.admin-page__title')).toContainText('Dashboard');
  });

  test('should display stat cards with mock data', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
    await expect(statCards.first()).toContainText('Drivers');
  });

  test('should show sidebar navigation links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await expect(page.locator('.admin-sidebar__title')).toContainText('Ryde Admin');
    await expect(page.locator('a.admin-nav__link')).toHaveCount(4);
  });

  test('should navigate to drivers page and show table', async ({ page }) => {
    await page.goto('/admin/drivers');
    await page.waitForURL('**/admin/drivers', { timeout: 10000 });
    await expect(page.locator('.admin-page__title')).toContainText('Drivers');
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(3); // 3 mock drivers
  });

  test('should open add driver form', async ({ page }) => {
    await page.goto('/admin/drivers');
    await page.waitForURL('**/admin/drivers', { timeout: 10000 });
    await page.getByRole('button', { name: /add driver/i }).click();
    await expect(page.locator('.modal__title')).toContainText('Add Driver');
    await expect(page.locator('input[formcontrolname="first_name"]')).toBeVisible();
    await expect(page.locator('input[formcontrolname="last_name"]')).toBeVisible();
  });

  test('should create a new driver via form', async ({ page }) => {
    await page.goto('/admin/drivers');
    await page.waitForURL('**/admin/drivers', { timeout: 10000 });
    const initialCount = await page.locator('.admin-table tbody tr').count();

    await page.getByRole('button', { name: /add driver/i }).click();
    await page.locator('input[formcontrolname="first_name"]').fill('Pedro');
    await page.locator('input[formcontrolname="last_name"]').fill('Garcia');
    await page.locator('input[formcontrolname="car_seats"]').clear();
    await page.locator('input[formcontrolname="car_seats"]').fill('6');

    await page.getByRole('button', { name: /^create$/i }).click();
    // Modal should close and table should have one more row
    await expect(page.locator('.modal')).toBeHidden();
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(initialCount + 1);
    await expect(page.locator('.admin-table')).toContainText('Pedro');
  });

  test('should open edit form with prefilled data', async ({ page }) => {
    await page.goto('/admin/drivers');
    await page.waitForURL('**/admin/drivers', { timeout: 10000 });
    await page.locator('.action-btn--edit').first().click();
    await expect(page.locator('.modal__title')).toContainText('Edit Driver');
    await expect(page.locator('input[formcontrolname="first_name"]')).toHaveValue('Carlos');
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.goto('/admin/drivers');
    await page.waitForURL('**/admin/drivers', { timeout: 10000 });
    await page.locator('.action-btn--delete').first().click();
    await expect(page.locator('.modal__title')).toContainText('Delete Driver');
    await expect(page.locator('.modal--sm')).toContainText('Carlos Santos');
  });

  test('should navigate to rides page and show table', async ({ page }) => {
    await page.goto('/admin/rides');
    await page.waitForURL('**/admin/rides', { timeout: 10000 });
    await expect(page.locator('.admin-page__title')).toContainText('Rides');
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(3); // 3 mock rides
    await expect(page.locator('.badge--paid')).toHaveCount(2);
    await expect(page.locator('.badge--pending')).toHaveCount(1);
  });

  test('should navigate to users page and show table', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForURL('**/admin/users', { timeout: 10000 });
    await expect(page.locator('.admin-page__title')).toContainText('Users');
    await expect(page.locator('.admin-table tbody tr')).toHaveCount(2); // 2 mock users
  });

  test('should navigate between all admin pages via sidebar', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });

    // Drivers
    await page.locator('a.admin-nav__link', { hasText: 'Drivers' }).click();
    await page.waitForURL('**/admin/drivers');
    await expect(page.locator('.admin-page__title')).toContainText('Drivers');

    // Rides
    await page.locator('a.admin-nav__link', { hasText: 'Rides' }).click();
    await page.waitForURL('**/admin/rides');
    await expect(page.locator('.admin-page__title')).toContainText('Rides');

    // Users
    await page.locator('a.admin-nav__link', { hasText: 'Users' }).click();
    await page.waitForURL('**/admin/users');
    await expect(page.locator('.admin-page__title')).toContainText('Users');

    // Back to Dashboard
    await page.locator('a.admin-nav__link', { hasText: 'Dashboard' }).click();
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('.admin-page__title')).toContainText('Dashboard');
  });

  test('should navigate back to app via sidebar button', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    await page.locator('.admin-nav__link--back').click();
    await page.waitForURL('**/app/home', { timeout: 10000 });
  });
});
