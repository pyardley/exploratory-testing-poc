# Exploratory Test Session Notes

**Charter:** [exploratory-charter.md](C:\Users\PaulYardley\Projects\ExporitoryTesting\charter\exploratory-charter.md)  
**Tester:** exploratory-tester (deterministic scanners + `claude -p` static-artifact review, model: sonnet)  
**Target:** https://www.saucedemo.com  
**Golden reference:** https://www.saucedemo.com/inventory.html  
**Session date/time:** 2026-09-05T12:07:01.036Z  
**Pages covered:** 3

## Session Summary

Session covered three pages of the Swag Labs demo app (inventory/catalog, cart, and one item detail) using fixed evidence captured by deterministic tooling. The most striking finding is the sheer density of global-component defects: the wordmark, the nav sidebar's About link, the cart icon anchor, and the page title are all broken or inaccessible on every page reviewed, meaning a handful of shared template bugs multiply across the entire application. On top of that, the catalog's primary interactive feature — the sort control — is completely non-functional, and every product image resolves to the same 404-placeholder asset (`/assets/sl-404-Cq1a9k9X.jpg`), making visual product differentiation impossible. The cart page adds a secondary critical issue: Checkout is fully enabled with zero items. Accessibility is structurally weak across all three pages, with no semantic heading elements on any page and a globally unlabeled cart link. In total the session surfaced five high-severity findings, six medium, and three low — several of which are systemic rather than page-specific.

### Prioritized issues

1. CRITICAL — Sort control completely non-functional (inventory): All four sort options produce identical output; the catalog's only interactive feature delivers nothing, silently, with no error feedback. (Purpose, User Expectations, Claims — high confidence)
1. CRITICAL — Global 'About' nav link hard-coded to `https://saucelabs.com/error/404`: Confirmed in every page's DOM. Any user opening the sidebar and clicking About is deliberately navigated to an external 404. Core navigation is broken app-wide. (Purpose, Claims — cross-page, high confidence)
1. HIGH — All catalog product images resolve to the same 404-named placeholder asset: Six different products display the same image, making visual differentiation impossible and the catalog's browse-to-buy purpose undeliverable. (Image, World, Purpose — high confidence)
1. HIGH — Checkout button enabled on empty cart: No guard, no disabled state, no feedback. A user with an empty cart can proceed into the checkout flow, producing a broken or cryptic experience downstream. (User Expectations, Purpose — high confidence)
1. HIGH — Sort `<select>` has no accessible name (WCAG 4.1.2, Level A critical): The only interactive control on the catalog page is completely opaque to screen-reader users. (Statutes/Standards — high confidence)
1. MEDIUM — Non-interactive wordmark on every page: `<div class="app_logo">` has no anchor; clicking the Swag Labs logo does nothing, violating a near-universal web convention on every page. (Familiarity, Comparable Products — cross-page, high confidence)
1. MEDIUM — No semantic heading elements anywhere in the application: Every page uses `<span class="title">` or styled `<div>` instead of `<h1>`–`<h6>`, leaving screen-reader users with no heading landmarks on any page. Systemic structural defect. (Statutes/Standards — cross-page, high confidence)
1. MEDIUM — Cart icon anchor has no accessible name on any page: `<a class="shopping_cart_link"></a>` with no text or aria-label is present in the global header, failing WCAG 4.1.2 on every page. (Statutes/Standards — cross-page, high confidence)
1. MEDIUM — No empty-state message on empty cart: Blank gap between column headers and action buttons with no explanation or call-to-action, making the page look broken. (User Expectations, Explainability, Comparable Products)
1. LOW — Generic `<title>Swag Labs</title>` on every page: No page-specific qualifier on any of the three pages reviewed; tabs, bookmarks, and browser history cannot distinguish pages. Systemic template omission. (Familiarity, User Expectations — cross-page, high confidence)

### Cross-page findings

