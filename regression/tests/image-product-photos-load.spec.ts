// spec: exploratory-tester finding I-03 (Image), confirmed FOUND
// seed: none — read-only navigation
import { test, expect } from '@playwright/test';

test.describe('Product images', () => {
  test('every catalog product image actually loads (no broken image icons)', async ({ page }) => {
    await page.goto('/catalog.html');
    const images = page.locator('.product-card img');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const src = await img.getAttribute('src');
      expect(naturalWidth, `image "${src}" should have loaded successfully (naturalWidth > 0)`).toBeGreaterThan(0);
    }
  });
});
