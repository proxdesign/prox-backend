import { test, expect } from '@playwright/test';

test.describe('Landing Page Tiles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays all four tiles on landing page', async ({ page }) => {
    await expect(page.getByRole('button', { name: /solve a problem/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /explore/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /buy a gift/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /quick fix/i })).toBeVisible();
  });

  test('Solve a Problem tile shows clarifying question', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();

    // Wait for chat interface to appear and show clarifying question
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Should ask about room/space
    await expect(page.getByText(/what room|which room|what space|where/i)).toBeVisible({ timeout: 15000 });
  });

  test('Buy a Gift tile asks about recipient and budget', async ({ page }) => {
    await page.getByRole('button', { name: /buy a gift/i }).click();

    // Wait for chat response
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Should ask about recipient or budget
    await expect(page.getByText(/who.*gift|budget|recipient/i)).toBeVisible({ timeout: 15000 });
  });

  test('Quick Fix tile shows category grid', async ({ page }) => {
    await page.getByRole('button', { name: /quick fix/i }).click();

    // Should navigate to /quick-fix
    await expect(page).toHaveURL(/\/quick-fix/);

    // Should show Quick Fix header and category tiles
    await expect(page.getByText('Quick Fixes')).toBeVisible();
    await expect(page.getByText('All under $30')).toBeVisible();

    // Should show category tiles (check for a few)
    await expect(page.getByText('Lazy Susans')).toBeVisible();
    await expect(page.getByText('Spice Racks')).toBeVisible();
  });

  test('Explore tile navigates to explore page', async ({ page }) => {
    await page.getByRole('button', { name: /explore/i }).first().click();

    // Should navigate to /explore
    await expect(page).toHaveURL(/\/explore/);
  });
});
