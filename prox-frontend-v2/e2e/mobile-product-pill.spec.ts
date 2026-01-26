import { test, expect } from '@playwright/test';

test.describe('Mobile Product Pill', () => {
  test('Product pill appears after full conversation', async ({ page }) => {
    await page.goto('https://proxdesign.co/solve');
    
    await page.waitForSelector('[data-testid="chat-interface"]', { timeout: 15000 });
    
    // Wait for initial AI response
    await page.waitForFunction(() => !document.querySelector('.ai-loading-dot'), { timeout: 20000 });
    
    const input = page.locator('[data-testid="chat-input"]');
    const sendBtn = page.locator('[data-testid="send-button"]');
    
    // First message - describe problem
    await input.fill('my kitchen counter is cluttered with spices and cooking stuff');
    await sendBtn.click();
    await page.waitForFunction(() => !document.querySelector('.ai-loading-dot'), { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Second message - provide more detail to trigger product recommendations
    await input.fill('mostly spices and oils, looking for under $50 solutions');
    await sendBtn.click();
    await page.waitForFunction(() => !document.querySelector('.ai-loading-dot'), { timeout: 30000 });
    
    // Wait for potential products to load
    await page.waitForTimeout(4000);
    
    // Take screenshot
    await page.screenshot({ path: '/tmp/mobile-pill-test.png', fullPage: true });
    
    // Check console for product logs
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Log current state for debugging
    const pillExists = await page.locator('text=/\\d+ products found/').count();
    console.log('Product pill count:', pillExists);
    console.log('Console logs:', logs.filter(l => l.includes('product') || l.includes('📦')));
  });
});
