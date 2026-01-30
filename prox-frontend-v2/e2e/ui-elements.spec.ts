import { test, expect } from '@playwright/test';

test.describe('UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header displays Prox logo and title', async ({ page }) => {
    await expect(page.locator('img[alt="Prox"]')).toBeVisible();
    await expect(page.getByText('Prox Discovery')).toBeVisible();
  });

  test('landing page shows welcome message', async ({ page }) => {
    await expect(page.getByText(/Hey! I'm Prox/i)).toBeVisible();
    await expect(page.getByText(/help people find home products/i)).toBeVisible();
  });

  test('send button is visible and styled correctly', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();

    // Check it has the circular styling
    await expect(sendButton).toHaveClass(/rounded-full/);
  });

  test('chat input is accessible and functional', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();

    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Should be able to type
    await chatInput.fill('test input');
    await expect(chatInput).toHaveValue('test input');

    // Should have placeholder
    await chatInput.fill('');
    await expect(chatInput).toHaveAttribute('placeholder', /type a message/i);
  });

  test('loading indicator appears during API call', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Submit a message
    await page.locator('[data-testid="chat-input"]').fill('my living room needs help');
    await page.locator('[data-testid="send-button"]').click();

    // Loading dots should appear briefly
    await expect(page.locator('.ai-loading-dot').first()).toBeVisible({ timeout: 5000 });
  });

  test('How it Works link is visible in header', async ({ page }) => {
    // The link is in the header (has mobile + desktop versions)
    const howItWorksButtons = page.locator('header').getByText('How it Works');
    // At least one should be visible (mobile or desktop version depending on viewport)
    await expect(howItWorksButtons.first()).toBeVisible();
  });

  test('Why Prox link is visible in header', async ({ page }) => {
    // The link is in the header (has mobile + desktop versions)
    const whyProxButtons = page.locator('header').getByText('Why Prox?');
    // At least one should be visible (mobile or desktop version depending on viewport)
    await expect(whyProxButtons.first()).toBeVisible();
  });

  test('Guides link is visible in header', async ({ page }) => {
    // The link is in the header (has mobile + desktop versions)
    const guidesLinks = page.locator('header').getByText('Guides');
    // At least one should be visible (mobile or desktop version depending on viewport)
    await expect(guidesLinks.first()).toBeVisible();
  });

  test('footer is present', async ({ page }) => {
    // Scroll to bottom to ensure footer is in view
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Footer should exist
    await expect(page.locator('footer, [class*="footer"]').first()).toBeVisible({ timeout: 5000 });
  });
});
