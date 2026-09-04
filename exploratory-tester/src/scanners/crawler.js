const MAX_PAGES = 50;

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
 * BFS same-origin crawl from baseUrl. Discovers linked pages (for the per-page
 * evidence loop) and checks every internal <a>, <img>, and script/link asset for
 * a broken (>=400) response. Read-only — safe to run against any site.
 */
export async function runCrawler(context, baseUrl) {
  const visited = new Set();
  const queue = [baseUrl];
  const pages = [];
  const brokenLinks = [];
  const brokenAssets = [];
  const checkedAssets = new Set();

  const page = await context.newPage();

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    let response;
    try {
      response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    } catch (err) {
      brokenLinks.push({ url, error: String(err.message || err) });
      continue;
    }

    const status = response ? response.status() : null;
    const contentType = response ? response.headers()["content-type"] || "" : "";
    pages.push({ url, status, contentType });

    if (status && status >= 400) {
      brokenLinks.push({ url, status });
      continue;
    }
    if (!contentType.includes("text/html")) continue;

    const links = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    for (const href of links) {
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href === "#") continue;
      const abs = toAbsolute(url, href);
      if (abs && isSameOrigin(baseUrl, abs) && !visited.has(abs)) {
        queue.push(abs.split("#")[0]);
      }
    }

    const assetUrls = await page.$$eval("img[src], script[src], link[rel='stylesheet'][href]", (els) =>
      els.map((el) => el.getAttribute("src") || el.getAttribute("href"))
    );
    for (const assetHref of assetUrls) {
      if (!assetHref) continue;
      const abs = toAbsolute(url, assetHref);
      if (!abs || !isSameOrigin(baseUrl, abs) || checkedAssets.has(abs)) continue;
      checkedAssets.add(abs);
      try {
        const assetRes = await context.request.get(abs);
        if (assetRes.status() >= 400) {
          brokenAssets.push({ url: abs, status: assetRes.status(), foundOnPage: url });
        }
      } catch (err) {
        brokenAssets.push({ url: abs, error: String(err.message || err), foundOnPage: url });
      }
    }
  }

  await page.close();

  return {
    pages: pages.filter((p) => p.contentType.includes("text/html") && p.status < 400),
    allVisited: pages,
    brokenLinks,
    brokenAssets,
  };
}