- **[🔴 high, confidence: high]** The hamburger sidebar navigation 'About' link has `href='https://saucelabs.com/error/404'` in the DOM of every page reviewed (confirmed verbatim in inventory.html and cart.html DOM snapshots; also confirmed in the item-detail per-page finding). Clicking 'About' from anywhere in the app deliberately navigates the user to an external third-party 404 error page. Because this is a shared navigation component, it affects every page simultaneously — not one isolated page. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/cart.html, https://www.saucedemo.com/inventory-item.html?id=5
- **[🟠 medium, confidence: high]** The 'Swag Labs' wordmark is `<div class="app_logo">Swag Labs</div>` with no anchor wrapper on every page reviewed (confirmed in both inventory.html and cart.html DOM snapshots; per-page item-detail finding also confirms it). Clicking the logo is a dead interaction on every page. Web convention — and the Familiarity heuristic — demands the wordmark navigate home; here it does nothing, and it does so consistently across the entire application. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/cart.html, https://www.saucedemo.com/inventory-item.html?id=5
- **[🟠 medium, confidence: high]** The shopping cart header icon is `<a class="shopping_cart_link"></a>` — an anchor with no text content, no aria-label, and no aria-labelledby — confirmed in both inventory.html and cart.html DOM snapshots. Screen readers will announce it as an unlabeled link on every page. This is a global component defect, not a per-page oversight. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/cart.html
- **[🟡 low, confidence: high]** `<title>Swag Labs</title>` is the literal same string on all three pages (confirmed in inventory.html, cart.html DOM snapshots and in the item-detail per-page finding). There is no page-specific qualifier anywhere. A user with the catalog, a product detail, and the cart all open in separate tabs cannot distinguish them by title, and browser history/bookmarks are equally opaque. This is a systemic template-level omission. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/cart.html, https://www.saucedemo.com/inventory-item.html?id=5
- **[🟠 medium, confidence: high]** Page-level content headings are implemented as `<span class="title">` elements — never as semantic `<h1>`–`<h6>` — on every page reviewed: `<span class="title">Products</span>` on inventory.html, `<span class="title">Your Cart</span>` on cart.html, and the item name as a styled `<div>` on the detail page (all confirmed in DOM snapshots and per-page findings, all manifests report `headings: []`). This is a systemic structural pattern, not an isolated mistake. Screen-reader users have no heading landmarks to navigate by on any page in the app. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/cart.html, https://www.saucedemo.com/inventory-item.html?id=5
- **[🟠 medium, confidence: medium]** All six product cards in the catalog use the same image src (`/assets/sl-404-Cq1a9k9X.jpg` — the '404' in the filename strongly suggests a 404-fallback asset), yet the item detail per-page finding describes 'a product image with meaningful alt text' as though the image rendered correctly there. If the detail page resolves a correct per-product image while the catalog falls back to a broken placeholder for all items, then list and detail pages are visually inconsistent for the same records — a user who clicks into a detail expecting a product photo matching what they saw in the catalog will see something different. The evidence bundle does not include the item-detail DOM to confirm the detail-page image src, so this remains a medium-confidence cross-page suspicion rather than a confirmed defect. _(source: ai)_
  - Pages: https://www.saucedemo.com/inventory.html, https://www.saucedemo.com/inventory-item.html?id=5

## Findings by Heuristic

### Familiarity

- **[🟡 low, confidence: medium]** The visible 'Products' label above the catalog grid is not a semantic heading — the scanned headings array is empty []. The page has no h1 or any heading element at all. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: headings: [], text-content.txt line 3 — 'Products' present in text but not as heading
  - Open question/risk: Screen reader users navigating by heading landmarks will find nothing to orient them. WCAG best practice (and general accessibility convention) expects a page-level heading that describes the content region.
- **[🟡 low, confidence: medium]** The browser tab/page title is 'Swag Labs' — the site name — with no page-specific qualifier such as 'Products | Swag Labs'. Every page sharing this title would be indistinguishable in a browser tab list, bookmark manager, or browser history. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: title: 'Swag Labs'
  - Open question/risk: Users with multiple tabs open, or returning to a bookmark, cannot identify which Swag Labs page they are on without switching to it.
