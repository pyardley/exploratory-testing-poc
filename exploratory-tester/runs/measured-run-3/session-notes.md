# Exploratory Test Session Notes

**Charter:** [exploratory-charter.md](C:\Users\PaulYardley\Projects\ExporitoryTesting\charter\exploratory-charter.md)  
**Tester:** exploratory-tester (deterministic scanners + `claude -p` static-artifact review, model: sonnet)  
**Target:** http://localhost:4173  
**Golden reference:** http://localhost:4173/index.html  
**Session date/time:** 2026-09-04T14:56:32.538Z  
**Pages covered:** 9

## Session Summary

This session covered all eight in-scope WidgetWorks pages and surfaced a product with a clean visual shell hiding several serious functional and data-integrity defects. The most urgent cluster is on the edit path: the Cancel button on the Edit Item page appears wired to the save handler (it fires a network request), empty form submission silently reaches the server with no error shown, and the deletion UI promises a 30-day archive/restore that no other page in the product supports. A second cluster concerns false marketing claims: the About page says the company has served customers for "over 15 years" (founded 2018 = ~8 years), the About page counts "500 customers" while the Home page claims "10,000+", and the Home page claims 1,200+ catalog items against a catalog that shows roughly 24. The price formatting is inconsistently represented across three pages (3 decimals on catalog/detail, 1 decimal on edit pre-fill, 2 expected by convention). Infrastructure defects — stale 2019 copyright on every page except Home, missing Inter font on at least one page, logo not linked on Account — are systemic and suggest the Home page received fixes that were never propagated to the rest of the site.

### Prioritized issues

1. CRITICAL — Edit Item Cancel button fires a network request (cross-page: Edit Item): Cancel should never write data; the button appears wired to the save handler, meaning Dana clicking 'Cancel' to abandon edits may silently overwrite the record. This is the highest data-integrity risk in the session.
1. CRITICAL — Edit Item empty submit silently reaches the server with no error shown (cross-page form pattern: Contact, Account, Edit Item): three of four forms accept empty or invalid data server-side without client-side interception or post-response feedback, with only New Item correctly blocking submission. Silent writes of blank data can corrupt catalog records.
1. HIGH — Delete promises '30-day archive restore' but no restore UI exists anywhere in the product (cross-page: Edit Item vs all navigation pages): the claim is undeliverable given the current UI surface. Users who delete believing they can recover cannot.
1. HIGH — Contact form silent failure on empty submit (Contact page): the primary function of the Contact page — submitting a message — fails completely with no user feedback; the server returns a bad response and no error indicator is shown.
1. HIGH — Customer count contradiction: 10,000+ on Home vs 500 on About (cross-page): both are prominently placed marketing claims on pages a prospective customer is equally likely to read; the contradiction undermines trust in all factual claims site-wide.
1. HIGH — Homepage '1,200+ Parts in catalog' stat vs actual ~24 catalog items (cross-page: Home vs Catalog): the discrepancy is roughly 50×, making this an objectively false marketing claim visible to every visitor who browses the catalog.
1. HIGH — About page arithmetic error: 'Founded in 2018 … serving customers for over 15 years' (About page): 2026 − 2018 = ~8 years, not 15. A visitor who spots this will distrust every other fact on the page.
1. HIGH — Weight field unit contradiction on New Item: placeholder says 'e.g. 12 lbs', hint label says 'Weight (kg)' (New Item page): a user following the example enters pounds; the system expects kilograms. Every item created using the placeholder as a guide will have a silently incorrect weight.
1. HIGH — Price formatted inconsistently across three pages: 3 decimals on Catalog and Item Detail, 1 decimal on Edit Item pre-fill, 2 expected by USD convention (cross-page): suggests at least two separate formatting bugs and confuses both customers and the shop owner.
1. HIGH — WCAG AA color-contrast failure on Contact helper text (Contact page): contrast ratio 2.05:1 against a required 4.5:1; rated 'serious' by the accessibility scanner.
1. MEDIUM — No form labels on New Item (and Catalog search): all fields use placeholder text as label, which disappears on input and is not announced as a persistent label by screen readers; automated scanner missed this.
1. MEDIUM — Copyright year hardcoded as 2019 on every page except Home (cross-page: 7 pages): the Home page fix was not propagated to any shared template; seven-year-old copyright signals an unmaintained site to prospective customers.
1. MEDIUM — 'Edit this widget' is the primary (blue) CTA on Item Detail, not a browse or contact action (Item Detail page): the page hierarchy treats every anonymous visitor as an inventory manager, inverting the intended button prominence for Sam's browse context.
1. MEDIUM — Broken product image for Cable Tension Meter (Catalog page): src path uses '/img/widgets-missing/w-024.svg' instead of '/img/widgets/'; broken-image placeholder shown to prospective customers.
1. MEDIUM — Image upload absent from both New Item and Edit Item forms (cross-page: New Item, Edit Item, Catalog, Item Detail): photos are visible in browse views but completely unmanageable through the UI CRUD surface.
1. MEDIUM — '1-hour, 24/7 support' SLA on Contact page compounds the Home page's 'reach out any time' soft promise (cross-page): together they set an implausible expectation for a single-owner small business with no staffing infrastructure.
1. LOW — Logo not linked on Account page (cross-page: Home vs Account): violates the universal convention the Home page itself establishes; may affect other pages not confirmed in this evidence set.
1. LOW — Missing Inter font import on Account page causes visual drift from brand reference (Account page): body text renders in system font instead of the product's declared typeface.
1. LOW — 'Support response within 1 hour, 24/7' claim is unsubstantiated for a small-business single-owner product (Contact page): likely a false expectation-setting claim if not backed by actual staffing or tooling.
1. LOW — ISO date '2018-06-01' displayed raw in About page 'Since' badge instead of a human-readable format (About page): exposes implementation-level date representation to end users.

### Cross-page findings

- **[🔴 high, confidence: high]** Customer count is stated as '10k+ Customers served' / 'over 10,000 happy customers' on the Home page, and as 'Proudly serving our first 500 customers since 2018' on the About page. These are direct, irreconcilable contradictions about the same fact on two pages that prospective customers are equally likely to read. _(source: ai)_
  - Pages: Home (index.html), About (about.html)
- **[🔴 high, confidence: high]** The Home page hardcodes '1,200+ Parts in catalog' and '6 Categories' as marketing stats. The Catalog page shows 8 items on page 1 of 3, implying roughly 24 items in total — roughly 50× fewer than the claimed 1,200+. The actual category count visible in the catalog filter UI should also be verified against the '6 Categories' claim. A prospective customer who browses the catalog after reading the home page will immediately notice the discrepancy. _(source: ai)_
  - Pages: Home (index.html), Catalog (catalog.html)
- **[🔴 high, confidence: high]** The price for widget w-009 (Anodized Standoff Set) is rendered differently across three pages: '$14.200' (three decimal places) on the Catalog page and Item Detail page, and '14.2' (one decimal place) in the Edit Item pre-fill. The standard for USD is exactly two decimal places. All three representations are wrong by convention, and they differ from each other — suggesting the formatting bug lives in at least two separate code paths (list/detail rendering vs. form pre-population). _(source: ai)_
  - Pages: Catalog (catalog.html), Item Detail (item.html?id=w-009), Edit Item (edit-item.html?id=w-009)
- **[🔴 high, confidence: high]** The Edit Item page promises 'This item will be archived and can be restored within 30 days' when a widget is deleted. No other page in the entire navigation — Catalog, Account, Home, nor any other reachable page — presents any archive list or restore mechanism. The product makes a recovery promise it structurally cannot keep given the current UI surface. _(source: ai)_
  - Pages: Edit Item (edit-item.html?id=w-009), Catalog (catalog.html), Home (index.html)
- **[🟠 medium, confidence: high]** The copyright year in the footer is correct and apparently dynamic on the Home page (renders as 2026), but is hardcoded as '© 2019 WidgetWorks' on every other page reviewed: Catalog, Account, Contact, About, New Item, Item Detail, and Edit Item. The fix was applied only to the reference page and not propagated to the shared template or any other page. _(source: ai)_
  - Pages: Home (index.html), Catalog (catalog.html), Account (account.html), Contact (contact.html), About (about.html), New Item (new-item.html), Item Detail (item.html?id=w-009), Edit Item (edit-item.html?id=w-009)
