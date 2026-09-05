// spec: exploratory-tester finding CL-01 (Claims, cross-page), confirmed FOUND
// seed: none — read-only navigation across two pages
import { test, expect } from '@playwright/test';

function extractCustomerCount(text: string): number | null {
  // Matches "10,000", "10k", "500" etc. immediately followed by "customer(s)"
  const match = /([\d,]+)\s*k?\+?\s*(?:happy\s+)?customers/i.exec(text);
  if (!match) return null;
  const raw = match[1].replace(/,/g, '');
  const value = parseInt(raw, 10);
  return /k\s*\+?\s*(?:happy\s+)?customers/i.test(match[0]) ? value * 1000 : value;
}

test.describe('Customer-count claims', () => {
  test('Home and About pages do not contradict each other about company scale', async ({ page }) => {
    await page.goto('/index.html');
    const homeText = await page.locator('body').innerText();
    const homeCount = extractCustomerCount(homeText);

    await page.goto('/about.html');
    const aboutText = await page.locator('body').innerText();
    const aboutCount = extractCustomerCount(aboutText);

    expect(homeCount, 'Home page should state a customer count').not.toBeNull();
    expect(aboutCount, 'About page should state a customer count').not.toBeNull();

    if (homeCount && aboutCount) {
      const ratio = Math.max(homeCount, aboutCount) / Math.min(homeCount, aboutCount);
      expect(ratio, `Home (${homeCount}) and About (${aboutCount}) customer-count claims should be roughly consistent, not off by ${ratio.toFixed(1)}x`).toBeLessThan(1.5);
    }
  });
});
