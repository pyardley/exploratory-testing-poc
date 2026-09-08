/**
 * Drives a real, primary conversion flow end to end — browse, add to basket,
 * checkout delivery, checkout payment, place order — using generic role/
 * label/placeholder-based heuristics rather than hardcoded selectors, the
 * same discipline crudSmoke.js already follows.
 *
 * Exists because on a checkout/wizard-shaped app, the pages between "add to
 * basket" and "order confirmed" typically advance via a JS `window.location`
 * redirect after a form POST, not a real `<a href>` — invisible to
 * crawler.js's link-based discovery no matter how many click-path fallbacks
 * it grows (those exist for href="#"/onClick SPA-routing, a materially
 * different problem from "this page only exists after a valid multi-step
 * form submission"). Discovered pointing this tool at BrightBasket, whose
 * checkout-payment and confirmation pages were consequently never evidenced
 * or reviewed at all until this scanner was added — see FINDINGS.md. Every
 * selector here is a generic pattern (accessible name / id / placeholder
 * substring match), not literally BrightBasket-specific, so this should
 * activate the same way on any other checkout-shaped target; it simply won't
 * find anything to do (empty steps, empty reachedPages) on a site with no
 * such flow, the same no-op-on-mismatch behavior crudSmoke.js already has.
 *
 * Called from scan.js BEFORE the crawl runs (not just before evidence
 * capture) so a real order already exists by the time the crawler does its
 * own discovery pass — order-detail-style pages are typically only linked
 * from an order-history list once at least one order exists, so the plain
 * crawler can pick that page up for free afterward with zero extra code,
 * exactly as long as the list page itself uses a real `<a href>` (checked
 * against BrightBasket's orders.html, which does).
 */

const DELIVERY_FIELDS_AWKWARD = [
  // Deliberately-awkward-but-valid values, matching the charter's own
  // suggested edge cases (apostrophe/hyphen name, single-digit house number,
  // UK mobile with a leading zero) — tried first since catching a real
  // validation bug here is a bonus, not just a means to reach later pages.
  { value: "Siobhan O'Brien-Clarke", match: /full ?name|cardholder|^name$/i },
  { value: "07911 123456", match: /phone|mobile/i },
  { value: "9 Elm Grove", match: /address.*line ?1|^street/i },
  { value: "Flat 2", match: /address.*line ?2|apartment|suite|unit/i },
  { value: "Bristol", match: /city|town/i },
  { value: "BS1 4ST", match: /post ?code|zip/i },
  { value: "United Kingdom", match: /country/i },
];

// Conservative fallback if the awkward values above get rejected by
// validation — the walkthrough's primary job is reaching the pages behind
// this form, so it must be able to get past it either way.
const DELIVERY_FIELDS_SAFE = [
  { value: "Jamie Smith", match: /full ?name|cardholder|^name$/i },
  { value: "7911123456", match: /phone|mobile/i },
  { value: "9 Elm Grove", match: /address.*line ?1|^street/i },
  { value: "Flat 2", match: /address.*line ?2|apartment|suite|unit/i },
  { value: "Bristol", match: /city|town/i },
  { value: "BS1 4ST", match: /post ?code|zip/i },
  { value: "United Kingdom", match: /country/i },
];

// A real, well-formed Visa test number (from the app's own README/product
// description as a legitimate example to check out with), not a fabricated
// value.
const PAYMENT_FIELDS = [
  { value: "4111 1111 1111 1111", match: /card ?number/i },
  { value: "12/29", match: /expiry|exp\b/i },
  { value: "123", match: /cvv|cvc|security code/i },
  { value: "Jamie Smith", match: /name on card|cardholder|card.*name/i },
];

async function fillFieldsByPattern(page, patterns, fallbackValue = "Exploratory tester value") {
  const inputs = page.locator('input[type="text"], input[type="tel"], input:not([type])');
  const count = await inputs.count();
  for (let i = 0; i < count; i += 1) {
    const el = inputs.nth(i);
    const probe = `${(await el.getAttribute("id")) || ""} ${(await el.getAttribute("placeholder")) || ""} ${(await el.getAttribute("aria-label")) || ""}`.toLowerCase();
    const matched = patterns.find((p) => p.match.test(probe));
    await el.fill(matched ? matched.value : fallbackValue).catch(() => {});
  }
}

