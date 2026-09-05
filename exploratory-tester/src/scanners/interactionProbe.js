/**
 * Deterministically PERFORMS interactions and diffs outcomes, rather than
 * just describing static state — this is what "static artifact review" alone
 * structurally can't do (see README.md Recommendations #1). Covers four
 * generic, non-hardcoded patterns: sort/select controls claiming a direction,
 * search-like inputs, "Page X of Y" pagination, and checkboxes tied to a save
 * action. All heuristics key off common conventions (data attributes, ARIA
 * roles, visible label wording, a "Page X of Y" status string) rather than
 * any WidgetWorks-specific selector.
 */

const OPTION_ATTR_SELECTOR = "[data-sort], [data-value], [data-filter], [data-option], [data-key]";
const TRIGGER_CANDIDATE_SELECTOR = '[class*="trigger" i], [class*="toggle" i], [role="button"]:not(button)';
const MONEY_TOKEN = /\$\s?-?\d[\d,]*\.?\d*/g;
const ASC_WORDS = /low to high|ascending|\ba-z\b|smallest to largest|oldest to newest/i;
const DESC_WORDS = /high to low|descending|\bz-a\b|largest to smallest|newest to oldest/i;

function extractMoneyTokens(text) {
  const matches = text.match(MONEY_TOKEN) || [];
  return matches.map((m) => parseFloat(m.replace(/[^0-9.-]/g, "")));
}

function isMonotonic(values, direction) {
  if (values.length < 2) return null; // not enough data to judge
  for (let i = 1; i < values.length; i += 1) {
    if (direction === "asc" && values[i] < values[i - 1] - 0.001) return false;
    if (direction === "desc" && values[i] > values[i - 1] + 0.001) return false;
  }
  return true;
}

async function bodyText(page) {
  return page.locator("body").innerText();
}

async function probeNativeSelects(page) {
  const results = [];
  const selects = page.locator("select");
  const count = await selects.count();
  for (let i = 0; i < count; i += 1) {
    const select = selects.nth(i);
    const selectId = (await select.getAttribute("id")) || `select-${i}`;
    const optionLabels = await select.locator("option").allTextContents();
    const samples = [];
    for (const label of optionLabels) {
      await select.selectOption({ label }).catch(() => {});
      await page.waitForTimeout(150);
      samples.push({ label, snapshot: await bodyText(page) });
    }
    results.push(analyzeDirectionalSamples(selectId, samples));
  }
  return results;
}

/**
 * Discovers "trigger + menu of data-attribute options" custom dropdowns by
 * trial-clicking trigger-shaped candidates and checking whether any
 * OPTION_ATTR_SELECTOR elements newly become visible — rather than assuming
 * any specific class name or DOM shape.
 */
async function discoverCustomDropdownTriggers(page) {
  const triggers = page.locator(TRIGGER_CANDIDATE_SELECTOR);
  const triggerCount = await triggers.count().catch(() => 0);
  const found = [];
  for (let i = 0; i < triggerCount; i += 1) {
    const before = await page.locator(OPTION_ATTR_SELECTOR).evaluateAll((els) => els.map((el) => el.offsetParent !== null));
    if (before.length === 0) break; // no data-attribute options anywhere on this page
    await triggers.nth(i).click().catch(() => {});
    await page.waitForTimeout(150);
    const after = await page.locator(OPTION_ATTR_SELECTOR).evaluateAll((els) => els.map((el) => el.offsetParent !== null));
    const revealedIndices = after.map((v, idx) => (v && !before[idx] ? idx : -1)).filter((idx) => idx !== -1);
    if (revealedIndices.length > 0) {
      found.push({ triggerIndex: i, optionIndices: revealedIndices });
    } else {
      // didn't open a relevant menu — close/undo defensively in case it toggled something else
      await triggers.nth(i).click().catch(() => {});
    }
  }
  return found;
}

async function probeCustomDropdowns(page) {
  const results = [];
  const dropdowns = await discoverCustomDropdownTriggers(page);
  const triggers = page.locator(TRIGGER_CANDIDATE_SELECTOR);
  const options = page.locator(OPTION_ATTR_SELECTOR);

  for (const dropdown of dropdowns) {
    const samples = [];
    for (const optionIndex of dropdown.optionIndices) {
      await triggers.nth(dropdown.triggerIndex).click().catch(() => {});
      await page.waitForTimeout(150);
      const optionLocator = options.nth(optionIndex);
      const label = (await optionLocator.textContent().catch(() => null))?.trim() || `option-${optionIndex}`;
      await optionLocator.click().catch(() => {});
      await page.waitForTimeout(150);
      samples.push({ label, snapshot: await bodyText(page) });
    }
    results.push(analyzeDirectionalSamples(`custom-dropdown-${dropdown.triggerIndex}`, samples));
  }
  return results;
}