- **[🟠 medium, confidence: high]** Catalog item thumbnails and Item Detail pages display product images, yet neither the New Item form nor the Edit Item form contains any image or photo upload field. There is no mechanism within the product to supply or change a widget's image at any point in the create/update lifecycle, making the image shown in browse views permanently unmanageable by the shop owner through the UI. _(source: ai)_
  - Pages: Catalog (catalog.html), Item Detail (item.html?id=w-009), New Item (new-item.html), Edit Item (edit-item.html?id=w-009)
- **[🟠 medium, confidence: medium]** The Home page promotes 'Fast answers' with 'reach out any time' — a soft, informal promise. The Contact page escalates this to 'Support response within 1 hour, 24/7' — a specific, legally meaningful SLA. For a product operated by a single shop owner with no authentication or staffing infrastructure, the specific 1-hour claim is implausible and sets a user expectation that neither page's copy moderates. Taken together across pages, the two claims compound each other. _(source: ai)_
  - Pages: Home (index.html), Contact (contact.html)
- **[🔴 high, confidence: high]** Three of four forms in the product (Contact, Account, Edit Item) fire a real network request when submitted empty, with no client-side validation guard, and in two cases (Contact, Edit Item) show no error indicator after the server returns a bad response. Only the New Item form correctly blocks empty submission client-side. This is a systematic form-handling failure pattern, not an isolated defect on a single page. _(source: ai)_
  - Pages: Contact (contact.html), Account (account.html), Edit Item (edit-item.html?id=w-009), New Item (new-item.html)
- **[🟠 medium, confidence: high]** The logo is a clickable link to the Home page on the Home/reference page, but is a bare, unlinked <img> on the Account page. Evidence for other pages did not confirm their logo link state, but the Account deviation is confirmed. If the same template omission affects other non-Home pages, this is a site-wide navigation regression against a universal web convention. _(source: ai)_
  - Pages: Home (index.html), Account (account.html)

## Findings by Heuristic

### Familiarity

- **[🟠 medium, confidence: high]** Header logo is not wrapped in a link, unlike the golden reference page. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟡 low, confidence: medium]** The three 'Why builders choose WidgetWorks' feature cards carry the CSS class `card-hover`, which conventionally signals interactivity (pointer cursor, lift/shadow on hover). None of the cards are wrapped in an anchor or have any click handler — they are purely decorative. Users familiar with card-based UIs may attempt to click them expecting navigation to Catalog, Contact, or a relevant detail page. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 39–51 (card card-hover divs, no anchor wrapper)
- **[🟡 low, confidence: medium]** The 'Previous' pagination button is visually active and not disabled on page 1 of 3. Standard web convention disables or hides the Previous button when already on the first page. A user clicking it on page 1 may receive no feedback or unexpected behavior. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/screenshot-full.png, pages/catalog.html/dom-snapshot.html line 133
- **[🟠 medium, confidence: high]** The header logo is a bare <img> (DOM line 14) with no <a> wrapper. Clicking it does nothing. The golden reference page has hasLinkWrapper: true. Standard web convention — reinforced by every comparable product — is that the logo returns the user to the home page. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 14, visual-deviation: logo-not-linked
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the CSS class `btn-secondary` and has a page-level style override `border-radius: 0`. The golden reference establishes the primary button as `rgb(44, 111, 187)` with `border-radius: 6px`. The button on this page is visually secondary/muted and has square corners, making the primary action of the page look less prominent than it should and inconsistent with every other call-to-action in the product. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html line 51: class="btn btn-secondary", dom-snapshot.html line 10: #contactSubmitBtn { border-radius: 0; }, golden reference: primaryButton.borderRadius=6px, backgroundColor=rgb(44,111,187)
- **[🟡 low, confidence: low]** The nav highlights 'Catalog' as the active item (class='active') while the user is on the New Item page. Since 'New Item' has no dedicated nav entry, marking 'Catalog' active is the closest defensible choice, but it could mislead users who expect the active nav state to reflect the page they are actually on. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 22, pages/new-item.html/screenshot-full.png
- **[🔴 high, confidence: high]** The Cancel button triggers a network request (manifest: cancelButtonProbes[0].triggeredNetworkRequest=true). Cancel should discard changes and navigate away — it should never fire a write-path network call. This indicates the button is likely wired to the save handler, meaning a user clicking Cancel to abandon edits may inadvertently save (or corrupt) the record. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0]
- **[🔴 high, confidence: medium]** No confirmation dialog or modal exists in the DOM for the Delete widget action. The button is a bare <button id='deleteBtn'> with no inline dialog markup. An accidental tap on 'Delete widget' would trigger the operation with no opportunity to cancel, which contradicts standard destructive-action UX patterns and the product's own claim about a 30-day restore window (implying the action is consequential). _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html line 63
  - Open question/risk: JS may dynamically inject a confirm dialog at runtime; DOM snapshot cannot confirm runtime behaviour. If it does, severity drops to low.

### Explainability

- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** The scanner recorded 1 console error and 1 bad HTTP response. The page's visible data (name, email, checkbox, last-updated date) loaded successfully, so the failure is from a secondary request. Its origin and impact are opaque — a user or developer has no on-screen indication that something failed in the background. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: manifest: consoleErrorCount=1, badResponseCount=1
- **[🟡 low, confidence: medium]** In the screenshot the date '11/2/2025' within 'Last updated: 11/2/2025' renders in a noticeably different (blue-tinted) colour compared to the grey 'Last updated:' prefix, despite both being inside the same <p class="text-muted"> with no inner markup. This is consistent with the browser auto-detecting the date pattern and styling it as a tappable link — unintended and visually inconsistent with the surrounding muted text. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 43, screenshot-full.png
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted empty (all fields blank), no client-side validation prevents it, no error indicator is shown to the user afterward, and the server returns a bad response. The user is left with no feedback — they cannot tell whether submission succeeded or failed. The `errorIndicatorShown: false` from the scanner and `badResponseCount: 1` together confirm a silent failure on the primary user task of this page. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: formValidationFindings.forms[0]: submittedEmpty=true, networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false, badResponseCount: 1, consoleErrorCount: 1
- **[🔴 high, confidence: high]** Submitting the edit form while empty fires a network request but shows no error indicator to the user (manifest: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false). The DOM confirms no required attributes and no visible validation markup. Empty or partial data may be silently written to the server with no feedback to Dana. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0], dom-snapshot.html lines 36-53
- **[🔴 high, confidence: high]** The danger-zone copy states 'This item will be archived and can be restored within 30 days,' but the button is labelled 'Delete widget' and the section heading reads 'Remove this widget.' 'Delete' and 'archive' are meaningfully different operations to users. If deletion is truly permanent, the description is a false promise; if it truly archives, the button label is wrong. Either way the claim does not match the stated behavior. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16, dom-snapshot.html lines 62-63, screenshot-full.png

### World

- **[🟠 medium, confidence: low]** The stats block claims '1,200+ Parts in catalog' and '6 Categories', both hardcoded in the HTML. The hero copy independently claims 'Trusted by over 10,000 happy customers' while the stats section labels the equivalent figure 'Customers served' — a subtle wording divergence. None of these figures are derivable from this page; they need cross-checking against the actual catalog count and category list on other pages. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html (lines 59–71), pages/index.html/text-content.txt (lines 25–30)
  - Open question/risk: If the live catalog holds substantially fewer than 1,200 items or other than 6 categories, the homepage makes materially false claims to prospective customers. The 'happy customers' vs 'customers served' wording inconsistency is minor but signals copy was written in two passes without a final reconciliation check.
