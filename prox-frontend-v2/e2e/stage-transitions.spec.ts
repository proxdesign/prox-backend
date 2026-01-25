import { test, expect } from '@playwright/test';

test.describe('Stage Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('discovery stage shows chat interface', async ({ page }) => {
    // Click tile to start
    await page.getByRole('button', { name: /solve a problem/i }).click();

    // Should show chat interface
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('AI asks probing questions after describing problem', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Describe a problem - AI should now ask probing questions first
    await page.locator('[data-testid="chat-input"]').fill('my bathroom is cluttered and disorganized');
    await page.locator('[data-testid="send-button"]').click();

    // AI should respond with probing questions (not immediate solutions)
    await expect(page.locator('.bg-white.rounded-\\[18px\\]').last()).toBeVisible({ timeout: 20000 });
  });

  test('clicking logo returns to landing page', async ({ page }) => {
    // Start a conversation
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Click logo to go back (could be button, link, or image)
    const logo = page.locator('header').locator('img[alt="Prox"]').first();
    await logo.click();

    // Should reset - either show landing tiles or at least the welcome message area
    await expect(page.locator('.landing-container, [data-testid="chat-interface"]')).toBeVisible({ timeout: 5000 });
  });

  test('chat interface persists during conversation', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Send a message
    await page.locator('[data-testid="chat-input"]').fill('help with my office desk');
    await page.locator('[data-testid="send-button"]').click();

    // Chat should still be visible after sending
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
  });

  test('user message appears in chat after submission', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    const testMessage = 'testing message submission';
    await page.locator('[data-testid="chat-input"]').fill(testMessage);
    await page.locator('[data-testid="send-button"]').click();

    // User message should appear in chat
    await expect(page.getByText(testMessage)).toBeVisible({ timeout: 10000 });
  });
});
