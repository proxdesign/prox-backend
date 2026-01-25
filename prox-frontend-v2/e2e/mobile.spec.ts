import { test, expect } from '@playwright/test';

// Mobile viewport configuration
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

test.describe('Mobile Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header links appear below tagline on mobile', async ({ page }) => {
    // On mobile, "How it Works" and "Why Prox?" should be below the tagline
    const tagline = page.getByText('AI-powered recommendations to solve your home problems');
    // Use exact match to avoid matching the parent button
    const howItWorks = page.getByRole('button', { name: 'How it Works', exact: true });
    const whyProx = page.getByRole('button', { name: 'Why Prox?', exact: true });

    await expect(tagline).toBeVisible();
    await expect(howItWorks.first()).toBeVisible();
    await expect(whyProx.first()).toBeVisible();

    // Verify links are positioned below tagline (check vertical ordering)
    const taglineBox = await tagline.boundingBox();
    const howItWorksBox = await howItWorks.first().boundingBox();

    expect(taglineBox).not.toBeNull();
    expect(howItWorksBox).not.toBeNull();

    if (taglineBox && howItWorksBox) {
      // How it Works should be below the tagline
      expect(howItWorksBox.y).toBeGreaterThan(taglineBox.y);
    }
  });

  test('landing tiles stack vertically on mobile', async ({ page }) => {
    const solveProblem = page.getByRole('button', { name: /solve a problem/i });
    const buyGift = page.getByRole('button', { name: /buy a gift/i });

    await expect(solveProblem).toBeVisible();
    await expect(buyGift).toBeVisible();

    // On mobile, tiles should stack (buy gift below solve problem)
    const solveBox = await solveProblem.boundingBox();
    const giftBox = await buyGift.boundingBox();

    expect(solveBox).not.toBeNull();
    expect(giftBox).not.toBeNull();

    if (solveBox && giftBox) {
      // On single column layout, gift should be below solve
      expect(giftBox.y).toBeGreaterThan(solveBox.y);
    }
  });

  test('chat interface is usable on mobile', async ({ page }) => {
    // Start a conversation
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Chat input should be reasonably wide on mobile (at least 70% of 375px viewport = 262px)
    const chatInput = page.locator('[data-testid="chat-input"]');
    const inputBox = await chatInput.boundingBox();

    expect(inputBox).not.toBeNull();
    if (inputBox) {
      expect(inputBox.width).toBeGreaterThan(250);
    }

    // Send button should be visible and tappable
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();
  });

  test('How it Works modal opens on mobile', async ({ page }) => {
    // Click the first "How it Works" button (mobile version below tagline)
    await page.getByRole('button', { name: 'How it Works', exact: true }).first().click();

    // Modal content should be visible - look for the heading
    await expect(page.getByRole('heading', { name: 'How it Works' })).toBeVisible({ timeout: 5000 });
  });

  test('Why Prox modal opens on mobile', async ({ page }) => {
    // Click the first "Why Prox?" button (mobile version below tagline)
    await page.getByRole('button', { name: 'Why Prox?', exact: true }).first().click();

    // Modal content should be visible - look for the heading
    await expect(page.getByRole('heading', { name: 'Why Prox?' })).toBeVisible({ timeout: 5000 });
  });

  test('logo is visible and clickable on mobile', async ({ page }) => {
    const logo = page.locator('img[alt="Prox"]');
    await expect(logo).toBeVisible();

    // Start a conversation first
    await page.getByRole('button', { name: /solve a problem/i }).click();
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible({ timeout: 10000 });

    // Click the logo to return home (could be button, link, or clickable element)
    const logoClickable = page.locator('header').locator('img[alt="Prox"]').first();
    await logoClickable.click();

    // Should return to landing or stay in chat (depending on implementation)
    await expect(page.locator('.landing-container, [data-testid="chat-interface"]')).toBeVisible({ timeout: 5000 });
  });

  test('beta badge is visible on mobile', async ({ page }) => {
    const betaBadge = page.getByText('beta');
    await expect(betaBadge).toBeVisible();
  });

  test('footer renders correctly on mobile', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check key footer elements
    await expect(page.getByText('Prox', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Affiliate Disclosure')).toBeVisible();
    await expect(page.getByText('Learn More')).toBeVisible();
  });
});

test.describe('Mobile Touch Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('tiles respond to tap', async ({ page }) => {
    const solveProblem = page.getByRole('button', { name: /solve a problem/i });

    // Tap the tile
    await solveProblem.tap();

    // Should navigate to chat
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible({ timeout: 10000 });
  });

  test('chat input accepts touch input', async ({ page }) => {
    await page.getByRole('button', { name: /solve a problem/i }).tap();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible({ timeout: 10000 });

    // Tap and type in chat input
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.tap();
    await chatInput.fill('test message on mobile');

    await expect(chatInput).toHaveValue('test message on mobile');
  });
});

test.describe('Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header links in correct position on tablet', async ({ page }) => {
    // On tablet (md breakpoint), links should be in header right side
    const howItWorks = page.getByRole('button', { name: 'How it Works' });
    await expect(howItWorks).toBeVisible();
  });

  test('landing grid has proper layout on tablet', async ({ page }) => {
    const solveProblem = page.getByRole('button', { name: /solve a problem/i });
    const explore = page.getByRole('button', { name: /explore/i });

    await expect(solveProblem).toBeVisible();
    await expect(explore).toBeVisible();

    // On tablet, some tiles should be side by side
    const solveBox = await solveProblem.boundingBox();
    const exploreBox = await explore.boundingBox();

    expect(solveBox).not.toBeNull();
    expect(exploreBox).not.toBeNull();

    if (solveBox && exploreBox) {
      // Explore should be to the right of Solve a Problem (2-column layout)
      expect(exploreBox.x).toBeGreaterThan(solveBox.x);
    }
  });
});