- **[🔴 high, confidence: high]** The 'About' entry in the hamburger sidebar menu has href='https://saucelabs.com/error/404'. Clicking it sends the user to an external 404 error page on saucelabs.com rather than to the app's own About page. This is visible in the DOM: `<a id="about_sidebar_link" href="https://saucelabs.com/error/404">About</a>`. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 33, about_sidebar_link href)
  - Open question/risk: Any user navigating to About from any page (this link appears in the global nav) will hit a dead end on a third-party error page. Core navigation is broken.
- **[🟡 low, confidence: high]** The browser `<title>` is 'Swag Labs' — identical to every other page. There is no page-specific qualifier such as 'Cart | Swag Labs'. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 27, <title>)
  - Open question/risk: Browser history, bookmarks, and assistive-technology page announcements cannot distinguish the cart from any other page by title alone.
- **[🟠 medium, confidence: high]** The `<title>` element is 'Swag Labs' — identical across every item detail page regardless of which item is loaded. A user with multiple item detail tabs open cannot tell them apart; browser history and bookmarks are equally ambiguous. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html line 27: <title>Swag Labs</title>, manifest: otherUrlsSharingThisTemplate lists 5 other item pages all sharing the same template
  - Open question/risk: Industry convention is for detail pages to include the item name in the title (e.g., 'Sauce Labs Fleece Jacket — Swag Labs'). The current generic title breaks orientation and makes bookmarking useless.
- **[🟠 medium, confidence: high]** The 'Swag Labs' wordmark in the header is a `<div class="app_logo">` with no wrapping anchor tag. Clicking it does nothing. Web convention — and the Familiarity heuristic — requires a logo to be a link back to the home page. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html: <div class="app_logo">Swag Labs</div> — no <a> wrapper, screenshot-full.png: wordmark visible top-center
  - Open question/risk: A user who clicks the wordmark expecting to return to the catalog or landing page will be stranded. This is a near-universal web convention violation.

### Explainability

- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: https://www.saucedemo.com/cart.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5
- **[🟠 medium, confidence: medium]** The manifest reports 1 console error and 1 bad HTTP response. No visible error UI is shown to the user. Without being able to inspect the browser console directly, the root cause is unknown, but silent failures of this kind often accompany the broken sort behavior (e.g., a failed API call for sorted results). _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: consoleErrorCount: 1, badResponseCount: 1
  - Open question/risk: Silent background failure may be masking further broken functionality that has no visible symptom. If it is a network error related to sort, the app should surface feedback rather than silently returning stale/unsorted data.
- **[🔴 high, confidence: high]** The cart is empty, yet the 'Checkout' button is fully enabled and clickable. No guard, disabled state, or tooltip prevents the user from proceeding to checkout with zero items. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: A user who arrives at an empty cart and clicks Checkout will either reach a broken checkout flow or receive a cryptic error downstream, rather than being stopped early with clear guidance.
- **[🟠 medium, confidence: high]** When the cart is empty the content area shows only the 'QTY / Description' column headers and then immediately the action buttons — no empty-state message, illustration, or call-to-action copy (e.g. 'Your cart is empty. Start shopping!'). The large blank gap between headers and buttons in the screenshot makes the page look broken. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: Users landing on an empty cart (e.g. after checkout, or via a direct URL) receive no feedback about why the cart is empty or what to do next. This is a standard e-commerce pattern that is missing entirely.
- **[🟠 medium, confidence: low]** The scanner recorded 1 console error and 1 bad HTTP response on this page. The evidence bundle does not expose the exact URL or error message, but their presence on a mostly-static empty cart page is unexpected. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: manifest consoleErrorCount: 1, badResponseCount: 1
  - Open question/risk: An unhandled console error could indicate a failed API call (e.g. a cart-fetch request returning 4xx/5xx) that silently swallows a real problem rather than surfacing it to the user.
