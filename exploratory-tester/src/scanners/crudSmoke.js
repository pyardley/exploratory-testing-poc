/**
 * Drives real Create/Update/Delete flows through the UI (not the API directly)
 * so UI-level CRUD bugs are caught, not just backend ones. Uses generic
 * heuristics (accessible names, common field patterns) rather than hardcoded
 * selectors, since exploratory-tester is meant to run against any similarly-
 * shaped CRUD app — tuned against WidgetWorks but not WidgetWorks-specific.
 *
 * This scanner MUTATES state on the target site (it creates/edits/deletes real
 * records). Only run it against a test/staging environment, never production —
 * see --read-only in the CLI to skip it.
 */

/**
 * Score every crawled page for how likely it is to be a "create new record" form,
 * and return the best match rather than the first plausible one. A naive first-
 * match on "has a form with a Save-like button" false-positived on an account/
 * settings form (also has a Save button) before ever reaching the real create
 * page — URL wording and button wording ("add"/"create"/"new" vs generic "save")
 * are much stronger signals than "has a submit button" alone.
 */
async function findCreatePage(page, candidatePages) {
  let best = null;
  let bestScore = 0;

  for (const { url } of candidatePages) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
    const hasForm = (await page.locator("form").count()) > 0;
    if (!hasForm) continue;

    const textInputCount = await page.locator('input[type="text"], input:not([type])').count();
    if (textInputCount < 1) continue;

    let score = 1;
    if (/new|create|add/i.test(url)) score += 5;
    const strongButton = await page
      .getByRole("button", { name: /^(add|create)\b/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (strongButton) score += 3;
    const weakButton = await page
      .getByRole("button", { name: /^save\b/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (weakButton) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = url;
    }
  }
  return best;
}

async function fillFormGenerically(page, tagValue) {
  const textInputs = page.locator('form input[type="text"], form input:not([type]), form textarea');
  const count = await textInputs.count();
  for (let i = 0; i < count; i += 1) {
    const el = textInputs.nth(i);
    const idOrPlaceholder = ((await el.getAttribute("id")) || (await el.getAttribute("placeholder")) || "").toLowerCase();
    if (i === 0) {
      await el.fill(tagValue);
    } else if (idOrPlaceholder.includes("price")) {
      await el.fill("9.99");
    } else if (idOrPlaceholder.includes("weight")) {
      await el.fill("1");
    } else {
      await el.fill("Exploratory tester probe value");
    }
  }
}

/**
 * Same scoring approach as findCreatePage: a page with 3 static feature cards
 * (e.g. a homepage "why choose us" section) can satisfy a naive ">=3 repeated
 * elements" check before the real list/catalog page does. Require the repeated
 * elements to actually be links to other pages (a real list links to detail
 * pages; a static feature grid doesn't), and weight URL wording and higher
 * item counts.
 */
async function findListPage(page, candidatePages, baseUrl) {
  let best = null;
  let bestScore = 0;

  for (const { url } of candidatePages) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
    const cardLinkCount = await page.locator(".card a[href], a[href] .card, .grid a[href]").count();
    if (cardLinkCount < 3) continue;

    let score = cardLinkCount;
    if (/catalog|list|products|items|browse/i.test(url)) score += 10;

    if (score > bestScore) {
      bestScore = score;
      best = url;
    }
  }
  return best || baseUrl;
}

async function findFirstItemLink(page, listUrl) {
  await page.goto(listUrl, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  const link = page.locator(".card a, a .card, .grid a").first();
  const href = await link.getAttribute("href").catch(() => null);
  if (href) return new URL(href, listUrl).toString();
  return null;
}

export async function runCrudSmoke(context, baseUrl, candidatePages) {
  const page = await context.newPage();
  const dialogMessages = [];
  page.on("dialog", async (dialog) => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });

  const result = { steps: [], dialogMessages };
  const tag = `ZZZ-PROBE-${Date.now()}`;

  // --- CREATE ---
  const createUrl = await findCreatePage(page, candidatePages);
  if (createUrl) {
    await page.goto(createUrl, { waitUntil: "networkidle" });
    await fillFormGenerically(page, tag);
    const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await submitBtn.click().catch(() => {});
    await page.waitForTimeout(600);
    const afterCreateUrl = page.url();
    result.steps.push({ step: "create", formUrl: createUrl, tagValue: tag, navigatedTo: afterCreateUrl });

    const listUrl = await findListPage(page, candidatePages, baseUrl);
    await page.goto(listUrl, { waitUntil: "networkidle" });
    const foundAfterCreate = (await page.locator(`text=${tag}`).count()) > 0;
    result.steps.push({ step: "read-after-create", listUrl, foundOnListPage: foundAfterCreate });
  } else {
    result.steps.push({ step: "create", skipped: true, reason: "no create-like form found among crawled pages" });
  }

  // --- UPDATE ---
  const listUrl = await findListPage(page, candidatePages, baseUrl);
  const beforeSnapshot = await page.locator("body").innerText();
  const itemUrl = await findFirstItemLink(page, listUrl);
  let editUrl = null;
  let originalName = null;

  if (itemUrl) {
    await page.goto(itemUrl, { waitUntil: "networkidle" }).catch(() => null);
    await page.locator("h1").first().filter({ hasNotText: "" }).waitFor({ timeout: 5000 }).catch(() => null);
    originalName = (await page.locator("h1").first().textContent().catch(() => null))?.trim() || null;
    const editLink = page.getByRole("link", { name: /edit/i }).first();
    const editHref = await editLink.getAttribute("href").catch(() => null);
    if (editHref) editUrl = new URL(editHref, itemUrl).toString();
  }

  if (editUrl) {
    await page.goto(editUrl, { waitUntil: "networkidle" });
    const updatedTag = `${tag}-UPDATED`;
    await fillFormGenerically(page, updatedTag);
    const saveBtn = page.getByRole("button", { name: /^save/i }).first();
    await saveBtn.click().catch(() => {});
    await page.waitForTimeout(600);

    await page.goto(listUrl, { waitUntil: "networkidle" });
    const afterSnapshot = await page.locator("body").innerText();

    const updatedNameVisible = afterSnapshot.includes(updatedTag);
    const originalStillPresentElsewhere = originalName ? afterSnapshot.includes(originalName) : null;

    result.steps.push({
      step: "update",
      editUrl,
      originalName,
      updatedTag,
      updatedValueVisibleOnListAfterUpdate: updatedNameVisible,
      snapshotChanged: beforeSnapshot !== afterSnapshot,
      note: "Compare updatedTag visibility and originalName persistence manually / via AI review — a generic diff can suggest but not prove which specific record changed.",
    });
  } else {
    result.steps.push({ step: "update", skipped: true, reason: "could not find an item detail + edit link from the list page" });
  }

  // --- DELETE ---
  const itemUrlForDelete = await findFirstItemLink(page, listUrl);
  let deletedItemName = null;
  let deleteEditUrl = null;
  if (itemUrlForDelete) {
    await page.goto(itemUrlForDelete, { waitUntil: "networkidle" }).catch(() => null);
    await page.locator("h1").first().filter({ hasNotText: "" }).waitFor({ timeout: 5000 }).catch(() => null);
    deletedItemName = (await page.locator("h1").first().textContent().catch(() => null))?.trim() || null;
    const editLink = page.getByRole("link", { name: /edit/i }).first();
    const editHref = await editLink.getAttribute("href").catch(() => null);
    if (editHref) deleteEditUrl = new URL(editHref, itemUrlForDelete).toString();
  }

  if (deleteEditUrl) {
    await page.goto(deleteEditUrl, { waitUntil: "networkidle" });
    const deleteBtn = page.getByRole("button", { name: /delete|remove/i }).first();
    const hasDeleteBtn = await deleteBtn.isVisible().catch(() => false);
    if (hasDeleteBtn) {
      const dialogCountBefore = dialogMessages.length;
      await deleteBtn.click().catch(() => {});
      await page.waitForTimeout(600);
      const dialogMessage = dialogMessages[dialogCountBefore] || null;

      // Same-session reload (stale-cache check)
      await page.goto(listUrl, { waitUntil: "networkidle" }).catch(() => null);
      const stillVisibleSameSession = deletedItemName ? (await page.locator("body").innerText()).includes(deletedItemName) : null;

      // Fresh context reload (true-persistence check)
      const freshContext = await context.browser().newContext();
      const freshPage = await freshContext.newPage();
      await freshPage.goto(listUrl, { waitUntil: "networkidle" }).catch(() => null);
      const stillVisibleFreshSession = deletedItemName ? (await freshPage.locator("body").innerText()).includes(deletedItemName) : null;
      await freshContext.close();

      result.steps.push({
        step: "delete",
        deleteEditUrl,
        deletedItemName,
        confirmDialogMessage: dialogMessage,
        stillVisibleInSameSessionAfterDelete: stillVisibleSameSession,
        stillVisibleInFreshSessionAfterDelete: stillVisibleFreshSession,
      });
    } else {
      result.steps.push({ step: "delete", skipped: true, reason: "no delete/remove button found on edit page" });
    }
  } else {
    result.steps.push({ step: "delete", skipped: true, reason: "could not find a second item to test deletion on" });
  }

  await page.close();
  return result;
}
