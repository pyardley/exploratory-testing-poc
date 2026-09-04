import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EvidenceBundle, slugForUrl } from "./evidence/bundleBuilder.js";
import { runCrawler } from "./scanners/crawler.js";
import { attachConsoleNetworkCapture } from "./scanners/consoleNetwork.js";
import { runAccessibilityScan } from "./scanners/accessibility.js";
import { extractVisualFacts, compareToGolden } from "./scanners/visualConsistency.js";
import { extractNav, compareNavToGolden } from "./scanners/navConsistency.js";
import { runFormValidationProbe } from "./scanners/formValidation.js";
import { extractContent } from "./scanners/contentExtractor.js";
import { runCrudSmoke } from "./scanners/crudSmoke.js";

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

export async function runScan(config) {
  const runDir = path.join(__dirname, "..", "runs", config.runId);
  const bundle = new EvidenceBundle(runDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  console.log(`[scan] crawling from ${config.baseUrl} ...`);
  const crawlResult = await runCrawler(context, config.baseUrl);
  bundle.writeJson("crawler-report.json", crawlResult);
  console.log(`[scan] discovered ${crawlResult.pages.length} pages, ${crawlResult.brokenLinks.length} broken links, ${crawlResult.brokenAssets.length} broken assets`);

  const goldenUrl = new URL(config.goldenPath, config.baseUrl + "/").toString();

  // Golden facts pass (no evidence capture needed beyond the facts themselves)
  console.log(`[scan] extracting golden reference facts from ${goldenUrl} ...`);
  const goldenPage = await context.newPage();
  await goldenPage.goto(goldenUrl, { waitUntil: "networkidle" });
  const goldenVisualFacts = await extractVisualFacts(goldenPage);
  const goldenNav = await extractNav(goldenPage);
  await goldenPage.close();

  const pageSummaries = [];
  const dedupedPages = dedupePagesByPathname(crawlResult.pages);
  console.log(`[scan] ${crawlResult.pages.length} URLs crawled, deduped to ${dedupedPages.length} distinct templates for the evidence/AI pass`);

  for (const { url, variantUrls } of dedupedPages) {
    const slug = slugForUrl(config.baseUrl, url);
    console.log(`[scan] page: ${url}`);
    const page = await context.newPage();
    const capture = attachConsoleNetworkCapture(page);

    let navError = null;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
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

    const manifest = {
      url,
      slug,
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