- **[🟡 low, confidence: low]** In the screenshot, portions of the product description text appear to render with a blue/underline style that does not correspond to any `<a>` element in the DOM snapshot — the description is plain text inside a `<div>`. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: screenshot-full.png: description text shows apparent blue underline styling, dom-snapshot.html: <div class="inventory_details_desc large_size"> contains plain text with no child <a> elements
  - Open question/risk: If the browser is auto-detecting something in the text as a link (phone, address, or other pattern), that could trigger unintended navigation. Alternatively this may be a screenshot rendering artifact and not reproducible in a live session.

### World

- **[🔴 high, confidence: high]** When 'Price (low to high)' is selected, the scanner recorded observed values [29.99, 9.99, 15.99, 49.99, 7.99, 15.99] — clearly not ascending. The label claims ascending price order; the output contradicts it. This is a specific claims mismatch on top of the broader broken-sort finding. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch
  - Open question/risk: Even if sorting were partially fixed, the price-ascending option would still produce wrong output, misleading users who rely on the label to find the cheapest items first.
- **[🔴 high, confidence: high]** Every product card — Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, and T-Shirt (Red) — displays the identical photograph of a pug dog holding a tennis ball. No product shows a distinguishing image of the actual item. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: pages/inventory.html/screenshot-full.png
  - Open question/risk: A customer evaluating products visually cannot distinguish them by image. For a catalog whose stated purpose is to let prospective buyers browse before getting in touch, this is a fundamental credibility and usability failure. It also raises a factual-consistency issue: a bike light and a backpack cannot look identical.

### History

_No findings recorded under this heuristic._

### Image

- **[🔴 high, confidence: high]** Every product card — Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, and T-Shirt (Red) — displays the identical photograph of a pug dog holding a tennis ball. No product shows a distinguishing image of the actual item. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: pages/inventory.html/screenshot-full.png
  - Open question/risk: A customer evaluating products visually cannot distinguish them by image. For a catalog whose stated purpose is to let prospective buyers browse before getting in touch, this is a fundamental credibility and usability failure. It also raises a factual-consistency issue: a bike light and a backpack cannot look identical.
- **[🟡 low, confidence: low]** In the screenshot, portions of the product description text appear to render with a blue/underline style that does not correspond to any `<a>` element in the DOM snapshot — the description is plain text inside a `<div>`. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: screenshot-full.png: description text shows apparent blue underline styling, dom-snapshot.html: <div class="inventory_details_desc large_size"> contains plain text with no child <a> elements
  - Open question/risk: If the browser is auto-detecting something in the text as a link (phone, address, or other pattern), that could trigger unintended navigation. Alternatively this may be a screenshot rendering artifact and not reproducible in a live session.

### Comparable Products

- **[🟠 medium, confidence: high]** When the cart is empty the content area shows only the 'QTY / Description' column headers and then immediately the action buttons — no empty-state message, illustration, or call-to-action copy (e.g. 'Your cart is empty. Start shopping!'). The large blank gap between headers and buttons in the screenshot makes the page look broken. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: Users landing on an empty cart (e.g. after checkout, or via a direct URL) receive no feedback about why the cart is empty or what to do next. This is a standard e-commerce pattern that is missing entirely.
- **[🟠 medium, confidence: high]** The 'Swag Labs' wordmark in the header is a `<div class="app_logo">` with no wrapping anchor tag. Clicking it does nothing. Web convention — and the Familiarity heuristic — requires a logo to be a link back to the home page. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html: <div class="app_logo">Swag Labs</div> — no <a> wrapper, screenshot-full.png: wordmark visible top-center
  - Open question/risk: A user who clicks the wordmark expecting to return to the catalog or landing page will be stranded. This is a near-universal web convention violation.

### Claims

- **[🔴 high, confidence: high]** All four sort options — Name (A to Z), Name (Z to A), Price (low to high), Price (high to low) — produce identical item order. The scanner confirmed allSelectionsProducedIdenticalContent: true. Selecting any option has no observable effect; the catalog stays in name-ascending order regardless of the user's choice. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].allSelectionsProducedIdenticalContent = true, pages/inventory.html/screenshot-full.png
  - Open question/risk: The sort control's core purpose is completely undelivered. Users cannot sort by price or reverse alphabetical order at all, silently failing without any error or feedback.