- **[🟠 medium, confidence: high]** The 'WidgetWorks by the numbers' stats — 1,200+ Parts in catalog, 6 Categories, 10k+ Customers served — are hardcoded static HTML. The DOM snapshot contains no JavaScript that fetches these from the catalog API. If the actual catalog differs (seed data almost certainly does), prospective customers see false marketing claims that the product itself contradicts. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 59–71 (static .stat-number values, single script tag only updates copyright year)
- **[🔴 high, confidence: high]** Every price on the page is formatted with three decimal places instead of the standard two for USD — e.g. '$14.200', '$42.000', '$4.100'. This is ambiguous: a reader familiar with European locale conventions may interpret '$14.200' as fourteen thousand two hundred dollars (period as thousands separator), while a US reader may read it as fourteen dollars and twenty cents with a spurious trailing zero. Neither interpretation is unambiguously correct, and the formatting violates standard USD display conventions regardless. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/text-content.txt lines 14,20,26,32,38,44,50,56, pages/catalog.html/screenshot-full.png
- **[🟠 medium, confidence: medium]** The page prominently states 'Support response within 1 hour, 24/7.' as a subheading beneath 'Contact us'. This is a strong, specific SLA claim. For WidgetWorks — described as a small business catalog for a single shop owner ('Dana') with no authentication system — a guaranteed 1-hour 24/7 response is an extraordinary commitment. If this claim is not actually backed by staffing or tooling, it is a false expectation set for every visitor who uses the form. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt line 8: Support response within 1 hour, 24/7., product description: small business, single shop owner
- **[🔴 high, confidence: high]** The 'Our story' paragraph states 'Founded in 2018, WidgetWorks has been serving customers for over 15 years.' Today is 2026-09-04, which is approximately 8 years since 2018 — not 15+. The claim is factually wrong by roughly a factor of two. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/dom-snapshot.html line 34
  - Open question/risk: A prospective customer who notices this arithmetic will reasonably doubt the accuracy of every other fact on the page, including product listings and availability claims.
- **[🟡 low, confidence: high]** The 'Since' badge displays the raw ISO-8601 date '2018-06-01' rather than a human-readable format such as 'Since June 2018' or 'Since June 1, 2018'. ISO dates in this format are a developer/machine convention, not a consumer-facing one. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png, pages/about.html/text-content.txt line 12
  - Open question/risk: Exposes implementation-level date representation to end users, which looks unpolished and is inconsistent with the professional brand image the page is trying to project.
- **[🔴 high, confidence: high]** The weight input field has placeholder text 'e.g. 12 lbs' (imperial) but the visible hint label immediately below reads 'Weight (kg)' (metric). A user following the placeholder example would enter a value in pounds, but the system apparently expects kilograms — the two claims directly contradict each other, and there is no conversion or disambiguation anywhere on the form. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49-50, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: medium]** The Price field is typed `type='text'`, not `type='number'`. This means no native browser validation prevents entering arbitrary strings, negative values, or non-numeric characters. The weight field is similarly `type='text'`. Without additional server-side enforcement (not observable from this evidence), malformed values could be persisted. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 45-50
- **[🟠 medium, confidence: high]** The price is rendered as "$14.200" — three decimal places. US dollar amounts are conventionally formatted to exactly two decimal places ($14.20). The raw value in the DOM is literally `$14.200`, suggesting the formatting code calls something like `.toFixed(3)` or stores the value with a trailing zero. For a prospective customer, "$14.200" reads as either a typo or a malformed number. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/dom-snapshot.html:41, pages/item.html_id_w-009/text-content.txt:10, pages/item.html_id_w-009/screenshot-full.png
  - Open question/risk: Is this a formatting bug (wrong toFixed precision) or bad stored data? Does the same three-decimal rendering appear on other items whose prices happen to end in a non-zero third digit?
- **[🟠 medium, confidence: high]** Price and Weight fields are both typed as type='text' in the DOM rather than type='number'. This allows a user to type free-form text (e.g. 'abc' or '-5') into numeric fields with no browser-level enforcement. Combined with the absence of any client-side validation (see finding 1), invalid values can be submitted silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 48, 52
- **[🟡 low, confidence: medium]** The Price field is pre-populated with '14.2' rather than '14.20'. Currency values in USD should display two decimal places. A price displayed as '14.2' may look like a data entry error or an unfinished value to a shop owner, and could be passed back to the server in non-standard format on save. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: screenshot-full.png

### History

- **[🟡 low, confidence: medium]** The footer copyright year is rendered as a static hardcoded value: `<span id='copyright-year'>2026</span>`. No JavaScript in the captured DOM snapshot updates this field. The element's ID implies dynamic intent, but the value is currently baked in as plain HTML. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html (line 78)
  - Open question/risk: If the site is not manually updated at year-end, the copyright year will become stale — a minor but visible credibility signal for a professional product. The ID name 'copyright-year' suggests a dynamic update was intended but never wired up.
- **[🟠 medium, confidence: high]** The 'WidgetWorks by the numbers' stats — 1,200+ Parts in catalog, 6 Categories, 10k+ Customers served — are hardcoded static HTML. The DOM snapshot contains no JavaScript that fetches these from the catalog API. If the actual catalog differs (seed data almost certainly does), prospective customers see false marketing claims that the product itself contradicts. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 59–71 (static .stat-number values, single script tag only updates copyright year)
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. Today is 2026-09-04, making the copyright seven years stale. This is a credibility signal for prospective customers (Sam) and suggests the site may be unmaintained. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 142
- **[🟡 low, confidence: high]** Footer reads '© 2019 WidgetWorks'. Today is 2026-09-04 — seven years stale. A prospective customer or business partner seeing this may question whether the site is actively maintained. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: text-content.txt line 15, DOM line 53, screenshot-full.png
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, meaning the copyright year is seven years out of date. This is a hardcoded, stale value that undermines confidence in how actively maintained the product is, and may have legal implications in some jurisdictions. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: footerText: © 2019 WidgetWorks, text-content.txt line 28
- **[🔴 high, confidence: high]** The 'Our story' paragraph states 'Founded in 2018, WidgetWorks has been serving customers for over 15 years.' Today is 2026-09-04, which is approximately 8 years since 2018 — not 15+. The claim is factually wrong by roughly a factor of two. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/dom-snapshot.html line 34
  - Open question/risk: A prospective customer who notices this arithmetic will reasonably doubt the accuracy of every other fact on the page, including product listings and availability claims.
- **[🟠 medium, confidence: high]** The footer reads '© 2019 WidgetWorks'. The current year is 2026, making the copyright notice seven years out of date. The company was founded in 2018, so even the founding year would be more accurate than 2019. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png, pages/about.html/dom-snapshot.html line 44
  - Open question/risk: A stale copyright year signals an unmaintained or abandoned site to a prospective customer and is a common professionalism red flag. Depending on jurisdiction, an inaccurate copyright year may also carry legal implications.
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making the copyright seven years stale. This is a History heuristic failure and undermines the professionalism / Image of the site to prospective customers. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/text-content.txt line 11, pages/new-item.html/dom-snapshot.html line 62
- **[🟡 low, confidence: high]** The footer reads "© 2019 WidgetWorks" — hardcoded in the DOM template. The item was added on 09/12/2025 and today's date is 2026-09-04, making the copyright notice seven years stale. This undermines brand credibility (a prospective customer may question whether the business is still active) and may have legal implications for accurate copyright dating. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/dom-snapshot.html:53, pages/item.html_id_w-009/text-content.txt:17
  - Open question/risk: Is the copyright year hardcoded in every page template? If so, this is a site-wide systemic issue, not an item-page-specific one.
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making this seven years stale. This is visible to every customer who reaches the page and undermines brand credibility. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 20, footerText field in manifest

### Image

