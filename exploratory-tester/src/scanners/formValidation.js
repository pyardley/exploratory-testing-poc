const ERROR_INDICATOR_SELECTOR = '.banner-error, [role="alert"], .error, [class*="error" i]';
const NUMERIC_FIELD_PATTERN = /price|weight|amount|qty|quantity|number|cost|total/i;

async function captureErrorState(page) {
  const indicator = page.locator(ERROR_INDICATOR_SELECTOR).first();
  const visible = await indicator.isVisible().catch(() => false);
  const text = visible ? (await indicator.textContent().catch(() => null))?.trim() || null : null;
  return { errorIndicatorShown: visible, errorText: text };
}

async function submitAndCapture(page, form) {
  let requestFired = false;
  const onRequest = (req) => {
    if (req.method() !== "GET") requestFired = true;
  };
  page.on("request", onRequest);

  const submitBtn = form.locator('button[type="submit"], input[type="submit"]').first();
  const hasSubmit = (await submitBtn.count()) > 0;
  if (hasSubmit) {
    await submitBtn.click({ trial: false }).catch(() => {});
    await page.waitForTimeout(400);
  }

  page.off("request", onRequest);
  const errorState = await captureErrorState(page);
  return { submitted: hasSubmit, networkRequestFired: requestFired, ...errorState };
}

/**
 * Multiple distinct failure modes per form, each with the actual error text
 * (not just a boolean), so the AI review can compare them and notice a
 * pattern a single scenario can't reveal — e.g. every scenario producing the
 * identical generic message regardless of which field actually failed
 * (README.md Recommendations #3).
 */
async function probeForm(page, form, formId) {
  const textFields = form.locator('input[type="text"], input[type="email"], input[type="number"], textarea');
  const fieldCount = await textFields.count();

  // Scenario 1: every field empty.
  await textFields.evaluateAll((els) => els.forEach((el) => { el.value = ""; }));
  const emptyResult = await submitAndCapture(page, form);

  // Scenario 2: everything filled with plausible values EXCEPT one numeric-
  // looking field, which gets a non-numeric string — isolates a wrong-type
  // failure from a missing-field failure.
  let invalidTypeResult = null;
  let numericFieldProbed = null;
  for (let i = 0; i < fieldCount; i += 1) {
    const el = textFields.nth(i);
    const hint = ((await el.getAttribute("id")) || (await el.getAttribute("placeholder")) || (await el.getAttribute("name")) || "").toLowerCase();
    const isNumeric = NUMERIC_FIELD_PATTERN.test(hint) || (await el.getAttribute("type")) === "number";
    if (isNumeric && !numericFieldProbed) {
      numericFieldProbed = hint || `field-${i}`;
      await el.fill("not-a-number").catch(() => {});
    } else {
      await el.fill("Exploratory tester probe value").catch(() => {});
    }
  }
  if (numericFieldProbed) {
    invalidTypeResult = await submitAndCapture(page, form);
  }

  return {
    formId,
    submittedEmpty: emptyResult.submitted,
    networkRequestFiredOnEmptySubmit: emptyResult.networkRequestFired,
    errorIndicatorShown: emptyResult.errorIndicatorShown,
    errorTextOnEmptySubmit: emptyResult.errorText,
    numericFieldProbed,
    errorTextOnInvalidType: invalidTypeResult?.errorText ?? null,
    networkRequestFiredOnInvalidType: invalidTypeResult?.networkRequestFired ?? null,
    sameErrorTextAcrossScenarios:
      numericFieldProbed && emptyResult.errorText !== null && emptyResult.errorText === invalidTypeResult?.errorText,
  };
}

export async function runFormValidationProbe(page) {
  const findings = [];

  const formCount = await page.locator("form").count();
  for (let i = 0; i < formCount; i += 1) {
    const form = page.locator("form").nth(i);
    const formId = (await form.getAttribute("id")) || `form-${i}`;
    findings.push(await probeForm(page, form, formId));
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
