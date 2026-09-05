import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EvidenceBundle, slugForUrl } from "./evidence/bundleBuilder.js";
import { runCrawler, reachPage } from "./scanners/crawler.js";
import { attachConsoleNetworkCapture } from "./scanners/consoleNetwork.js";
import { runAccessibilityScan } from "./scanners/accessibility.js";
import { extractVisualFacts, compareToGolden } from "./scanners/visualConsistency.js";
import { extractNav, compareNavToGolden } from "./scanners/navConsistency.js";
import { runFormValidationProbe } from "./scanners/formValidation.js";
import { extractContent } from "./scanners/contentExtractor.js";
import { runCrudSmoke } from "./scanners/crudSmoke.js";
import { runInteractionProbe, probeCheckboxRoundTrip } from "./scanners/interactionProbe.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Pages that share a pathname but differ only by query string (e.g.
 * item.html?id=w-001 vs item.html?id=w-021) are structurally the same template
 * — deep-reviewing every instance wastes AI budget without adding detection
 * value. Keep one representative per pathname for the full evidence/AI pass;
 * record the rest as variants for transparency. The crawler's own broken-link/
 * asset results (crawler-report.json) already cover every instance regardless.
 */
function dedupePagesByPathname(pages) {
  const byPathname = new Map();
  for (const p of pages) {
    let key;
    try {
      key = new URL(p.url).pathname;
    } catch {
      key = p.url;
    }
    if (!byPathname.has(key)) {
      byPathname.set(key, { ...p, variantUrls: [p.url] });
    } else {
      byPathname.get(key).variantUrls.push(p.url);
    }
  }
  return Array.from(byPathname.values());
}

/** Navigates to a crawled page for evidence capture, using click-path
 * reconstruction (see crawler.js's reachPage) when the page isn't directly
 * navigable by URL — the same fallback the crawler itself used to discover it. */
async function gotoPageRecord(page, record) {
  if (!record.clickPath || record.clickPath.length === 0) {
    return page.goto(record.url, { waitUntil: "networkidle", timeout: 20000 });
  }
  return reachPage(page, { rootUrl: record.rootUrl, clickPath: record.clickPath }, { timeout: 20000 });
}

/**
 * Best-effort generic login: some sites don't honor a pre-set session cookie
 * on load — the client-side app only navigates away from the login view in
 * response to an actual form submission (discovered pointing this at Sauce
 * Demo — see FINDINGS.md). Uses a password-type input as the reliable anchor
 * (there's no ambiguity about which field that is) and the first visible
 * text/email input on the same form as the username field, rather than any
 * site-specific selector.
 */
async function performLoginBootstrap(context, { loginUrl, loginUsername, loginPassword }) {
  const page = await context.newPage();
  await page.goto(loginUrl, { waitUntil: "networkidle", timeout: 20000 });

  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.waitFor({ timeout: 10000 });
  const usernameField = page
    .locator('input[type="text"], input[type="email"], input:not([type])')
    .first();

  await usernameField.fill(loginUsername);
  await passwordField.fill(loginPassword);

  const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
  if ((await submitBtn.count()) > 0) {
    await submitBtn.click();
  } else {
    await passwordField.press("Enter");
  }
  await page.waitForLoadState("networkidle").catch(() => {});

  return { page, landedUrl: page.url() };
}

