import { test, expect } from '@playwright/test';

test('logged-out visitor is redirected to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