- **[🔴 high, confidence: high]** When 'Price (low to high)' is selected, the scanner recorded observed values [29.99, 9.99, 15.99, 49.99, 7.99, 15.99] — clearly not ascending. The label claims ascending price order; the output contradicts it. This is a specific claims mismatch on top of the broader broken-sort finding. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch
  - Open question/risk: Even if sorting were partially fixed, the price-ascending option would still produce wrong output, misleading users who rely on the label to find the cheapest items first.
- **[🔴 high, confidence: high]** The 'About' entry in the hamburger sidebar menu has href='https://saucelabs.com/error/404'. Clicking it sends the user to an external 404 error page on saucelabs.com rather than to the app's own About page. This is visible in the DOM: `<a id="about_sidebar_link" href="https://saucelabs.com/error/404">About</a>`. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 33, about_sidebar_link href)
  - Open question/risk: Any user navigating to About from any page (this link appears in the global nav) will hit a dead end on a third-party error page. Core navigation is broken.
- **[🟠 medium, confidence: high]** The sidebar navigation 'About' link is hard-coded to `https://saucelabs.com/error/404`. The manifest records 1 bad response and 1 console error, consistent with this URL being fetched. Clicking 'About' deliberately navigates to a 404. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html: <a id="about_sidebar_link" href="https://saucelabs.com/error/404">About</a>, manifest: consoleErrorCount: 1, badResponseCount: 1
  - Open question/risk: A navigation item labelled 'About' that leads to a 404 is a broken promise to the user. It also explains the console error in the manifest.

### User Expectations

- **[🔴 high, confidence: high]** Selecting "Price (low to high)" (a "low to high / ascending" option) produced values that are NOT actually in that order: [29.99,9.99,15.99,49.99,7.99,15.99]. _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory.html
- **[🔴 high, confidence: high]** All four sort options — Name (A to Z), Name (Z to A), Price (low to high), Price (high to low) — produce identical item order. The scanner confirmed allSelectionsProducedIdenticalContent: true. Selecting any option has no observable effect; the catalog stays in name-ascending order regardless of the user's choice. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].allSelectionsProducedIdenticalContent = true, pages/inventory.html/screenshot-full.png
  - Open question/risk: The sort control's core purpose is completely undelivered. Users cannot sort by price or reverse alphabetical order at all, silently failing without any error or feedback.
- **[🔴 high, confidence: high]** When 'Price (low to high)' is selected, the scanner recorded observed values [29.99, 9.99, 15.99, 49.99, 7.99, 15.99] — clearly not ascending. The label claims ascending price order; the output contradicts it. This is a specific claims mismatch on top of the broader broken-sort finding. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch
  - Open question/risk: Even if sorting were partially fixed, the price-ascending option would still produce wrong output, misleading users who rely on the label to find the cheapest items first.
- **[🔴 high, confidence: high]** Every product card — Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, and T-Shirt (Red) — displays the identical photograph of a pug dog holding a tennis ball. No product shows a distinguishing image of the actual item. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: pages/inventory.html/screenshot-full.png
  - Open question/risk: A customer evaluating products visually cannot distinguish them by image. For a catalog whose stated purpose is to let prospective buyers browse before getting in touch, this is a fundamental credibility and usability failure. It also raises a factual-consistency issue: a bike light and a backpack cannot look identical.
- **[🟡 low, confidence: medium]** The browser tab/page title is 'Swag Labs' — the site name — with no page-specific qualifier such as 'Products | Swag Labs'. Every page sharing this title would be indistinguishable in a browser tab list, bookmark manager, or browser history. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: title: 'Swag Labs'
  - Open question/risk: Users with multiple tabs open, or returning to a bookmark, cannot identify which Swag Labs page they are on without switching to it.
