// spec: exploratory-tester finding F-01 (Familiarity), confirmed FOUND in
// comparison/reports/2026-09-04T15-13-37-624Z-comparison-report.md
// seed: none — read-only navigation
import { test, expect } from '@playwright/test';

test.describe('Header logo', () => {
  test('links back to the homepage on every primary page', async ({ page }) => {
    const pages = ['/index.html', '/catalog.html', '/account.html', '/contact.html', '/about.html'];

    for (const path of pages) {
      await page.goto(path);
      const logoLink = page.locator('header a:has(img)').first();
      await expect(logoLink, `header logo on ${path} should be a link back to home`).toHaveAttribute('href', '/index.html');
    }
  });
});
