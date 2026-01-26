import { test, expect } from '@playwright/test';

// Uses mobile viewport from project config (mobile-chrome or mobile-safari)

test.describe('Mobile Chat Experience', () => {
  test('Solve Problem chat flow and product discovery', async ({ page }) => {
    // Go to solve page on production
    await page.goto('https://proxdesign.co/solve');

    // Wait for chat interface to load
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 15000 });

    // Wait for initial AI response (loading dots disappear)
    await page.waitForFunction(() => {
      const dots = document.querySelector('.ai-loading-dot');
      return !dots;
    }, { timeout: 20000 });

    // Verify input is visible
    const input = page.locator('[data-testid="chat-input"]');
    await expect(input).toBeVisible();

    // Type a problem that should trigger product recommendations
    await input.fill('my kitchen counter is always cluttered');

    // Send message
    await page.locator('[data-testid="send-button"]').click();

    // Wait for AI response
    await page.waitForFunction(() => {
      const dots = document.querySelector('.ai-loading-dot');
      return !dots;
    }, { timeout: 30000 });

    // Wait for potential product loading
    await page.waitForTimeout(3000);

    // Take screenshot of result
    await page.screenshot({ path: '/tmp/mobile-solve-result.png', fullPage: true });

    // Chat should still be visible and functional
    await expect(input).toBeVisible();
  });

  test('Buy a Gift chat flow', async ({ page }) => {
    await page.goto('https://proxdesign.co/gift');

    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 15000 });

    // Wait for initial response
    await page.waitForFunction(() => {
      const dots = document.querySelector('.ai-loading-dot');
      return !dots;
    }, { timeout: 20000 });

    const input = page.locator('[data-testid="chat-input"]');
    await expect(input).toBeVisible();

    // Type gift request
    await input.fill('looking for a gift for my mom who loves cooking');
    await page.locator('[data-testid="send-button"]').click();

    // Wait for response
    await page.waitForFunction(() => {
      const dots = document.querySelector('.ai-loading-dot');
      return !dots;
    }, { timeout: 30000 });

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/mobile-gift-result.png', fullPage: true });

    await expect(input).toBeVisible();
  });

  test('Input stays accessible after focus', async ({ page }) => {
    await page.goto('https://proxdesign.co/solve');

    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 15000 });

    const input = page.locator('[data-testid="chat-input"]');

    // Focus input (simulates tapping to type)
    await input.focus();
    await page.waitForTimeout(500);

    // Input should remain visible and accessible
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await page.screenshot({ path: '/tmp/mobile-input-focus.png', fullPage: true });
  });
});