- **[🔴 high, confidence: high]** The cart is empty, yet the 'Checkout' button is fully enabled and clickable. No guard, disabled state, or tooltip prevents the user from proceeding to checkout with zero items. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: A user who arrives at an empty cart and clicks Checkout will either reach a broken checkout flow or receive a cryptic error downstream, rather than being stopped early with clear guidance.
- **[🟠 medium, confidence: high]** When the cart is empty the content area shows only the 'QTY / Description' column headers and then immediately the action buttons — no empty-state message, illustration, or call-to-action copy (e.g. 'Your cart is empty. Start shopping!'). The large blank gap between headers and buttons in the screenshot makes the page look broken. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: Users landing on an empty cart (e.g. after checkout, or via a direct URL) receive no feedback about why the cart is empty or what to do next. This is a standard e-commerce pattern that is missing entirely.
- **[🟡 low, confidence: high]** The browser `<title>` is 'Swag Labs' — identical to every other page. There is no page-specific qualifier such as 'Cart | Swag Labs'. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 27, <title>)
  - Open question/risk: Browser history, bookmarks, and assistive-technology page announcements cannot distinguish the cart from any other page by title alone.
- **[🟠 medium, confidence: high]** The `<title>` element is 'Swag Labs' — identical across every item detail page regardless of which item is loaded. A user with multiple item detail tabs open cannot tell them apart; browser history and bookmarks are equally ambiguous. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html line 27: <title>Swag Labs</title>, manifest: otherUrlsSharingThisTemplate lists 5 other item pages all sharing the same template
  - Open question/risk: Industry convention is for detail pages to include the item name in the title (e.g., 'Sauce Labs Fleece Jacket — Swag Labs'). The current generic title breaks orientation and makes bookmarking useless.

### Purpose

- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: https://www.saucedemo.com/cart.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5
- **[🔴 high, confidence: high]** All four sort options — Name (A to Z), Name (Z to A), Price (low to high), Price (high to low) — produce identical item order. The scanner confirmed allSelectionsProducedIdenticalContent: true. Selecting any option has no observable effect; the catalog stays in name-ascending order regardless of the user's choice. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].allSelectionsProducedIdenticalContent = true, pages/inventory.html/screenshot-full.png
  - Open question/risk: The sort control's core purpose is completely undelivered. Users cannot sort by price or reverse alphabetical order at all, silently failing without any error or feedback.
- **[🔴 high, confidence: high]** Every product card — Backpack, Bike Light, Bolt T-Shirt, Fleece Jacket, Onesie, and T-Shirt (Red) — displays the identical photograph of a pug dog holding a tennis ball. No product shows a distinguishing image of the actual item. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: pages/inventory.html/screenshot-full.png
  - Open question/risk: A customer evaluating products visually cannot distinguish them by image. For a catalog whose stated purpose is to let prospective buyers browse before getting in touch, this is a fundamental credibility and usability failure. It also raises a factual-consistency issue: a bike light and a backpack cannot look identical.
- **[🔴 high, confidence: high]** The 'About' entry in the hamburger sidebar menu has href='https://saucelabs.com/error/404'. Clicking it sends the user to an external 404 error page on saucelabs.com rather than to the app's own About page. This is visible in the DOM: `<a id="about_sidebar_link" href="https://saucelabs.com/error/404">About</a>`. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 33, about_sidebar_link href)
  - Open question/risk: Any user navigating to About from any page (this link appears in the global nav) will hit a dead end on a third-party error page. Core navigation is broken.
- **[🔴 high, confidence: high]** The cart is empty, yet the 'Checkout' button is fully enabled and clickable. No guard, disabled state, or tooltip prevents the user from proceeding to checkout with zero items. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/screenshot-full.png, pages/cart.html/text-content.txt
  - Open question/risk: A user who arrives at an empty cart and clicks Checkout will either reach a broken checkout flow or receive a cryptic error downstream, rather than being stopped early with clear guidance.
