import { test, expect, type Page } from '@playwright/test';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
}

test('admin can open /dashboard/admin', async ({ page }) => {
  await loginAs(page, 'admin@maplegrove.test', 'password123');
  await page.goto('/dashboard/admin');
  await expect(page).toHaveURL(/\/dashboard\/admin/);
});

test('resident is redirected away from /dashboard/admin', async ({ page }) => {
  await loginAs(page, 'resident@maplegrove.test', 'password123');
  await page.goto('/dashboard/admin');
  await expect(page).toHaveURL('/dashboard');
});
