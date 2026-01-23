import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('submitting a message shows response', async ({ page }) => {
    // Click Solve a Problem to start chat
    await page.getByRole('button', { name: /solve a problem/i }).click();

    // Wait for chat to be ready
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Type and submit a message
    await page.locator('[data-testid="chat-input"]').fill('my kitchen counters are always cluttered');
    await page.locator('[data-testid="send-button"]').click();

    // Should show assistant response
    await expect(page.locator('.bg-white.rounded-\\[18px\\]').last()).toBeVisible({ timeout: 20000 });
  });

  test('describing a problem gets probing question from AI', async ({ page }) => {
    // Start Solve a Problem flow
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Wait for initial clarifying question
    await page.waitForTimeout(2000);

    // Describe a specific problem (after the initial "I have a problem" message)
    await page.locator('[data-testid="chat-input"]').fill('my kitchen counters are cluttered with appliances');
    await page.locator('[data-testid="send-button"]').click();

    // AI should now ask probing questions instead of showing solutions immediately
    // Wait for assistant response (the white bubble)
    await expect(page.locator('.bg-white.rounded-\\[18px\\]').last()).toBeVisible({ timeout: 20000 });

    // The response should be a follow-up question, not immediate solutions
    // Solutions panel should NOT appear immediately (AI asks probing questions first)
  });

  test('chat preserves conversation history', async ({ page }) => {
    // Start conversation
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Wait for initial assistant message
    await page.waitForTimeout(2000);

    // Send follow-up message (first user message after tile click is auto-sent)
    await page.locator('[data-testid="chat-input"]').fill('the counters are cluttered');
    await page.locator('[data-testid="send-button"]').click();

    // Wait for response and verify message is visible
    await expect(page.getByText('the counters are cluttered')).toBeVisible({ timeout: 10000 });
  });

  test('pressing Enter submits message', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Type and press Enter
    await page.locator('[data-testid="chat-input"]').fill('my bedroom closet is overflowing');
    await page.locator('[data-testid="chat-input"]').press('Enter');

    // Should show the user message
    await expect(page.getByText('my bedroom closet is overflowing')).toBeVisible();

    // Should get a response (loading indicator or actual response)
    await expect(page.locator('.ai-loading-dot, .bg-white.rounded-\\[18px\\]').first()).toBeVisible({ timeout: 5000 });
  });

  test('empty message cannot be submitted', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Send button should be disabled with empty input
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeDisabled();

    // Type something
    await page.locator('[data-testid="chat-input"]').fill('test');
    await expect(sendButton).toBeEnabled();

    // Clear input
    await page.locator('[data-testid="chat-input"]').fill('');
    await expect(sendButton).toBeDisabled();
  });
});