- **[🔴 high, confidence: high]** The item name 'Sauce Labs Fleece Jacket' is rendered as a styled `<div class="inventory_details_name">` with no semantic heading element (`<h1>`–`<h6>`) anywhere on the page. The manifest confirms `headings: []`. Screen-reader users cannot navigate by heading, and there is no document outline. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: manifest: headings: [], dom-snapshot.html line 33: <div class="inventory_details_name large_size">
  - Open question/risk: WCAG 2.1 SC 1.3.1 requires that heading-like content use actual heading markup. Assistive-technology users who rely on heading navigation will find the page structurally flat.
- **[🟠 medium, confidence: high]** The sidebar navigation 'About' link is hard-coded to `https://saucelabs.com/error/404`. The manifest records 1 bad response and 1 console error, consistent with this URL being fetched. Clicking 'About' deliberately navigates to a 404. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html: <a id="about_sidebar_link" href="https://saucelabs.com/error/404">About</a>, manifest: consoleErrorCount: 1, badResponseCount: 1
  - Open question/risk: A navigation item labelled 'About' that leads to a 404 is a broken promise to the user. It also explains the console error in the manifest.

### Statutes/Standards

- **[🔴 high, confidence: high]** Accessibility: Select element must have an accessible name (select-name, impact: critical) _(source: deterministic)_
  - Page: https://www.saucedemo.com/inventory.html
- **[🔴 high, confidence: high]** The sort <select> element has no label, aria-label, aria-labelledby, or title attribute. A screen reader user encounters an unnamed control with no indication of its purpose. The axe scan flagged this as a critical WCAG 2.1 Level A (4.1.2 Name, Role, Value) violation. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: accessibilityViolations[0] — select-name, WCAG 4.1.2
  - Open question/risk: Screen reader users cannot determine what this control does. Given sorting is the page's only interactive feature, this effectively locks assistive-technology users out of it entirely.
- **[🟡 low, confidence: medium]** The visible 'Products' label above the catalog grid is not a semantic heading — the scanned headings array is empty []. The page has no h1 or any heading element at all. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: headings: [], text-content.txt line 3 — 'Products' present in text but not as heading
  - Open question/risk: Screen reader users navigating by heading landmarks will find nothing to orient them. WCAG best practice (and general accessibility convention) expects a page-level heading that describes the content region.
- **[🟠 medium, confidence: high]** The page heading 'Your Cart' is rendered as `<span class="title">`, not as `<h1>` or any heading element. The scanner confirms `headings: []`. Screen-reader users get no heading landmark to navigate to the cart section. _(source: ai)_
  - Page: https://www.saucedemo.com/cart.html
  - Evidence: pages/cart.html/dom-snapshot.html (line 33, span.title)
  - Open question/risk: Users navigating by headings (a common screen-reader pattern) cannot jump directly to the page's primary content region. WCAG 2.4.6 (Headings and Labels, AA) recommends descriptive headings; absence of any heading on a full page view is an accessibility gap.
- **[🔴 high, confidence: high]** The item name 'Sauce Labs Fleece Jacket' is rendered as a styled `<div class="inventory_details_name">` with no semantic heading element (`<h1>`–`<h6>`) anywhere on the page. The manifest confirms `headings: []`. Screen-reader users cannot navigate by heading, and there is no document outline. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: manifest: headings: [], dom-snapshot.html line 33: <div class="inventory_details_name large_size">
  - Open question/risk: WCAG 2.1 SC 1.3.1 requires that heading-like content use actual heading markup. Assistive-technology users who rely on heading navigation will find the page structurally flat.
- **[🟠 medium, confidence: high]** The shopping cart icon in the header is an `<a class="shopping_cart_link">` with no text content and no `aria-label`. Screen readers will announce it as an unlabeled link ('link'), with no indication of its function or current cart count. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail)
  - Evidence: dom-snapshot.html: <a class="shopping_cart_link" data-test="shopping-cart-link"></a>
  - Open question/risk: WCAG 2.4.6 (Headings and Labels) and 4.1.2 (Name, Role, Value) require interactive elements to have accessible names. An empty anchor fails both.