export async function runScan(config) {
  const runDir = path.join(__dirname, "..", "runs", config.runId);
  const bundle = new EvidenceBundle(runDir);

  const browser = await chromium.launch();
  const contextOptions = { viewport: { width: 1280, height: 900 } };
  if (config.storageStatePath) {
    console.log(`[scan] loading pre-authenticated storage state from ${config.storageStatePath}`);
    contextOptions.storageState = config.storageStatePath;
  }
  const context = await browser.newContext(contextOptions);

  let crawlStartUrl = config.baseUrl;
  let loginPage = null;
  if (config.loginUrl) {
    console.log(`[scan] performing login bootstrap at ${config.loginUrl} ...`);
    const loginResult = await performLoginBootstrap(context, config);
    crawlStartUrl = loginResult.landedUrl;
    loginPage = loginResult.page;
    console.log(`[scan] login landed on ${crawlStartUrl}, crawling from there`);
  }

  console.log(`[scan] crawling from ${crawlStartUrl} ...`);
  const crawlResult = await runCrawler(context, crawlStartUrl, { existingPage: loginPage });
  bundle.writeJson("crawler-report.json", crawlResult);
  console.log(
    `[scan] discovered ${crawlResult.pages.length} pages, ${crawlResult.brokenLinks.length} broken links, ${crawlResult.brokenAssets.length} broken assets` +
      (crawlResult.spaRoutedPages.length ? `, ${crawlResult.spaRoutedPages.length} reached via SPA click-path reconstruction` : "")
  );

  const goldenUrl = new URL(config.goldenPath, config.baseUrl + "/").toString();

  // Golden facts pass (no evidence capture needed beyond the facts themselves).
  // If the golden page turned out to be an SPA-routed view (not directly
  // navigable — the crawler already worked that out while discovering it),
  // reuse its click-path reconstruction instead of a plain goto that would 404.
  console.log(`[scan] extracting golden reference facts from ${goldenUrl} ...`);
  const goldenRecord = crawlResult.allVisited.find((p) => p.url === goldenUrl);
  const goldenPage = await context.newPage();
  if (goldenRecord) {
    await gotoPageRecord(goldenPage, goldenRecord);
  } else {
    await goldenPage.goto(goldenUrl, { waitUntil: "networkidle" });
  }
  const goldenVisualFacts = await extractVisualFacts(goldenPage);
  const goldenNav = await extractNav(goldenPage);
  await goldenPage.close();

  const pageSummaries = [];
  const dedupedPages = dedupePagesByPathname(crawlResult.pages);
  console.log(`[scan] ${crawlResult.pages.length} URLs crawled, deduped to ${dedupedPages.length} distinct templates for the evidence/AI pass`);

  for (const pageRecord of dedupedPages) {
    const { url, variantUrls } = pageRecord;
    const slug = slugForUrl(config.baseUrl, url);
    console.log(`[scan] page: ${url}${pageRecord.reachedVia === "client-side-navigation" ? " (SPA-routed, reached via click-path replay)" : ""}`);
    const page = await context.newPage();
    const capture = attachConsoleNetworkCapture(page);

    let navError = null;
    try {
      await gotoPageRecord(page, pageRecord);
    } catch (err) {
      navError = String(err.message || err);
    }

    // Read-only measurements run concurrently against a pristine page. formValidation
    // is NOT included here — it clicks/submits/mutates the DOM, and running it
    // concurrently with axe/screenshot/content extraction produced non-deterministic
    // races (e.g. axe scanning mid form-clear). It runs afterward, alone, on purpose.
    // caret: 'initial' disables Playwright's default caret-hiding behavior for
    // screenshots, which otherwise injects a transient `caret-color: transparent
    // !important` style into every text input for the duration of the capture.
    // Running that concurrently with page.content() below caught this mid-mutation
    // and captured it as if it were real production markup — a phantom finding
    // the AI review treated as a serious, systemic, cross-page bug.
    const [screenshot, domSnapshot, visualFacts, nav, content, a11y] = await Promise.all([
      page.screenshot({ fullPage: true, caret: "initial" }).catch(() => null),
      page.content().catch(() => null),
      extractVisualFacts(page).catch(() => null),
      extractNav(page).catch(() => null),
      extractContent(page).catch(() => null),
      runAccessibilityScan(page).catch((err) => ({ error: String(err.message || err) })),
    ]);

    const formProbe = await runFormValidationProbe(page).catch((err) => ({ error: String(err.message || err) }));

    // Interaction probing runs after evidence capture (it clicks/types/mutates
    // the page) and after formValidation (both mutate, so keep them sequential
    // and off the golden-page pass — golden has none of these controls).
    let interactionProbe = { directionalControls: [], searchProbes: [], paginationProbes: [] };
    let checkboxRoundTrip = [];
    if (!config.readOnly) {
      interactionProbe = await runInteractionProbe(page, url).catch((err) => ({ error: String(err.message || err) }));
      checkboxRoundTrip = await probeCheckboxRoundTrip(page, url).catch((err) => [{ error: String(err.message || err) }]);
    }

    const consoleNetworkResults = capture.getResults();
    const visualDeviations = visualFacts ? compareToGolden(visualFacts, goldenVisualFacts) : [];
    const navDeviations = nav ? compareNavToGolden(nav, goldenNav) : [];

    if (screenshot) bundle.writePageFile(slug, "screenshot-full.png", screenshot);
    if (domSnapshot) bundle.writePageFile(slug, "dom-snapshot.html", domSnapshot);
    if (content) bundle.writePageFile(slug, "text-content.txt", content.bodyText);
    bundle.writePageJson(slug, "console.json", consoleNetworkResults.consoleMessages);
    bundle.writePageJson(slug, "network.json", { failedRequests: consoleNetworkResults.failedRequests, badResponses: consoleNetworkResults.badResponses, pageErrors: consoleNetworkResults.pageErrors });
    bundle.writePageJson(slug, "accessibility.json", a11y);
    bundle.writePageJson(slug, "visual-facts.json", { facts: visualFacts, deviationsFromGolden: visualDeviations });
    bundle.writePageJson(slug, "nav.json", { nav, deviationsFromGolden: navDeviations });
    bundle.writePageJson(slug, "form-validation.json", formProbe);
    bundle.writePageJson(slug, "interaction-probe.json", { ...interactionProbe, checkboxRoundTrip });

    const manifest = {
      url,
      slug,
      reachedVia: pageRecord.reachedVia || "direct-nav",
      otherUrlsSharingThisTemplate: variantUrls.filter((u) => u !== url),
      title: content?.title || null,
      navError,
      headings: content?.headings || [],
      badgeLikeText: content?.badgeLike || [],
      footerText: content?.footerText || null,
      consoleErrorCount: consoleNetworkResults.consoleMessages.filter((m) => m.type === "error").length,
      consoleWarningCount: consoleNetworkResults.consoleMessages.filter((m) => m.type === "warning").length,
      pageErrorCount: consoleNetworkResults.pageErrors.length,
      badResponseCount: consoleNetworkResults.badResponses.length,
      failedRequestCount: consoleNetworkResults.failedRequests.length,
      accessibilityViolationCount: Array.isArray(a11y.violations) ? a11y.violations.length : null,
      accessibilityViolations: a11y.violations || [],
      visualDeviationsFromGolden: visualDeviations,
      navDeviationsFromGolden: navDeviations,
      formValidationFindings: formProbe,
      interactionProbeFindings: { ...interactionProbe, checkboxRoundTrip },
      evidenceFiles: {
        screenshot: `pages/${slug}/screenshot-full.png`,
        domSnapshot: `pages/${slug}/dom-snapshot.html`,
        textContent: `pages/${slug}/text-content.txt`,
      },
    };
    bundle.writePageJson(slug, "manifest.json", manifest);
    pageSummaries.push(manifest);

    await page.close();
  }

  let crudSmokeResult = null;
  if (!config.readOnly) {
    console.log(`[scan] running CRUD smoke flow (this mutates state on the target site) ...`);
    // Deduped page list (one URL per template) — scoring create/list-page candidates
    // against all 23 raw crawled URLs (many just differing by ?id=) wastes several
    // dozen redundant navigations for zero extra signal.
    crudSmokeResult = await runCrudSmoke(context, config.baseUrl, dedupedPages);
    bundle.writeJson("crud-smoke.json", crudSmokeResult);
  } else {
    console.log(`[scan] --read-only set, skipping CRUD smoke flow`);
  }

  await browser.close();

  const summary = {
    runId: config.runId,
    baseUrl: config.baseUrl,
    goldenUrl,
    scannedAt: new Date().toISOString(),
    pagesScanned: pageSummaries.length,
    totalBrokenLinks: crawlResult.brokenLinks.length,
    totalBrokenAssets: crawlResult.brokenAssets.length,
    totalConsoleErrors: pageSummaries.reduce((s, p) => s + p.consoleErrorCount, 0),
    totalAccessibilityViolations: pageSummaries.reduce((s, p) => s + (p.accessibilityViolationCount || 0), 0),
    totalVisualDeviations: pageSummaries.reduce((s, p) => s + p.visualDeviationsFromGolden.length, 0),
    crudSmokeRan: !config.readOnly,
  };
  bundle.writeJson("summary.json", summary);
  bundle.writeJson("meta.json", {
    runId: config.runId,
    baseUrl: config.baseUrl,
    goldenUrl,
    checklistPath: config.checklistPath,
    charterPath: config.charterPath,
    appDescPath: config.appDescPath,
    startedAt: summary.scannedAt,
  });

  console.log(`[scan] done. Evidence written to ${runDir}`);
  return { runDir, bundle, pageSummaries, crawlResult, summary, crudSmokeResult, goldenVisualFacts, goldenNav };
}
