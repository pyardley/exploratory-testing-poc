const MAX_PAGES = 50;
const MAX_CLICK_CANDIDATES_PER_PAGE = 25;

function toAbsolute(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function isSameOrigin(baseUrl, url) {
  try {
    return new URL(url).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

/**
 * Reconstructs a "logical page" that isn't independently navigable by URL —
 * client-side-routed SPAs often update the address bar via history.pushState
 * without there being any real server resource behind it (direct navigation
 * 404s), and often route via onClick handlers on elements whose href is a
 * meaningless "#" (or missing entirely), not a real href at all. Discovered
 * the hard way pointing this tool at a genuinely different external site
 * (Sauce Demo) — see FINDINGS.md. Works by navigating to the nearest
 * ancestor that IS directly reachable, then replaying the exact sequence of
 * element clicks that originally reached this page — each clickPath entry is
 * a full, ready-to-use CSS selector (built once at discovery time), not a
 * raw href, so both "real link" and "click-handler-only" steps replay the
 * same way.
 *
 * Traditional multi-page sites never hit this path at all: clickPath stays
 * empty for every page whose URL works via direct navigation, which is the
 * common case and preserves prior behavior/performance unchanged.
 */
export async function reachPage(page, record, { timeout = 15000 } = {}) {
  if (!record.clickPath || record.clickPath.length === 0) {
    return page.goto(record.rootUrl, { waitUntil: "networkidle", timeout });
  }
  await page.goto(record.rootUrl, { waitUntil: "networkidle", timeout });
  for (const selector of record.clickPath) {
    // eslint-disable-next-line no-await-in-loop
    await page.locator(selector).first().click({ timeout });
    // eslint-disable-next-line no-await-in-loop
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  return null; // no Response object for a click-reconstructed page; absence of a throw is success
}

/** A stable, replayable CSS selector for an element, preferring the most
 * specific identifier actually present rather than assuming any one
 * attribute convention. */
function selectorForCandidate({ href, id, dataTest, dataTestid }) {
  if (id) return `#${id}`;
  if (dataTestid) return `[data-testid="${dataTestid}"]`;
  if (dataTest) return `[data-test="${dataTest}"]`;
  if (href) return `a[href="${href}"]`;
  return null;
}

/**
 * BFS same-origin crawl from baseUrl. Discovers linked pages (for the per-page
 * evidence loop) and checks every internal <a>, <img>, and script/link asset for
 * a broken (>=400) response. Read-only for real hrefs; for click-handler-only
 * navigation (href="#" or no href, with a stable id/data-test attribute — the
 * common React/SPA pattern) it performs a real click to discover where it
 * leads, since there's no static attribute that would reveal that otherwise.
 *
 * `existingPage`, if provided, is already sitting on `baseUrl` (e.g. having
 * just completed a login flow whose landing view has no real server-side
 * route of its own — a genuine 404 on ANY direct navigation, authenticated or
 * not, not just an auth gate). The crawler then treats that first stop as
 * already-reached rather than re-navigating to a URL that would 404 even
 * fresh off a successful login.
 */
export async function runCrawler(context, baseUrl, { existingPage = null } = {}) {
  const visited = new Map(); // url -> page record
  const queue = [{ url: baseUrl, rootUrl: baseUrl, clickPath: [] }];
  const pages = [];
  const brokenLinks = [];
  const brokenAssets = [];
  const checkedAssets = new Set();
  const spaRoutedPages = [];

  const page = existingPage || (await context.newPage());
  let firstIteration = true;

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const record = queue.shift();
    if (visited.has(record.url)) continue;

    const reuseCurrentPosition = firstIteration && existingPage && page.url() === record.url;
    firstIteration = false;

    let response = null;
    let reachedVia = "direct-nav";
    if (reuseCurrentPosition) {
      reachedVia = "already-positioned";
      response = { status: () => 200, headers: () => ({ "content-type": "text/html" }) };
    } else {
      try {
        response = await page.goto(record.url, { waitUntil: "networkidle", timeout: 15000 });
      } catch {
        response = null;
      }
    }
    let status = response ? response.status() : null;

    if ((!response || status >= 400) && record.clickPath.length === 0) {
      // First failure for this URL: nothing to fall back to yet at the root
      // level. It'll get a real clickPath if some OTHER page links to it —
      // for now, record the direct-nav failure honestly.
      visited.set(record.url, record);
      brokenLinks.push({ url: record.url, status: status ?? undefined, error: response ? undefined : "navigation failed" });
      continue;
    }
    if (!response || status >= 400) {
      // Direct nav failed but we have a click path from a known-good ancestor — try it.
      try {
        await reachPage(page, record);
        reachedVia = "client-side-navigation";
        status = 200;
      } catch (err) {
        visited.set(record.url, record);
        brokenLinks.push({ url: record.url, error: `click-path reconstruction failed: ${String(err.message || err)}` });
        continue;
      }
    }

    visited.set(record.url, { ...record, reachedVia });
    const contentType = response ? response.headers()["content-type"] || "" : "text/html";
    const actualUrl = page.url(); // may differ from record.url for SPA-routed views
    pages.push({ url: record.url, actualUrl, status: status ?? 200, contentType, reachedVia, rootUrl: record.rootUrl, clickPath: record.clickPath });
    if (reachedVia === "client-side-navigation") spaRoutedPages.push(record.url);

    if (!contentType.includes("text/html") && contentType !== "") continue;

    // Fast path: real, directly-usable hrefs — no click needed to know the target.
    const realLinks = await page.$$eval('a[href]:not([href="#"])', (as) =>
      as.map((a) => ({ href: a.getAttribute("href"), id: a.id, dataTest: a.getAttribute("data-test"), dataTestid: a.getAttribute("data-testid") }))
    );
    for (const link of realLinks) {
      const { href } = link;
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      const abs = toAbsolute(actualUrl, href);
      if (abs && isSameOrigin(baseUrl, abs) && !visited.has(abs.split("#")[0])) {
        queue.push({
          url: abs.split("#")[0],
          rootUrl: record.rootUrl,
          clickPath: [...record.clickPath, selectorForCandidate(link)],
        });
      }
    }

    // Click-test path: href="#" or missing-href elements with a stable
    // identifier — the only way to know where they lead is to actually click
    // and see. Bounded per page since each candidate costs a real round trip.
    const clickCandidates = await page.$$eval(
      'a[href="#"], a:not([href]), [data-test*="link" i]:not(a)',
      (els) =>
        els
          .map((el) => ({ id: el.id, dataTest: el.getAttribute("data-test"), dataTestid: el.getAttribute("data-testid") }))
          .filter((c) => c.id || c.dataTest || c.dataTestid)
    );
    const seenSelectors = new Set(record.clickPath);
    let tested = 0;
    for (const candidate of clickCandidates) {
      if (tested >= MAX_CLICK_CANDIDATES_PER_PAGE) break;
      const selector = selectorForCandidate(candidate);
      if (!selector || seenSelectors.has(selector)) continue;
      seenSelectors.add(selector);
      tested += 1;

      const urlBefore = page.url();
      let clickedOk = true;
      try {
        await page.locator(selector).first().click({ timeout: 5000 });
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      } catch {
        clickedOk = false;
      }
      const urlAfter = clickedOk ? page.url() : urlBefore;

      if (clickedOk && urlAfter !== urlBefore && isSameOrigin(baseUrl, urlAfter)) {
        const cleanUrl = urlAfter.split("#")[0];
        if (!visited.has(cleanUrl)) {
          queue.push({ url: cleanUrl, rootUrl: record.rootUrl, clickPath: [...record.clickPath, selector] });
        }
      }

      // Return to this page's position before testing the next candidate —
      // via the same click-path that got us here, since a plain goto(record.url)
      // would just 404 again for SPA-routed pages.
      if (clickedOk && urlAfter !== urlBefore) {
        // eslint-disable-next-line no-await-in-loop
        await reachPage(page, record).catch(() => {});
      }
    }

    const assetUrls = await page.$$eval("img[src], script[src], link[rel='stylesheet'][href]", (els) =>
      els.map((el) => el.getAttribute("src") || el.getAttribute("href"))
    );
    for (const assetHref of assetUrls) {
      if (!assetHref) continue;
      const abs = toAbsolute(actualUrl, assetHref);
      if (!abs || !isSameOrigin(baseUrl, abs) || checkedAssets.has(abs)) continue;
      checkedAssets.add(abs);
      try {
        const assetRes = await context.request.get(abs);
        if (assetRes.status() >= 400) {
          brokenAssets.push({ url: abs, status: assetRes.status(), foundOnPage: record.url });
        }
      } catch (err) {
        brokenAssets.push({ url: abs, error: String(err.message || err), foundOnPage: record.url });
      }
    }
  }

  await page.close();

  return {
    pages: pages.filter((p) => p.contentType.includes("text/html") && p.status < 400),
    allVisited: pages,
    brokenLinks,
    brokenAssets,
    spaRoutedPages,
  };
}