## CRUD Findings

### Create

_No findings recorded under this heuristic._

### Read

- **[🔴 high, confidence: high]** All four sort options — Name (A to Z), Name (Z to A), Price (low to high), Price (high to low) — produce identical item order. The scanner confirmed allSelectionsProducedIdenticalContent: true. Selecting any option has no observable effect; the catalog stays in name-ascending order regardless of the user's choice. _(source: ai)_
  - Page: https://www.saucedemo.com/inventory.html
  - Evidence: interactionProbeFindings.directionalControls[0].allSelectionsProducedIdenticalContent = true, pages/inventory.html/screenshot-full.png
  - Open question/risk: The sort control's core purpose is completely undelivered. Users cannot sort by price or reverse alphabetical order at all, silently failing without any error or feedback.

### Update

_No findings recorded under this heuristic._

### Delete

_No findings recorded under this heuristic._

### CRUD smoke flow detail

### create
- Skipped: no create-like form found among crawled pages

### update
- Skipped: could not find any item detail links from the list page

### read-beyond-page-1
- attempted: false
- reached: false
- reason: no Next-like control found

### delete
- Skipped: could not find a second item to test deletion on


## Deterministic Scan Summary

- Pages scanned: 3
- Broken links: 0
- Broken assets: 0
- Console errors (total): 3
- Accessibility violations (total): 1
- Visual deviations from golden reference (total): 0
- CRUD smoke flow ran: true

## Open Questions

- https://www.saucedemo.com/inventory.html: What is the console error and bad HTTP response? Are they related to the broken sort (e.g., a failed XHR/fetch for sorted results) or an unrelated resource failure?
- https://www.saucedemo.com/inventory.html: Is the identical pug photo a placeholder/seed-data issue (i.e., real product images were never uploaded) or a template rendering bug that always outputs the same image regardless of the item's image field?
- https://www.saucedemo.com/inventory.html: When sort is fixed, does the page re-render in place or navigate? The UX expectation (no page reload vs. full reload) should be verified against what actually happens.
- https://www.saucedemo.com/inventory.html: Are there any items in the catalog that have been added via the Create flow? If so, do they appear here immediately after creation without a page refresh — confirming CRUD-Read consistency?
- https://www.saucedemo.com/inventory.html: Does the shopping cart icon update its badge count correctly as 'Add to cart' is clicked — given the sort control is broken, are other interactive elements also silently failing?
- https://www.saucedemo.com/cart.html: What happens when a user clicks Checkout on an empty cart — does the app error, silently proceed, or show a validation message?
- https://www.saucedemo.com/cart.html: Is the 1 console error a failed cart-fetch API call? If so, is the empty cart state a data-load failure rather than a legitimate empty cart?
- https://www.saucedemo.com/cart.html: Is the broken About link (`/error/404`) present on every page's sidebar, or only on the cart page? (It appears global, but only the cart DOM was inspected here.)
- https://www.saucedemo.com/cart.html: Is there any mechanism to recover items added to the cart before a session reset or logout, or is cart state ephemeral?
- https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail): Does the 'Back to products' button restore the user's previous scroll position and filter/sort state in the catalog, or does it reset to defaults? (User Expectations — evidence doesn't cover the return navigation behavior.)
- https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail): Is there any 'out of stock' or quantity state for items? The page has no stock indicator — can a user add an item to cart that is no longer available, and what happens?
- https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail): The screenshot shows the product image cropped at the top and bottom — is the image presented at its correct aspect ratio (1200×1500 per the src filename) or is it being clipped by a fixed-height container?
- https://www.saucedemo.com/inventory-item.html?id=5 — Sauce Labs Fleece Jacket (Item Detail): What happens if the `?id=` parameter references a non-existent item — does the app show a graceful 'not found' state or a broken/blank page? (CRUD-Read: missing record handling)

## Session Metadata

- Run ID: saucedemo-full-1
- Evidence directory: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\saucedemo-full-1
- AI findings: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\saucedemo-full-1\ai-findings