- **[🟠 medium, confidence: high]** This page has no favicon link, unlike the golden reference page. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🔴 high, confidence: high]** Every price on the page is formatted with three decimal places instead of the standard two for USD — e.g. '$14.200', '$42.000', '$4.100'. This is ambiguous: a reader familiar with European locale conventions may interpret '$14.200' as fourteen thousand two hundred dollars (period as thousands separator), while a US reader may read it as fourteen dollars and twenty cents with a spurious trailing zero. Neither interpretation is unambiguously correct, and the formatting violates standard USD display conventions regardless. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/text-content.txt lines 14,20,26,32,38,44,50,56, pages/catalog.html/screenshot-full.png
- **[🟠 medium, confidence: high]** The 'Cable Tension Meter' product image is broken. Its src is '/img/widgets-missing/w-024.svg' — a non-existent directory named 'widgets-missing', while all other items correctly use '/img/widgets/'. The screenshot shows a broken-image placeholder where the product thumbnail should be, and the manifest confirms badResponseCount: 1 matching this failed request. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 115, pages/catalog.html/screenshot-full.png
  - Open question/risk: Is the wrong path also used on the item detail page for this widget?
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. Today is 2026-09-04, making the copyright seven years stale. This is a credibility signal for prospective customers (Sam) and suggests the site may be unmaintained. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 142
- **[🟡 low, confidence: medium]** The inline CSS on product card images uses `object-fit: fill` rather than the more standard `object-fit: cover` or `object-fit: contain`. 'fill' stretches images to fill their container without preserving aspect ratio, which could distort real product photography if the catalog is ever populated with non-SVG images. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 18
- **[🟡 low, confidence: high]** No Google Fonts <link> for 'Inter' is present in the <head> (DOM lines 1–10). The golden reference imports Inter; this page falls back to the system font stack. Body text visually renders differently from the Home page — confirmed by the scanner's webfont-not-imported deviation. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM head section, visual-deviation: webfont-not-imported, screenshot-full.png
- **[🟡 low, confidence: high]** Footer reads '© 2019 WidgetWorks'. Today is 2026-09-04 — seven years stale. A prospective customer or business partner seeing this may question whether the site is actively maintained. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: text-content.txt line 15, DOM line 53, screenshot-full.png
- **[🟡 low, confidence: medium]** In the screenshot the date '11/2/2025' within 'Last updated: 11/2/2025' renders in a noticeably different (blue-tinted) colour compared to the grey 'Last updated:' prefix, despite both being inside the same <p class="text-muted"> with no inner markup. This is consistent with the browser auto-detecting the date pattern and styling it as a tappable link — unintended and visually inconsistent with the surrounding muted text. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 43, screenshot-full.png
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the CSS class `btn-secondary` and has a page-level style override `border-radius: 0`. The golden reference establishes the primary button as `rgb(44, 111, 187)` with `border-radius: 6px`. The button on this page is visually secondary/muted and has square corners, making the primary action of the page look less prominent than it should and inconsistent with every other call-to-action in the product. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html line 51: class="btn btn-secondary", dom-snapshot.html line 10: #contactSubmitBtn { border-radius: 0; }, golden reference: primaryButton.borderRadius=6px, backgroundColor=rgb(44,111,187)
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, meaning the copyright year is seven years out of date. This is a hardcoded, stale value that undermines confidence in how actively maintained the product is, and may have legal implications in some jurisdictions. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: footerText: © 2019 WidgetWorks, text-content.txt line 28
- **[🟡 low, confidence: high]** This page has no favicon link element, unlike the golden reference (index.html) which includes a favicon link. Minor brand/polish inconsistency confirmed by the automated visual deviation scan. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: visualDeviationsFromGolden[0]: type=missing-favicon
- **[🟠 medium, confidence: high]** The footer reads '© 2019 WidgetWorks'. The current year is 2026, making the copyright notice seven years out of date. The company was founded in 2018, so even the founding year would be more accurate than 2019. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png, pages/about.html/dom-snapshot.html line 44
  - Open question/risk: A stale copyright year signals an unmaintained or abandoned site to a prospective customer and is a common professionalism red flag. Depending on jurisdiction, an inaccurate copyright year may also carry legal implications.
- **[🟡 low, confidence: high]** The 'Since' badge displays the raw ISO-8601 date '2018-06-01' rather than a human-readable format such as 'Since June 2018' or 'Since June 1, 2018'. ISO dates in this format are a developer/machine convention, not a consumer-facing one. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png, pages/about.html/text-content.txt line 12
  - Open question/risk: Exposes implementation-level date representation to end users, which looks unpolished and is inconsistent with the professional brand image the page is trying to project.
- **[🟡 low, confidence: medium]** The body-level logo is styled at 200px × 120px (aspect ratio ~1.67:1) in a page-scoped inline style block, versus the canonical logo dimensions of 160px × 40px (aspect ratio 4:1) established by the golden reference. In the screenshot the logo renders without visible distortion (the SVG scales), but the CSS box height of 120px creates substantially more vertical whitespace around the logo than the header logo or any other page uses, making this section feel visually unbalanced. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/dom-snapshot.html line 10, pages/about.html/screenshot-full.png
  - Open question/risk: If the SVG ever fails to scale correctly, or in edge browsers, the logo could render stretched. Even without distortion, the disproportionately large container contradicts the single consistent spacing rhythm the brand spec requires.
- **[🟡 low, confidence: medium]** 'Proudly serving our first 500 customers since 2018' reads as though the business has never grown beyond its founding cohort of 500 customers — an oddly self-limiting milestone to present as a point of pride after eight years of operation. The phrasing is almost certainly an unintended copy artifact (perhaps intended as 'first 500+ customers' or a founding-moment milestone), but as written it implies stagnation. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 10, pages/about.html/dom-snapshot.html line 35
  - Open question/risk: Prospective customers evaluating credibility may read this as confirmation that WidgetWorks is a very small or struggling operation, which undermines the trust-building purpose of the About page.
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making the copyright seven years stale. This is a History heuristic failure and undermines the professionalism / Image of the site to prospective customers. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/text-content.txt line 11, pages/new-item.html/dom-snapshot.html line 62
- **[🟡 low, confidence: high]** The footer reads "© 2019 WidgetWorks" — hardcoded in the DOM template. The item was added on 09/12/2025 and today's date is 2026-09-04, making the copyright notice seven years stale. This undermines brand credibility (a prospective customer may question whether the business is still active) and may have legal implications for accurate copyright dating. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/dom-snapshot.html:53, pages/item.html_id_w-009/text-content.txt:17
  - Open question/risk: Is the copyright year hardcoded in every page template? If so, this is a site-wide systemic issue, not an item-page-specific one.
- **[🟡 low, confidence: medium]** The product image renders as a generated SVG placeholder (a brown rectangle with the initials "AS") rather than a real product photograph. No network error occurred — the file `/img/widgets/w-009.svg` loads successfully — but it is clearly a fallback placeholder, not an actual product image. The product description lists "photo" as a core element of item detail pages. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, pages/item.html_id_w-009/dom-snapshot.html:34
  - Open question/risk: Is the placeholder intentional seed-data behavior, or is real image upload functionality missing/broken? If placeholder SVGs are the norm across many items, the catalog's visual experience is significantly degraded for browsing customers.
- **[🟡 low, confidence: medium]** The Price field is pre-populated with '14.2' rather than '14.20'. Currency values in USD should display two decimal places. A price displayed as '14.2' may look like a data entry error or an unfinished value to a shop owner, and could be passed back to the server in non-standard format on save. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: screenshot-full.png
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making this seven years stale. This is visible to every customer who reaches the page and undermines brand credibility. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 20, footerText field in manifest

### Comparable Products

- **[🟠 medium, confidence: high]** This page does not import the brand typeface (Inter) via the Google Fonts link the golden reference page uses — text is likely rendering in a fallback system font instead. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟡 low, confidence: medium]** The inline CSS on product card images uses `object-fit: fill` rather than the more standard `object-fit: cover` or `object-fit: contain`. 'fill' stretches images to fill their container without preserving aspect ratio, which could distort real product photography if the catalog is ever populated with non-SVG images. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 18
- **[🟠 medium, confidence: high]** The header logo is a bare <img> (DOM line 14) with no <a> wrapper. Clicking it does nothing. The golden reference page has hasLinkWrapper: true. Standard web convention — reinforced by every comparable product — is that the logo returns the user to the home page. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 14, visual-deviation: logo-not-linked
- **[🟡 low, confidence: high]** No Google Fonts <link> for 'Inter' is present in the <head> (DOM lines 1–10). The golden reference imports Inter; this page falls back to the system font stack. Body text visually renders differently from the Home page — confirmed by the scanner's webfont-not-imported deviation. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM head section, visual-deviation: webfont-not-imported, screenshot-full.png
- **[🟡 low, confidence: medium]** There is no Cancel or Discard button on the account form — only 'Save changes'. If Dana accidentally edits a field and wants to revert, she must navigate away and back, with no in-page affordance to discard unsaved changes. Industry-standard account settings pages consistently provide a Cancel/Discard path alongside Save. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM lines 44–46, screenshot-full.png, manifest cancelButtonProbes: []
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the CSS class `btn-secondary` and has a page-level style override `border-radius: 0`. The golden reference establishes the primary button as `rgb(44, 111, 187)` with `border-radius: 6px`. The button on this page is visually secondary/muted and has square corners, making the primary action of the page look less prominent than it should and inconsistent with every other call-to-action in the product. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html line 51: class="btn btn-secondary", dom-snapshot.html line 10: #contactSubmitBtn { border-radius: 0; }, golden reference: primaryButton.borderRadius=6px, backgroundColor=rgb(44,111,187)
- **[🟡 low, confidence: medium]** The body-level logo is styled at 200px × 120px (aspect ratio ~1.67:1) in a page-scoped inline style block, versus the canonical logo dimensions of 160px × 40px (aspect ratio 4:1) established by the golden reference. In the screenshot the logo renders without visible distortion (the SVG scales), but the CSS box height of 120px creates substantially more vertical whitespace around the logo than the header logo or any other page uses, making this section feel visually unbalanced. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/dom-snapshot.html line 10, pages/about.html/screenshot-full.png
  - Open question/risk: If the SVG ever fails to scale correctly, or in edge browsers, the logo could render stretched. Even without distortion, the disproportionately large container contradicts the single consistent spacing rhythm the brand spec requires.
