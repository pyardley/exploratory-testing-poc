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

/** Up to `count` distinct item detail links from the list page, for testing
 * update against more than one record — a single record can accidentally
 * land on the correct index and hide an index-vs-id bug that only some
 * records trigger (see README.md Recommendations #2). */
async function findMultipleItemLinks(page, listUrl, count) {
  await page.goto(listUrl, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  const hrefs = await page.locator(".card a[href], a[href] .card, .grid a[href]").evaluateAll((els) =>
    els.map((el) => (el.tagName === "A" ? el.getAttribute("href") : el.closest("a")?.getAttribute("href"))).filter(Boolean)
  );
  const unique = [...new Set(hrefs)];
  // Keep the raw href alongside the resolved URL so callers can match it back
  // against snapshotListItems()'s map keys (which use the same raw href) without
  // any relative/absolute URL reconstruction guesswork.
  return unique.slice(0, count).map((href) => ({ href, url: new URL(href, listUrl).toString() }));
}

/** {href: visibleText} snapshot of every list-item link, used to detect when
 * saving one record silently changed a DIFFERENT one. Deliberately bypasses
 * any client-side caching (sessionStorage/localStorage) before reading — a
 * page that caches its list client-side (a legitimate, separate finding in
 * its own right, tested elsewhere) would otherwise make every snapshot in
 * this diff read identical stale data regardless of what actually changed
 * server-side, masking exactly the bug this function exists to catch. */
async function snapshotListItems(page, listUrl) {
  await page.goto(listUrl, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  await page
    .evaluate(() => {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {
        /* storage may be unavailable (e.g. sandboxed iframe) — fine to ignore */
      }
    })
    .catch(() => {});
  await page.reload({ waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  const items = await page.locator(".card a[href], a[href] .card, .grid a[href]").evaluateAll((els) =>
    els.map((el) => {
      const anchor = el.tagName === "A" ? el : el.closest("a");
      return { href: anchor?.getAttribute("href") || null, text: el.textContent.trim() };
    })
  );
  const byHref = new Map();
  for (const item of items) {
    if (item.href && !byHref.has(item.href)) byHref.set(item.href, item.text);
  }
  return byHref;
}

/** Clicks a "Next"-like control once and reports whether it actually moved
 * to different content — honest about pagination being unreachable rather
 * than silently only ever testing page 1 (see README.md Recommendations #2). */
async function attemptToReachPage2(page, listUrl) {
  await page.goto(listUrl, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
  const nextButton = page.getByRole("button", { name: /^next\b/i }).or(page.getByRole("link", { name: /^next\b/i }));
  if ((await nextButton.count().catch(() => 0)) === 0) {
    return { attempted: false, reached: false, reason: "no Next-like control found" };
  }
  const before = await page.locator("body").innerText();
  await nextButton.first().click().catch(() => {});
  await page.waitForTimeout(400);
  const after = await page.locator("body").innerText();
  const reached = before !== after;
  let page2ItemUrl = null;
  if (reached) {
    const href = await page.locator(".card a[href], a[href] .card, .grid a[href]").first().getAttribute("href").catch(() => null);
    if (href) page2ItemUrl = new URL(href, listUrl).toString();
  }
  return { attempted: true, reached, page2ItemUrl };
}

export async function runCrudSmoke(context, baseUrl, candidatePages) {
  const page = await context.newPage();
  const dialogMessages = [];
  page.on("dialog", async (dialog) => {
    dialogMessages.push(dialog.message());
    await dialog.accept();
  });

  const result = { steps: [], dialogMessages };
  // "AAA-" (not "ZZZ-") deliberately — on a list sorted alphabetically ascending
  // (a common default), a renamed record sorts to the very FRONT and stays on
  // page 1, where snapshotListItems() can actually see it changed. A "ZZZ-"
  // prefix sorts a renamed record to the far end instead, often pushing it off
  // a paginated first page entirely — making a real change look like nothing
  // happened, rather than like a change. Found by testing this against the app.
  const tag = `AAA-PROBE-${Date.now()}`;

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

  // --- UPDATE (against multiple distinct records) ---
  const listUrl = await findListPage(page, candidatePages, baseUrl);
  const itemLinks = await findMultipleItemLinks(page, listUrl, 3);

  if (itemLinks.length === 0) {
    result.steps.push({ step: "update", skipped: true, reason: "could not find any item detail links from the list page" });
  } else {
    for (const [index, { href: itemHref, url: itemUrl }] of itemLinks.entries()) {
      const beforeItems = await snapshotListItems(page, listUrl);

      await page.goto(itemUrl, { waitUntil: "networkidle" }).catch(() => null);
      await page.locator("h1").first().filter({ hasNotText: "" }).waitFor({ timeout: 5000 }).catch(() => null);
      const originalName = (await page.locator("h1").first().textContent().catch(() => null))?.trim() || null;
      const editLink = page.getByRole("link", { name: /edit/i }).first();
      const editHref = await editLink.getAttribute("href").catch(() => null);
      const editUrl = editHref ? new URL(editHref, itemUrl).toString() : null;

      if (!editUrl) {
        result.steps.push({ step: `update-${index}`, itemUrl, skipped: true, reason: "no edit link found from this item's detail page" });
        continue;
      }

      const updatedTag = `${tag}-UPDATED-${index}`;
      await page.goto(editUrl, { waitUntil: "networkidle" });
      await fillFormGenerically(page, updatedTag);
      const saveBtn = page.getByRole("button", { name: /^save/i }).first();
      await saveBtn.click().catch(() => {});
      await page.waitForTimeout(600);

      const afterItems = await snapshotListItems(page, listUrl);
      const intendedItemReflectsUpdate = (afterItems.get(itemHref) || "").includes(updatedTag);

      // Any OTHER record (not the one we intended to edit) whose displayed text
      // changed is a generic, deterministic signal of an index-vs-id style bug
      // like CRUD-04 — no knowledge of *why* it changed is needed to flag it.
      const otherRecordsThatChangedUnexpectedly = [];
      for (const [href, beforeText] of beforeItems) {
        if (href === itemHref) continue;
        const afterText = afterItems.get(href);
        if (afterText !== undefined && afterText !== beforeText) {
          otherRecordsThatChangedUnexpectedly.push({ href, beforeText, afterText });
        }
      }
      // Also check the reverse direction: a record that wasn't visible in this
      // view BEFORE (e.g. off the first page) but now carries updatedTag is the
      // wrong-record write landing somewhere that only became visible because
      // the rename itself changed its sort position — still the same bug class,
      // just missed by the "existing href changed" check above on its own.
      for (const [href, afterText] of afterItems) {
        if (href === itemHref || beforeItems.has(href)) continue;
        if (afterText.includes(updatedTag)) {
          otherRecordsThatChangedUnexpectedly.push({ href, beforeText: "(not visible in this view before the edit)", afterText });
        }
      }

      result.steps.push({
        step: `update-${index}`,
        itemUrl,
        editUrl,
        originalName,
        updatedTag,
        intendedItemReflectsUpdate,
        otherRecordsThatChangedUnexpectedly,
      });
    }

    // --- Rapid double-submit race test (on the last edited record's edit page) ---
    const lastEditUrl = result.steps.filter((s) => s.editUrl).slice(-1)[0]?.editUrl;
    if (lastEditUrl) {
      await page.goto(lastEditUrl, { waitUntil: "networkidle" }).catch(() => null);
      await fillFormGenerically(page, `${tag}-RACE`);
      const saveBtn = page.getByRole("button", { name: /^save/i }).first();
      let requestCount = 0;
      const onRequest = (req) => {
        if (req.method() !== "GET") requestCount += 1;
      };
      page.on("request", onRequest);
      await saveBtn.click().catch(() => {});
      const disabledImmediatelyAfterFirstClick = await saveBtn.isDisabled().catch(() => null);
      await saveBtn.click().catch(() => {}); // rapid second click before the first request resolves
      await page.waitForTimeout(600);
      page.off("request", onRequest);
      result.steps.push({
        step: "update-double-submit-race",
        editUrl: lastEditUrl,
        saveButtonDisabledAfterFirstClick: disabledImmediatelyAfterFirstClick,
        mutatingRequestsFiredFromTwoRapidClicks: requestCount,
      });
    }
  }

  // --- Reach beyond page 1 (honest about whether pagination is actually usable) ---
  const page2Attempt = await attemptToReachPage2(page, listUrl);
  if (page2Attempt.reached && page2Attempt.page2ItemUrl) {
    const res = await page.goto(page2Attempt.page2ItemUrl, { waitUntil: "networkidle", timeout: 15000 }).catch(() => null);
    result.steps.push({
      step: "read-beyond-page-1",
      ...page2Attempt,
      page2ItemLoadedOk: res ? res.status() < 400 : null,
    });
  } else {
    result.steps.push({ step: "read-beyond-page-1", ...page2Attempt });
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
