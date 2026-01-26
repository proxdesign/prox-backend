import { test, expect } from '@playwright/test';

test('Direct product request triggers pill', async ({ page }) => {
  // Listen to console for debug logs
  page.on('console', msg => {
    if (msg.text().includes('📦') || msg.text().includes('✅') || msg.text().includes('product')) {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  await page.goto('https://proxdesign.co/solve');
  await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.ai-loading-dot'), { timeout: 20000 });
  
  const input = page.locator('[data-testid="chat-input"]');
  
  // Very direct request that should trigger products immediately
  await input.fill('I need a spice rack for my kitchen, budget under $30');
  // Use Enter key to send (send button hidden on mobile)
  await input.press('Enter');
  
  // Wait for response
  await page.waitForFunction(() => !document.querySelector('.ai-loading-dot'), { timeout: 30000 });
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: '/tmp/mobile-direct-product.png', fullPage: true });
  
  // Check for pill
  const pillVisible = await page.locator('button:has-text("products found")').isVisible().catch(() => false);
  console.log('Pill visible:', pillVisible);
});