function analyzeDirectionalSamples(controlId, samples) {
  if (samples.length < 2) return { controlId, samples: samples.map((s) => s.label), verdict: "insufficient-data" };

  const noOpticSamples = samples.filter((s, i) => i > 0 && s.snapshot === samples[0].snapshot);
  const allIdentical = samples.every((s) => s.snapshot === samples[0].snapshot);

  let directionMismatch = null;
  for (const sample of samples) {
    const direction = ASC_WORDS.test(sample.label) ? "asc" : DESC_WORDS.test(sample.label) ? "desc" : null;
    if (!direction) continue;
    const values = extractMoneyTokens(sample.snapshot);
    const monotonic = isMonotonic(values, direction);
    if (monotonic === false) {
      directionMismatch = { label: sample.label, claimedDirection: direction, observedValues: values };
      break;
    }
  }

  return {
    controlId,
    optionsProbed: samples.map((s) => s.label),
    allSelectionsProducedIdenticalContent: allIdentical,
    someSelectionsProducedNoChange: noOpticSamples.length > 0 && !allIdentical ? noOpticSamples.map((s) => s.label) : [],
    directionClaimMismatch: directionMismatch,
  };
}

async function probeSearchInputs(page) {
  const results = [];
  const searchInputs = page.locator(
    'input[type="search"], input[id*="search" i], input[name*="search" i], input[placeholder*="search" i]'
  );
  const count = await searchInputs.count().catch(() => 0);
  for (let i = 0; i < count; i += 1) {
    const input = searchInputs.nth(i);
    const id = (await input.getAttribute("id")) || `search-${i}`;
    const before = await bodyText(page);
    await input.fill("zzzznonexistentqueryzzzz1234").catch(() => {});
    await page.keyboard.press("Enter").catch(() => {});
    await page.waitForTimeout(300);
    const after = await bodyText(page);
    results.push({
      inputId: id,
      typedNonsenseQuery: true,
      contentChangedAtAll: before !== after,
    });
    await input.fill("").catch(() => {});
  }
  return results;
}

async function probePagination(page) {
  const results = [];
  const statusLocator = page.locator("text=/page\\s+\\d+\\s+of\\s+\\d+/i").first();
  const hasStatus = (await statusLocator.count().catch(() => 0)) > 0;
  if (!hasStatus) return results;

  const statusTextBefore = (await statusLocator.textContent().catch(() => "")) || "";
  const totalMatch = /of\s+(\d+)/i.exec(statusTextBefore);
  const totalPages = totalMatch ? parseInt(totalMatch[1], 10) : 1;
  if (totalPages <= 1) return results;

  const nextButton = page.getByRole("button", { name: /^next\b/i }).or(page.getByRole("link", { name: /^next\b/i }));
  const hasNext = (await nextButton.count().catch(() => 0)) > 0;
  if (!hasNext) return results;

  const contentBefore = await bodyText(page);
  await nextButton.first().click().catch(() => {});
  await page.waitForTimeout(300);
  const contentAfter = await bodyText(page);
  const statusTextAfter = (await statusLocator.textContent().catch(() => "")) || "";

  results.push({
    control: "next",
    statusBefore: statusTextBefore.trim(),
    statusAfter: statusTextAfter.trim(),
    contentChanged: contentBefore !== contentAfter,
    statusChanged: statusTextBefore.trim() !== statusTextAfter.trim(),
  });
  return results;
}

/**
 * Toggles each checkbox inside a form that has a submit button, saves, does
 * a FRESH page load (not just re-fetch), and re-reads the same checkbox's
 * state — catching both "didn't persist" and "persisted inverted" generically,
 * without knowing anything about what the checkbox means.
 */
async function probeCheckboxRoundTrip(page, url) {
  const results = [];
  const forms = page.locator("form");
  const formCount = await forms.count().catch(() => 0);

  for (let f = 0; f < formCount; f += 1) {
    const form = forms.nth(f);
    const submitBtn = form.locator('button[type="submit"], input[type="submit"]');
    if ((await submitBtn.count().catch(() => 0)) === 0) continue;

    const checkboxes = form.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count().catch(() => 0);
    for (let c = 0; c < cbCount; c += 1) {
      const checkbox = checkboxes.nth(c);
      const id = (await checkbox.getAttribute("id")) || `checkbox-${c}`;
      const before = await checkbox.isChecked().catch(() => null);
      if (before === null) continue;

      const intended = !before;
      if (intended) await checkbox.check().catch(() => {});
      else await checkbox.uncheck().catch(() => {});

      await submitBtn.first().click().catch(() => {});
      await page.waitForTimeout(400);

      await page.goto(url, { waitUntil: "networkidle" }).catch(() => null);
      // id comes from getAttribute('id') above — use an attribute selector rather
      // than "#id" so it stays valid even if the id contains CSS-special characters
      // (Node has no CSS.escape; that's a browser-only API).
      const reloadedCheckbox = page.locator(`[id="${id}"]`).first();
      const persisted = (await reloadedCheckbox.count().catch(() => 0)) > 0 ? await reloadedCheckbox.isChecked().catch(() => null) : null;

      results.push({
        checkboxId: id,
        before,
        toggledTo: intended,
        afterReload: persisted,
        persistedCorrectly: persisted === intended,
      });
    }
  }
  return results;
}

export async function runInteractionProbe(page, url) {
  const [selectProbes, customDropdownProbes, searchProbes, paginationProbes] = [
    await probeNativeSelects(page),
    await probeCustomDropdowns(page),
    await probeSearchInputs(page),
    await probePagination(page),
  ];
  // Checkbox round-trip does a full page reload, so it runs last and is
  // deliberately excluded from callers that need the page left in its
  // original evidence-capture state (see scan.js — it is opt-in per page).
  return {
    directionalControls: [...selectProbes, ...customDropdownProbes],
    searchProbes,
    paginationProbes,
  };
}

export { probeCheckboxRoundTrip };