- **[🟠 medium, confidence: medium]** The product description states that the item detail page shows a widget's 'full description, price, and photo,' yet the New Item form has no image or photo upload field. If item detail pages display photos, there is no way to supply one at creation time, leaving every newly created item without a photo. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/screenshot-full.png, pages/new-item.html/dom-snapshot.html lines 35-56
- **[🟠 medium, confidence: high]** The edit form has no image or photo field. The product description states item detail pages show a photo, and the new-item flow presumably allows one to be added. Without an image field here, Dana cannot update or replace a widget's photo via the edit page — a significant gap in the CRUD-Update surface for a visual catalog. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 34-57, screenshot-full.png

### Claims

- **[🟠 medium, confidence: low]** The stats block claims '1,200+ Parts in catalog' and '6 Categories', both hardcoded in the HTML. The hero copy independently claims 'Trusted by over 10,000 happy customers' while the stats section labels the equivalent figure 'Customers served' — a subtle wording divergence. None of these figures are derivable from this page; they need cross-checking against the actual catalog count and category list on other pages. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html (lines 59–71), pages/index.html/text-content.txt (lines 25–30)
  - Open question/risk: If the live catalog holds substantially fewer than 1,200 items or other than 6 categories, the homepage makes materially false claims to prospective customers. The 'happy customers' vs 'customers served' wording inconsistency is minor but signals copy was written in two passes without a final reconciliation check.
- **[🟠 medium, confidence: high]** The 'WidgetWorks by the numbers' stats — 1,200+ Parts in catalog, 6 Categories, 10k+ Customers served — are hardcoded static HTML. The DOM snapshot contains no JavaScript that fetches these from the catalog API. If the actual catalog differs (seed data almost certainly does), prospective customers see false marketing claims that the product itself contradicts. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 59–71 (static .stat-number values, single script tag only updates copyright year)
- **[🟡 low, confidence: low]** 'Always current' card copy reads: 'Stock levels and listings are kept up to date as items come and go.' This implies automated real-time inventory sync, but the product relies on the shop owner manually editing/deleting items. The phrasing could set incorrect expectations for Sam (prospective customer) about stock accuracy between manual updates. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/text-content.txt line 22
- **[🟠 medium, confidence: high]** The 'Download catalog (PDF)' button is rendered as a prominent secondary CTA but its href is '#' with no JavaScript handler evident that would produce a download. The manifest records one console error, which may be triggered when this dead link is clicked. Clicking it delivers no PDF and does nothing visible — a direct violation of the label's promise. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 54
- **[🟠 medium, confidence: medium]** 'Email me order updates' (DOM line 41) implies an order-tracking notification system. The product description explicitly states that WidgetWorks takes orders offline (phone, email, in person) and has no order management feature. This checkbox either makes a promise the system cannot keep, or its label is misleadingly named for what is actually a generic marketing-email toggle. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 41, text-content.txt line 9, product description: 'takes orders offline'
- **[🟠 medium, confidence: medium]** The page prominently states 'Support response within 1 hour, 24/7.' as a subheading beneath 'Contact us'. This is a strong, specific SLA claim. For WidgetWorks — described as a small business catalog for a single shop owner ('Dana') with no authentication system — a guaranteed 1-hour 24/7 response is an extraordinary commitment. If this claim is not actually backed by staffing or tooling, it is a false expectation set for every visitor who uses the form. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt line 8: Support response within 1 hour, 24/7., product description: small business, single shop owner
- **[🔴 high, confidence: high]** The 'Our story' paragraph states 'Founded in 2018, WidgetWorks has been serving customers for over 15 years.' Today is 2026-09-04, which is approximately 8 years since 2018 — not 15+. The claim is factually wrong by roughly a factor of two. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/dom-snapshot.html line 34
  - Open question/risk: A prospective customer who notices this arithmetic will reasonably doubt the accuracy of every other fact on the page, including product listings and availability claims.
- **[🟡 low, confidence: medium]** 'Proudly serving our first 500 customers since 2018' reads as though the business has never grown beyond its founding cohort of 500 customers — an oddly self-limiting milestone to present as a point of pride after eight years of operation. The phrasing is almost certainly an unintended copy artifact (perhaps intended as 'first 500+ customers' or a founding-moment milestone), but as written it implies stagnation. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 10, pages/about.html/dom-snapshot.html line 35
  - Open question/risk: Prospective customers evaluating credibility may read this as confirmation that WidgetWorks is a very small or struggling operation, which undermines the trust-building purpose of the About page.
- **[🔴 high, confidence: high]** The weight input field has placeholder text 'e.g. 12 lbs' (imperial) but the visible hint label immediately below reads 'Weight (kg)' (metric). A user following the placeholder example would enter a value in pounds, but the system apparently expects kilograms — the two claims directly contradict each other, and there is no conversion or disambiguation anywhere on the form. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49-50, pages/new-item.html/screenshot-full.png
- **[🔴 high, confidence: high]** The danger-zone copy states 'This item will be archived and can be restored within 30 days,' but the button is labelled 'Delete widget' and the section heading reads 'Remove this widget.' 'Delete' and 'archive' are meaningfully different operations to users. If deletion is truly permanent, the description is a false promise; if it truly archives, the button label is wrong. Either way the claim does not match the stated behavior. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16, dom-snapshot.html lines 62-63, screenshot-full.png
- **[🟡 low, confidence: high]** The footer copyright reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making this seven years stale. This is visible to every customer who reaches the page and undermines brand credibility. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 20, footerText field in manifest

### User Expectations

- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: medium]** A button labeled "Cancel" triggered a network request when clicked — a Cancel-like control that appears to save/submit instead of discarding. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🟡 low, confidence: medium]** The three 'Why builders choose WidgetWorks' feature cards carry the CSS class `card-hover`, which conventionally signals interactivity (pointer cursor, lift/shadow on hover). None of the cards are wrapped in an anchor or have any click handler — they are purely decorative. Users familiar with card-based UIs may attempt to click them expecting navigation to Catalog, Contact, or a relevant detail page. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 39–51 (card card-hover divs, no anchor wrapper)
- **[🟡 low, confidence: low]** 'Always current' card copy reads: 'Stock levels and listings are kept up to date as items come and go.' This implies automated real-time inventory sync, but the product relies on the shop owner manually editing/deleting items. The phrasing could set incorrect expectations for Sam (prospective customer) about stock accuracy between manual updates. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/text-content.txt line 22
- **[🔴 high, confidence: high]** Every price on the page is formatted with three decimal places instead of the standard two for USD — e.g. '$14.200', '$42.000', '$4.100'. This is ambiguous: a reader familiar with European locale conventions may interpret '$14.200' as fourteen thousand two hundred dollars (period as thousands separator), while a US reader may read it as fourteen dollars and twenty cents with a spurious trailing zero. Neither interpretation is unambiguously correct, and the formatting violates standard USD display conventions regardless. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/text-content.txt lines 14,20,26,32,38,44,50,56, pages/catalog.html/screenshot-full.png
- **[🟡 low, confidence: medium]** The 'Previous' pagination button is visually active and not disabled on page 1 of 3. Standard web convention disables or hides the Previous button when already on the first page. A user clicking it on page 1 may receive no feedback or unexpected behavior. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/screenshot-full.png, pages/catalog.html/dom-snapshot.html line 133
- **[🟠 medium, confidence: high]** Submitting the form empty fires a network request (networkRequestFiredOnEmptySubmit: true) before an error indicator is shown. There is no client-side guard preventing the round-trip. For an account form pre-populated with existing data, submitting empty values could wipe the record; relying solely on server-side validation to catch this is fragile. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: manifest formValidationFindings: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=true
- **[🟡 low, confidence: medium]** There is no Cancel or Discard button on the account form — only 'Save changes'. If Dana accidentally edits a field and wants to revert, she must navigate away and back, with no in-page affordance to discard unsaved changes. Industry-standard account settings pages consistently provide a Cancel/Discard path alongside Save. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM lines 44–46, screenshot-full.png, manifest cancelButtonProbes: []
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted empty (all fields blank), no client-side validation prevents it, no error indicator is shown to the user afterward, and the server returns a bad response. The user is left with no feedback — they cannot tell whether submission succeeded or failed. The `errorIndicatorShown: false` from the scanner and `badResponseCount: 1` together confirm a silent failure on the primary user task of this page. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: formValidationFindings.forms[0]: submittedEmpty=true, networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false, badResponseCount: 1, consoleErrorCount: 1
- **[🔴 high, confidence: high]** No form field has a properly associated `<label>` element. Every input (Widget name, Category, Description, Price, Weight) uses placeholder text as its only label. Placeholder text disappears once the user begins typing, leaving the field unlabelled; it is also not announced correctly by screen readers as a persistent label. The WCAG checklist item 'Does every form input have a properly associated label (not placeholder text standing in for a label)?' is unmet. Notably the automated accessibility scanner reported zero violations — this appears to be a scanner miss. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 36-51
- **[🟡 low, confidence: low]** The nav highlights 'Catalog' as the active item (class='active') while the user is on the New Item page. Since 'New Item' has no dedicated nav entry, marking 'Catalog' active is the closest defensible choice, but it could mislead users who expect the active nav state to reflect the page they are actually on. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 22, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: high]** "Edit this widget" is the primary (blue) CTA button on the page, while "Back to catalog" is the secondary (grey) button. For Sam, the anonymous browsing customer, the most visually prominent action is to edit inventory — not to browse further or get in touch. The product description defines two distinct personas (Dana manages; Sam browses), but with no auth gating, the page treats every visitor as an inventory manager. The button prominence inversion makes "edit" feel like the intended next step for all visitors. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, pages/item.html_id_w-009/dom-snapshot.html:45
  - Open question/risk: Is there a plan to conditionally show/hide the edit button based on a session role, or is this intentionally public? Even if auth is out of scope, the button hierarchy should put "Back to catalog" as the primary action for browse context.
- **[🔴 high, confidence: high]** Submitting the edit form while empty fires a network request but shows no error indicator to the user (manifest: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false). The DOM confirms no required attributes and no visible validation markup. Empty or partial data may be silently written to the server with no feedback to Dana. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0], dom-snapshot.html lines 36-53
- **[🔴 high, confidence: high]** The Cancel button triggers a network request (manifest: cancelButtonProbes[0].triggeredNetworkRequest=true). Cancel should discard changes and navigate away — it should never fire a write-path network call. This indicates the button is likely wired to the save handler, meaning a user clicking Cancel to abandon edits may inadvertently save (or corrupt) the record. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0]
- **[🔴 high, confidence: high]** The danger-zone copy states 'This item will be archived and can be restored within 30 days,' but the button is labelled 'Delete widget' and the section heading reads 'Remove this widget.' 'Delete' and 'archive' are meaningfully different operations to users. If deletion is truly permanent, the description is a false promise; if it truly archives, the button label is wrong. Either way the claim does not match the stated behavior. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16, dom-snapshot.html lines 62-63, screenshot-full.png
- **[🔴 high, confidence: medium]** No confirmation dialog or modal exists in the DOM for the Delete widget action. The button is a bare <button id='deleteBtn'> with no inline dialog markup. An accidental tap on 'Delete widget' would trigger the operation with no opportunity to cancel, which contradicts standard destructive-action UX patterns and the product's own claim about a 30-day restore window (implying the action is consequential). _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html line 63
  - Open question/risk: JS may dynamically inject a confirm dialog at runtime; DOM snapshot cannot confirm runtime behaviour. If it does, severity drops to low.

### Purpose

- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: high]** The 'Download catalog (PDF)' button is rendered as a prominent secondary CTA but its href is '#' with no JavaScript handler evident that would produce a download. The manifest records one console error, which may be triggered when this dead link is clicked. Clicking it delivers no PDF and does nothing visible — a direct violation of the label's promise. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 54
- **[🟠 medium, confidence: medium]** 'Email me order updates' (DOM line 41) implies an order-tracking notification system. The product description explicitly states that WidgetWorks takes orders offline (phone, email, in person) and has no order management feature. This checkbox either makes a promise the system cannot keep, or its label is misleadingly named for what is actually a generic marketing-email toggle. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: DOM line 41, text-content.txt line 9, product description: 'takes orders offline'
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted empty (all fields blank), no client-side validation prevents it, no error indicator is shown to the user afterward, and the server returns a bad response. The user is left with no feedback — they cannot tell whether submission succeeded or failed. The `errorIndicatorShown: false` from the scanner and `badResponseCount: 1` together confirm a silent failure on the primary user task of this page. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: formValidationFindings.forms[0]: submittedEmpty=true, networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false, badResponseCount: 1, consoleErrorCount: 1
- **[🟠 medium, confidence: medium]** The product description states that the item detail page shows a widget's 'full description, price, and photo,' yet the New Item form has no image or photo upload field. If item detail pages display photos, there is no way to supply one at creation time, leaving every newly created item without a photo. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/screenshot-full.png, pages/new-item.html/dom-snapshot.html lines 35-56
- **[🟠 medium, confidence: high]** "Edit this widget" is the primary (blue) CTA button on the page, while "Back to catalog" is the secondary (grey) button. For Sam, the anonymous browsing customer, the most visually prominent action is to edit inventory — not to browse further or get in touch. The product description defines two distinct personas (Dana manages; Sam browses), but with no auth gating, the page treats every visitor as an inventory manager. The button prominence inversion makes "edit" feel like the intended next step for all visitors. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, pages/item.html_id_w-009/dom-snapshot.html:45
  - Open question/risk: Is there a plan to conditionally show/hide the edit button based on a session role, or is this intentionally public? Even if auth is out of scope, the button hierarchy should put "Back to catalog" as the primary action for browse context.
- **[🟡 low, confidence: medium]** The product image renders as a generated SVG placeholder (a brown rectangle with the initials "AS") rather than a real product photograph. No network error occurred — the file `/img/widgets/w-009.svg` loads successfully — but it is clearly a fallback placeholder, not an actual product image. The product description lists "photo" as a core element of item detail pages. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, pages/item.html_id_w-009/dom-snapshot.html:34
  - Open question/risk: Is the placeholder intentional seed-data behavior, or is real image upload functionality missing/broken? If placeholder SVGs are the norm across many items, the catalog's visual experience is significantly degraded for browsing customers.
- **[🟠 medium, confidence: high]** The edit form has no image or photo field. The product description states item detail pages show a photo, and the new-item flow presumably allows one to be added. Without an image field here, Dana cannot update or replace a widget's photo via the edit page — a significant gap in the CRUD-Update surface for a visual catalog. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 34-57, screenshot-full.png

### Statutes/Standards

- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🟠 medium, confidence: high]** All eight product card images have alt='' (empty), treating product images as decorative. These images represent specific products and carry visual identification value; a screen reader user receives no information about what item is shown. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html lines 61,70,79,88,97,106,115,124
- **[🟠 medium, confidence: medium]** The search input has no associated <label> element — only a placeholder ('Search widgets…'). The placeholder disappears as soon as the user begins typing, leaving the field unlabelled. This fails WCAG 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value). Note: the automated accessibility scanner reported 0 violations, suggesting it did not catch this pattern. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 43
- **[🟠 medium, confidence: high]** Submitting the form empty fires a network request (networkRequestFiredOnEmptySubmit: true) before an error indicator is shown. There is no client-side guard preventing the round-trip. For an account form pre-populated with existing data, submitting empty values could wipe the record; relying solely on server-side validation to catch this is fragile. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: manifest formValidationFindings: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=true
- **[🔴 high, confidence: high]** The `.helper-text` element ('Please include your order number if applicable.') has foreground color `#B5B5B5` on a white `#FFFFFF` background at 13px normal weight, yielding a contrast ratio of 2.05:1. WCAG AA requires 4.5:1 for this text size. Axe rated this as 'serious' impact. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: accessibilityViolations[0]: id=color-contrast, impact=serious, node=.helper-text, contrast=2.05, required=4.5
- **[🟡 low, confidence: medium]** The form input fields (`name`, `email`, `message`) have `id` attributes but no `name` attributes. If the JavaScript in `contact.js` constructs the POST payload by reading DOM IDs this is functionally fine, but any graceful-degradation path (non-JS submission, or a future server-side form handler) would receive no field data because HTML form serialization uses `name`, not `id`. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html lines 39, 43, 47: inputs have id but no name attribute
- **[🔴 high, confidence: high]** No form field has a properly associated `<label>` element. Every input (Widget name, Category, Description, Price, Weight) uses placeholder text as its only label. Placeholder text disappears once the user begins typing, leaving the field unlabelled; it is also not announced correctly by screen readers as a persistent label. The WCAG checklist item 'Does every form input have a properly associated label (not placeholder text standing in for a label)?' is unmet. Notably the automated accessibility scanner reported zero violations — this appears to be a scanner miss. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 36-51
- **[🟠 medium, confidence: medium]** The Price field is typed `type='text'`, not `type='number'`. This means no native browser validation prevents entering arbitrary strings, negative values, or non-numeric characters. The weight field is similarly `type='text'`. Without additional server-side enforcement (not observable from this evidence), malformed values could be persisted. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 45-50
- **[🔴 high, confidence: high]** Submitting the edit form while empty fires a network request but shows no error indicator to the user (manifest: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false). The DOM confirms no required attributes and no visible validation markup. Empty or partial data may be silently written to the server with no feedback to Dana. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0], dom-snapshot.html lines 36-53
- **[🟠 medium, confidence: high]** Price and Weight fields are both typed as type='text' in the DOM rather than type='number'. This allows a user to type free-form text (e.g. 'abc' or '-5') into numeric fields with no browser-level enforcement. Combined with the absence of any client-side validation (see finding 1), invalid values can be submitted silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 48, 52

## CRUD Findings

### Create

- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted empty (all fields blank), no client-side validation prevents it, no error indicator is shown to the user afterward, and the server returns a bad response. The user is left with no feedback — they cannot tell whether submission succeeded or failed. The `errorIndicatorShown: false` from the scanner and `badResponseCount: 1` together confirm a silent failure on the primary user task of this page. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: formValidationFindings.forms[0]: submittedEmpty=true, networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false, badResponseCount: 1, consoleErrorCount: 1
- **[🟡 low, confidence: medium]** The form input fields (`name`, `email`, `message`) have `id` attributes but no `name` attributes. If the JavaScript in `contact.js` constructs the POST payload by reading DOM IDs this is functionally fine, but any graceful-degradation path (non-JS submission, or a future server-side form handler) would receive no field data because HTML form serialization uses `name`, not `id`. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html lines 39, 43, 47: inputs have id but no name attribute
- **[🔴 high, confidence: high]** The weight input field has placeholder text 'e.g. 12 lbs' (imperial) but the visible hint label immediately below reads 'Weight (kg)' (metric). A user following the placeholder example would enter a value in pounds, but the system apparently expects kilograms — the two claims directly contradict each other, and there is no conversion or disambiguation anywhere on the form. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49-50, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: medium]** The Price field is typed `type='text'`, not `type='number'`. This means no native browser validation prevents entering arbitrary strings, negative values, or non-numeric characters. The weight field is similarly `type='text'`. Without additional server-side enforcement (not observable from this evidence), malformed values could be persisted. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 45-50
- **[🟠 medium, confidence: medium]** The product description states that the item detail page shows a widget's 'full description, price, and photo,' yet the New Item form has no image or photo upload field. If item detail pages display photos, there is no way to supply one at creation time, leaving every newly created item without a photo. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/screenshot-full.png, pages/new-item.html/dom-snapshot.html lines 35-56

### Read

- **[🟠 medium, confidence: high]** The 'Cable Tension Meter' product image is broken. Its src is '/img/widgets-missing/w-024.svg' — a non-existent directory named 'widgets-missing', while all other items correctly use '/img/widgets/'. The screenshot shows a broken-image placeholder where the product thumbnail should be, and the manifest confirms badResponseCount: 1 matching this failed request. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html line 115, pages/catalog.html/screenshot-full.png
  - Open question/risk: Is the wrong path also used on the item detail page for this widget?
- **[🟠 medium, confidence: high]** All eight product card images have alt='' (empty), treating product images as decorative. These images represent specific products and carry visual identification value; a screen reader user receives no information about what item is shown. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: pages/catalog.html/dom-snapshot.html lines 61,70,79,88,97,106,115,124
- **[🟠 medium, confidence: medium]** The scanner recorded 1 console error and 1 bad HTTP response. The page's visible data (name, email, checkbox, last-updated date) loaded successfully, so the failure is from a secondary request. Its origin and impact are opaque — a user or developer has no on-screen indication that something failed in the background. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: manifest: consoleErrorCount=1, badResponseCount=1

### Update

- **[🟠 medium, confidence: high]** Submitting the form empty fires a network request (networkRequestFiredOnEmptySubmit: true) before an error indicator is shown. There is no client-side guard preventing the round-trip. For an account form pre-populated with existing data, submitting empty values could wipe the record; relying solely on server-side validation to catch this is fragile. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: manifest formValidationFindings: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=true
- **[🔴 high, confidence: high]** Submitting the edit form while empty fires a network request but shows no error indicator to the user (manifest: networkRequestFiredOnEmptySubmit=true, errorIndicatorShown=false). The DOM confirms no required attributes and no visible validation markup. Empty or partial data may be silently written to the server with no feedback to Dana. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0], dom-snapshot.html lines 36-53
- **[🔴 high, confidence: high]** The Cancel button triggers a network request (manifest: cancelButtonProbes[0].triggeredNetworkRequest=true). Cancel should discard changes and navigate away — it should never fire a write-path network call. This indicates the button is likely wired to the save handler, meaning a user clicking Cancel to abandon edits may inadvertently save (or corrupt) the record. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0]
- **[🟠 medium, confidence: high]** The edit form has no image or photo field. The product description states item detail pages show a photo, and the new-item flow presumably allows one to be added. Without an image field here, Dana cannot update or replace a widget's photo via the edit page — a significant gap in the CRUD-Update surface for a visual catalog. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 34-57, screenshot-full.png
- **[🟠 medium, confidence: high]** Price and Weight fields are both typed as type='text' in the DOM rather than type='number'. This allows a user to type free-form text (e.g. 'abc' or '-5') into numeric fields with no browser-level enforcement. Combined with the absence of any client-side validation (see finding 1), invalid values can be submitted silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html lines 48, 52

### Delete

- **[🔴 high, confidence: high]** The danger-zone copy states 'This item will be archived and can be restored within 30 days,' but the button is labelled 'Delete widget' and the section heading reads 'Remove this widget.' 'Delete' and 'archive' are meaningfully different operations to users. If deletion is truly permanent, the description is a false promise; if it truly archives, the button label is wrong. Either way the claim does not match the stated behavior. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16, dom-snapshot.html lines 62-63, screenshot-full.png
- **[🔴 high, confidence: medium]** No confirmation dialog or modal exists in the DOM for the Delete widget action. The button is a bare <button id='deleteBtn'> with no inline dialog markup. An accidental tap on 'Delete widget' would trigger the operation with no opportunity to cancel, which contradicts standard destructive-action UX patterns and the product's own claim about a 30-day restore window (implying the action is consequential). _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot.html line 63
  - Open question/risk: JS may dynamically inject a confirm dialog at runtime; DOM snapshot cannot confirm runtime behaviour. If it does, severity drops to low.

### CRUD smoke flow detail

### create
- formUrl: http://localhost:4173/new-item.html
- tagValue: ZZZ-PROBE-1788533764132
- navigatedTo: http://localhost:4173/catalog.html

