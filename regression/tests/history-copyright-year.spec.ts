// spec: exploratory-tester finding H-01 (History), confirmed FOUND
// seed: none — read-only navigation
import { test, expect } from '@playwright/test';

test.describe('Copyright footer', () => {
  test('shows the current year on every primary page, not a stale hardcoded one', async ({ page }) => {
    const currentYear = String(new Date().getFullYear());
    const pages = ['/index.html', '/catalog.html', '/account.html', '/contact.html', '/about.html', '/new-item.html'];

    for (const path of pages) {
      await page.goto(path);
      const footerText = await page.locator('footer').textContent();
      expect(footerText, `footer on ${path} should reference the current year (${currentYear})`).toContain(currentYear);
    }
  });
});