async function clickAndWaitForNavigation(page, locator) {
  const before = page.url();
  await locator.click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  return page.url() !== before;
}

/** First "Add to basket"-labeled button that isn't disabled — an out-of-stock
 * card's button reads "Out of stock" instead, so a plain accessible-name
 * match already skips those without any extra stock-checking logic. */
function addToBasketButton(page) {
  return page.getByRole("button", { name: /^add to (basket|cart|bag)$/i }).first();
}

export async function runCheckoutWalkthrough(page, baseUrl, { capturePageEvidence }) {
  const result = { steps: [], reachedPages: [] };

  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});

  // --- Reach a shop/catalog-like page and add something to the basket ---
  const shopLink = page.getByRole("link", { name: /^(shop|catalog|products|browse)/i }).first();
  if ((await shopLink.count().catch(() => 0)) > 0) {
    await shopLink.click().catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
  }

  let addBtn = addToBasketButton(page);
  if ((await addBtn.count().catch(() => 0)) === 0) {
    // No add-to-basket control on this listing page itself — try via a
    // product detail page instead (same generic card-link pattern crudSmoke
    // uses to find list-item links).
    const itemLink = page.locator(".card a[href], a[href] .card, .grid a[href]").first();
    if ((await itemLink.count().catch(() => 0)) === 0) {
      result.steps.push({ step: "add-to-basket", skipped: true, reason: "no shop/catalog page or product link found" });
      return result;
    }
    await itemLink.click().catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
    addBtn = addToBasketButton(page);
  }

  if ((await addBtn.count().catch(() => 0)) === 0) {
    result.steps.push({ step: "add-to-basket", skipped: true, reason: "no enabled 'Add to basket'-like control found" });
    return result;
  }
  await addBtn.click().catch(() => {});
  await page.waitForTimeout(500);
  result.steps.push({ step: "add-to-basket", ok: true, url: page.url() });

  // --- Reach the basket and proceed to checkout ---
  // Anchored to the START of the accessible name — a brand name/logo whose
  // own text happens to CONTAIN "basket" (e.g. "BrightBasket", read from the
  // header logo's alt text) would otherwise satisfy a bare /basket/i test as
  // a false match and get clicked instead of the real nav link. Found by
  // running this against BrightBasket itself.
  const basketLink = page.getByRole("link", { name: /^\s*(basket|cart|bag)\b/i }).first();
  if ((await basketLink.count().catch(() => 0)) === 0) {
    result.steps.push({ step: "reach-basket", skipped: true, reason: "no basket/cart-like nav link found" });
    return result;
  }
  await basketLink.click().catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  result.steps.push({ step: "reach-basket", ok: true, url: page.url() });

  const checkoutCta = page
    .getByRole("link", { name: /checkout/i })
    .or(page.getByRole("button", { name: /checkout/i }))
    .first();
  if ((await checkoutCta.count().catch(() => 0)) === 0) {
    result.steps.push({ step: "proceed-to-checkout", skipped: true, reason: "no checkout-like control found on basket page" });
    return result;
  }
  const reachedDelivery = await clickAndWaitForNavigation(page, checkoutCta);
  result.steps.push({ step: "proceed-to-checkout", ok: reachedDelivery, url: page.url() });
  if (!reachedDelivery) return result;

  // --- Delivery details: fill, submit, retry with safe values if rejected ---
  const deliveryUrlBefore = page.url();
  const continueBtn = page.getByRole("button", { name: /continue|next|proceed/i }).first();
  if ((await continueBtn.count().catch(() => 0)) === 0) {
    result.steps.push({ step: "delivery-form", skipped: true, reason: "no continue/submit control found" });
    return result;
  }

  await fillFieldsByPattern(page, DELIVERY_FIELDS_AWKWARD);
  let advanced = await clickAndWaitForNavigation(page, continueBtn);
  const bannerAfterFirstTry = await page.locator('[id*="banner" i], .banner-error').first().textContent().catch(() => null);
  result.steps.push({
    step: "delivery-form-attempt-1",
    valuesUsed: "deliberately-awkward (apostrophe/hyphen name, UK mobile, single-digit house number)",
    advanced,
    stillOnDeliveryPage: page.url() === deliveryUrlBefore,
    bannerText: bannerAfterFirstTry,
  });

  if (!advanced) {
    // Awkward values got rejected (or something else went wrong) — retry
    // with conservative values so the walkthrough can still reach the pages
    // that are the actual point of this scanner.
    await fillFieldsByPattern(page, DELIVERY_FIELDS_SAFE);
    advanced = await clickAndWaitForNavigation(page, continueBtn);
    result.steps.push({ step: "delivery-form-attempt-2-safe-fallback", advanced, url: page.url() });
  }
  if (!advanced) {
    result.steps.push({ step: "delivery-form", failed: true, reason: "could not advance past delivery form with either awkward or safe values" });
    return result;
  }

  // --- Checkout payment: capture evidence for the page itself (structurally
  // unreachable by link-crawling), then fill and submit ---
  const paymentManifest = await capturePageEvidence(page, { url: page.url(), reachedVia: "checkout-walkthrough" }).catch((err) => {
    result.steps.push({ step: "capture-payment-page", failed: true, reason: String(err.message || err) });
    return null;
  });
  if (paymentManifest) {
    result.reachedPages.push(paymentManifest);
    result.steps.push({ step: "capture-payment-page", ok: true, url: paymentManifest.url });
  }

  const placeOrderBtn = page.getByRole("button", { name: /place order|pay now|submit order|confirm order|^pay$/i }).first();
  if ((await placeOrderBtn.count().catch(() => 0)) === 0) {
    result.steps.push({ step: "payment-form", skipped: true, reason: "no place-order-like control found" });
    return result;
  }
  await fillFieldsByPattern(page, PAYMENT_FIELDS);
  const placedOrder = await clickAndWaitForNavigation(page, placeOrderBtn);
  const paymentBannerText = await page.locator('[id*="banner" i], .banner-error').first().textContent().catch(() => null);
  result.steps.push({ step: "place-order", ok: placedOrder, url: page.url(), bannerText: placedOrder ? null : paymentBannerText });
  if (!placedOrder) return result;

  // --- Confirmation: also structurally unreachable by link-crawling
  // (reached only via the JS redirect above, with the new order's id) ---
  const confirmationManifest = await capturePageEvidence(page, { url: page.url(), reachedVia: "checkout-walkthrough" }).catch((err) => {
    result.steps.push({ step: "capture-confirmation-page", failed: true, reason: String(err.message || err) });
    return null;
  });
  if (confirmationManifest) {
    result.reachedPages.push(confirmationManifest);
    result.steps.push({ step: "capture-confirmation-page", ok: true, url: confirmationManifest.url });
  }

  // --- Leave the basket non-empty for the main crawl's own basket.html
  // capture: on BrightBasket (and plausibly similar apps) the empty-basket
  // view renders a materially different, much smaller DOM than the populated
  // view (no discount form, no per-line quantity control, no shipping-note
  // helper text) — placing an order clears the basket, so without this step
  // basket.html would be captured empty immediately afterward regardless of
  // this scanner's fix, hiding most of that page's real surface again. ---
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  const shopLinkAgain = page.getByRole("link", { name: /^(shop|catalog|products|browse)/i }).first();
  if ((await shopLinkAgain.count().catch(() => 0)) > 0) {
    await shopLinkAgain.click().catch(() => {});
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  const addBtnAgain = addToBasketButton(page);
  if ((await addBtnAgain.count().catch(() => 0)) > 0) {
    await addBtnAgain.click().catch(() => {});
    await page.waitForTimeout(500);
    result.steps.push({ step: "leave-basket-non-empty", ok: true });
  } else {
    result.steps.push({ step: "leave-basket-non-empty", skipped: true, reason: "no enabled add-to-basket control found on second pass" });
  }

  return result;
}