### read-after-create
- listUrl: http://localhost:4173/catalog.html
- foundOnListPage: false

### update
- editUrl: http://localhost:4173/edit-item.html?id=w-001
- originalName: null
- updatedTag: ZZZ-PROBE-1788533764132-UPDATED
- updatedValueVisibleOnListAfterUpdate: false
- snapshotChanged: true
- note: Compare updatedTag visibility and originalName persistence manually / via AI review — a generic diff can suggest but not prove which specific record changed.

### delete
- deleteEditUrl: http://localhost:4173/edit-item.html?id=w-001
- deletedItemName: ZZZ-PROBE-1788533764132-UPDATED
- confirmDialogMessage: This item will be archived and can be restored within 30 days. Continue?
- stillVisibleInSameSessionAfterDelete: false
- stillVisibleInFreshSessionAfterDelete: false

**Confirmation dialog text captured during the session:**
- "This item will be archived and can be restored within 30 days. Continue?"

## Deterministic Scan Summary

- Pages scanned: 9
- Broken links: 0
- Broken assets: 1
- Console errors (total): 3
- Accessibility violations (total): 1
- Visual deviations from golden reference (total): 3
- CRUD smoke flow ran: true

## Open Questions

- http://localhost:4173 (Home): Does the actual catalog contain approximately 1,200+ items and exactly 6 categories? The Catalog page evidence will confirm or contradict the homepage stat claims.
- http://localhost:4173 (Home): Is there any JavaScript (loaded externally or deferred) that does set the copyright year dynamically at runtime, which the DOM snapshot would not capture if it fired after snapshot was taken?
- http://localhost:4173 (Home): The 'Fast answers' card says 'reach out any time' — does the Contact page set any expectation about response hours or availability that would either substantiate or contradict this claim?
- http://localhost:4173/index.html: How many items does the seed catalog actually contain? If materially fewer than 1,200, the 'Parts in catalog' stat is a false claim visible to prospective customers.
- http://localhost:4173/index.html: Does the Catalog page expose exactly 6 categories in its filter UI — does that match the hardcoded '6 Categories' stat?
- http://localhost:4173/index.html: Are the card-hover feature cards intentionally non-interactive, or are they placeholders for future deep-link behavior (e.g., Curated selection → Catalog, Fast answers → Contact)?
- http://localhost:4173/index.html: The hero text says 'over 10,000 happy customers' while the stat says '10k+ Customers served' — phrasing differs. Is this an intentional brand-voice distinction or an accidental inconsistency?
- http://localhost:4173/catalog.html: Does the price formatting bug originate in the API response (backend stores wrong precision) or in a frontend toFixed(3) call in catalog.js? Checking the raw API JSON would disambiguate.
- http://localhost:4173/catalog.html: What does the console error say exactly — is it triggered by the broken image, the dead PDF button, or something else in catalog.js?
- http://localhost:4173/catalog.html: Do the remaining two pages of the catalog (pages 2 and 3) contain additional broken images, or is w-024 the only one with the wrong asset path?
- http://localhost:4173/catalog.html: Is the 'Download catalog (PDF)' feature intended but not yet implemented (placeholder), or was it accidentally broken during a refactor?
- http://localhost:4173/catalog.html: Does the Cable Tension Meter item detail page also show a broken image, confirming the data record itself carries the wrong path?
- http://localhost:4173/account.html: What exactly is the failing network request (console error + bad response)? Is it the account GET, the account PUT, or something else — and does it silently corrupt or discard data?
- http://localhost:4173/account.html: Does saving changes actually update the 'Last updated' timestamp, or is 11/2/2025 hardcoded/frozen?
- http://localhost:4173/account.html: What does the 'Email me order updates' checkbox actually trigger server-side — is there any email delivery mechanism wired to it, and if so, what does the email say?
- http://localhost:4173/account.html: After a successful save, is there any confirmation feedback shown to Dana, or does the page silently return to its pre-save state?
- http://localhost:4173/account.html: Does the empty-submit error indicator describe what went wrong and what to do, or is it a generic failure message?
- http://localhost:4173/contact.html: What does the server actually return on an empty contact form submission — a 4xx validation error or a 5xx? Does the front-end JS in contact.js handle any response at all, and if so, why is no error indicator shown?
- http://localhost:4173/contact.html: Is the '1 hour, 24/7' support response claim intentional marketing copy, and is there any staffing or tooling behind it? If not, it should be removed or softened.
- http://localhost:4173/contact.html: Is the 2019 copyright year hardcoded in the HTML template, or is it a systemic issue across all pages?
- http://localhost:4173/contact.html: Should required fields (Name, Email, Message) carry HTML `required` attributes and/or ARIA `aria-required` to surface validation to assistive technologies, independent of the JS validation fix?
- http://localhost:4173/about.html: Was '15 years' hardcoded at a time when the intended founding year was ~2011, then the founding year was later changed to 2018 without updating the copy — or is this simply a data-entry error?
- http://localhost:4173/about.html: Should the copyright year be updated dynamically (server-rendered or JS-injected current year), or is a fixed 'since' year the intended style? Either way, 2019 needs to be corrected.
- http://localhost:4173/about.html: Is 'Carbon-neutral shipping on every order' an independently verified or certified claim (e.g., a carbon-offset program), or unsubstantiated marketing copy? If unsubstantiated, this could be a regulatory risk depending on jurisdiction (greenwashing rules in UK/EU).
- http://localhost:4173/about.html: What was the intended meaning of 'Proudly serving our first 500 customers since 2018' — a founding milestone, a current customer count, or a cumulative total? Clarifying intent is needed before copy can be fixed.
- http://localhost:4173/new-item.html: Does the server-side API enforce numeric and non-negative validation on the price field, or does it accept arbitrary text submitted via fetch?
- http://localhost:4173/new-item.html: Do existing catalog items display a photo on the item detail page? If so, is there a separate mechanism to attach images to newly created items that this form omits?
- http://localhost:4173/new-item.html: Is 'Weight' truly expected in kg everywhere in the system (API, detail view, catalog), or is the unit stored as free-text and the 'kg' label is simply aspirational?
- http://localhost:4173/new-item.html: Does the automated accessibility scanner being used check for missing `<label>` associations? The zero-violation result appears inconsistent with the DOM evidence.
- http://localhost:4173/new-item.html: Is the Category field free-text, or should it constrain input to a predefined set of categories? The placeholder gives only one example and gives no indication of what other values are valid.
- http://localhost:4173/item.html?id=w-009: Does the three-decimal price format ($14.200) appear on other item pages, or is it specific to items whose stored price value has a non-zero third decimal digit? This distinguishes a global formatting bug from a data-entry issue.
- http://localhost:4173/item.html?id=w-009: Is the "Edit this widget" button intended to be shown to all anonymous visitors, or is conditional rendering planned when auth is added? Even absent auth, should the button hierarchy be inverted so Browse/Contact is primary?
- http://localhost:4173/item.html?id=w-009: Is the © 2019 copyright year hardcoded in a shared layout template, making this a site-wide issue across all pages?
- http://localhost:4173/item.html?id=w-009: How many catalog items have real product images vs. the generated SVG placeholder? If most or all items show placeholders, this represents a systemic gap in the catalog's core browse experience.
- http://localhost:4173/edit-item.html?id=w-009: Does the server reject empty or invalid field values and return an error — or does it silently accept them? The client never shows an error, so the full failure mode depends on server behaviour.
- http://localhost:4173/edit-item.html?id=w-009: What does the Cancel button actually do at runtime — does it navigate back, or does the network request indicate it is calling the save endpoint?
- http://localhost:4173/edit-item.html?id=w-009: Does clicking 'Delete widget' show a JS confirm() dialog or a dynamically injected modal before executing? The static DOM has none, but JS could add one.
- http://localhost:4173/edit-item.html?id=w-009: If the delete operation truly archives with a 30-day restore window, where is the UI for restoring? There is no indication of an archive/restore view anywhere in the navigation.
- http://localhost:4173/edit-item.html?id=w-009: Is there a separate mechanism (e.g. new-item form) for setting a widget photo, and is editing or replacing that photo simply out of scope for edit — or is it a missing feature?

## Session Metadata

- Run ID: measured-run-3
- Evidence directory: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\measured-run-3
- AI findings: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\measured-run-3\ai-findings
