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

// Well-known, industry-standard card-number lengths per brand (not any one
// target app's business rules) — used as a generic oracle for whether a
// payment field's accept/reject behavior actually matches what a real card
// number of that brand requires (README Recommendations Further Improvement
// #3). Test numbers are the standard publicly-documented test card numbers
// for each brand, truncated/extended by one digit for the boundary scenarios.
const CARD_BRAND_TEST_NUMBERS = [
  { brand: "Visa", validLength: 16, valid: "4111111111111111", oneShort: "411111111111111", oneLong: "41111111111111111" },
  { brand: "Mastercard", validLength: 16, valid: "5500000000000004", oneShort: "550000000000000", oneLong: "55000000000000004" },
  { brand: "American Express", validLength: 15, valid: "340000000000009", oneShort: "34000000000000", oneLong: "3400000000000009" },
];

async function findHintTextNear(input) {
  const id = await input.getAttribute("id").catch(() => null);
  const candidates = [];
  if (id) candidates.push(input.page().locator(`[for="${id}"]`).first());
  candidates.push(input.locator("xpath=following-sibling::*[1]"));
  candidates.push(input.locator("xpath=../following-sibling::*[1]"));
  for (const candidate of candidates) {
    const text = await candidate.textContent().catch(() => null);
    if (text && text.trim()) return text.trim();
  }
  return null;
}

/**
 * Tries boundary-length card numbers (valid length, one digit short, one
 * digit long) for each well-known card brand against a card-number field,
 * cross-checked against the page's own nearby hint text — generalizes the
 * "two scenarios, diff the exact behavior" approach above from "empty vs.
 * wrong-type" to "boundary-valid vs. one-off-each-side" (README
 * Recommendations Further Improvement #3). No-ops (returns null) on any page
 * with no card-number field at all.
 */
async function probePaymentFieldBoundaries(page, form) {
  const cardInput = form.locator('input[id*="card" i], input[name*="card" i], input[placeholder*="card number" i]').first();
  if ((await cardInput.count().catch(() => 0)) === 0) return null;

  const hintText = await findHintTextNear(cardInput);
  const submitBtn = form.locator('button[type="submit"], input[type="submit"]').first();
  const boundaryResults = [];

  for (const brand of CARD_BRAND_TEST_NUMBERS) {
    for (const [scenario, digits] of [
      ["valid-length", brand.valid],
      ["one-digit-short", brand.oneShort],
      ["one-digit-long", brand.oneLong],
    ]) {
      await cardInput.fill(digits).catch(() => {});
      await submitBtn.click({ trial: false }).catch(() => {});
      await page.waitForTimeout(300);
      const errorState = await captureErrorState(page);
      boundaryResults.push({ brand: brand.brand, scenario, digitsLength: digits.length, ...errorState });
    }
  }

  // A valid-length number that still errors, or a wrong-length number that
  // doesn't, means the field's accept/reject behavior contradicts what that
  // brand's real card numbers require — flagged generically per brand.
  const lengthAcceptanceContradictions = boundaryResults.filter(
    (r) => (r.scenario === "valid-length" && r.errorIndicatorShown) || (r.scenario !== "valid-length" && !r.errorIndicatorShown)
  );

  return {
    cardInputFound: true,
    hintText,
    boundaryResults,
    lengthAcceptanceContradictions,
  };
}

export async function runFormValidationProbe(page) {
  const findings = [];

  const formCount = await page.locator("form").count();
  for (let i = 0; i < formCount; i += 1) {
    const form = page.locator("form").nth(i);
    const formId = (await form.getAttribute("id")) || `form-${i}`;
    const result = await probeForm(page, form, formId);
    result.paymentFieldBoundaryProbe = await probePaymentFieldBoundaries(page, form).catch((err) => ({ error: String(err.message || err) }));
    findings.push(result);
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
