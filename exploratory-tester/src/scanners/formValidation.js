const ERROR_INDICATOR_SELECTOR = '.banner-error, [role="alert"], .error, [class*="error" i]';

/**
 * For every form on the page: clear its text/email/number/textarea fields,
 * submit, and record whether the client blocked it, whether any error
 * indicator appeared, and whether a network request fired anyway (a sign
 * validation is missing or purely cosmetic).
 *
 * Separately, for every button whose visible label looks like "Cancel"/"Reset"/
 * "Discard": click it and check whether that click triggered a network request —
 * a generic, non-hardcoded way to catch a Cancel that actually saves.
 */
export async function runFormValidationProbe(page) {
  const findings = [];

  const formCount = await page.locator("form").count();
  for (let i = 0; i < formCount; i += 1) {
    const form = page.locator("form").nth(i);
    const formId = (await form.getAttribute("id")) || `form-${i}`;

    let requestFired = false;
    const onRequest = (req) => {
      if (req.method() !== "GET") requestFired = true;
    };
    page.on("request", onRequest);

    await form.locator('input[type="text"], input[type="email"], input[type="number"], textarea').evaluateAll((els) => {
      els.forEach((el) => {
        el.value = "";
      });
    });

    const submitBtn = form.locator('button[type="submit"], input[type="submit"]').first();
    const hasSubmit = (await submitBtn.count()) > 0;
    if (hasSubmit) {
      await submitBtn.click({ trial: false }).catch(() => {});
      await page.waitForTimeout(400);
    }

    page.off("request", onRequest);

    const errorVisible = await page
      .locator(ERROR_INDICATOR_SELECTOR)
      .first()
      .isVisible()
      .catch(() => false);

    findings.push({
      formId,
      submittedEmpty: hasSubmit,
      networkRequestFiredOnEmptySubmit: requestFired,
      errorIndicatorShown: errorVisible,
    });
  }

  const cancelButtons = page.getByRole("button", { name: /cancel|discard|reset/i });
  const cancelCount = await cancelButtons.count().catch(() => 0);
  const cancelFindings = [];
  for (let i = 0; i < cancelCount; i += 1) {
    const btn = cancelButtons.nth(i);
    const label = await btn.textContent();
    let requestFired = false;
    const onRequest = (req) => {
      if (req.method() !== "GET") requestFired = true;
    };
    page.on("request", onRequest);
    await btn.click().catch(() => {});
    await page.waitForTimeout(400);
    page.off("request", onRequest);
    cancelFindings.push({ label: label?.trim(), triggeredNetworkRequest: requestFired });
  }

  return { forms: findings, cancelButtonProbes: cancelFindings };
}
