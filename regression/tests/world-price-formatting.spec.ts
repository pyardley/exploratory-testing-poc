// spec: exploratory-tester finding W-01 (World), confirmed FOUND
// seed: none — read-only navigation
import { test, expect } from '@playwright/test';

test.describe('Currency formatting', () => {
  test('catalog prices use standard 2-decimal USD formatting', async ({ page }) => {
    await page.goto('/catalog.html');
    const priceTexts = await page.locator('.price').allTextContents();
    expect(priceTexts.length).toBeGreaterThan(0);
    for (const text of priceTexts) {
      expect(text, `price "${text}" should have exactly 2 decimal places`).toMatch(/^\$\d[\d,]*\.\d{2}$/);
    }
  });

  test('item detail price uses standard 2-decimal USD formatting', async ({ page }) => {
    await page.goto('/catalog.html');
    await page.locator('.grid a').first().click();
    const priceText = await page.locator('.price').first().textContent();
    expect(priceText?.trim(), `price "${priceText}" should have exactly 2 decimal places`).toMatch(/^\$\d[\d,]*\.\d{2}$/);
  });
});
