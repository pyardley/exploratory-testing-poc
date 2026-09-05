// spec: exploratory-tester finding U-01 (User Expectations), confirmed FOUND
// seed: none — navigates via the catalog to reach a real edit page
import { test, expect } from '@playwright/test';

test.describe('Edit widget form', () => {
  test('Cancel discards changes without sending a save request', async ({ page }) => {
    await page.goto('/catalog.html');
    await page.locator('.grid a').first().click();
    await page.getByRole('link', { name: /edit/i }).click();

    await page.locator('#name').fill('This change should never be saved');

    let saveRequestFired = false;
    page.on('request', (req) => {
      if (req.method() !== 'GET') saveRequestFired = true;
    });

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(500);

    expect(saveRequestFired, 'clicking Cancel should not send any save/update request').toBe(false);
  });
});
