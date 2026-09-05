# Exploratory Test Session Notes

**Charter:** [exploratory-charter.md](C:\Users\PaulYardley\Projects\ExporitoryTesting\charter\exploratory-charter.md)  
**Tester:** exploratory-tester (deterministic scanners + `claude -p` static-artifact review, model: sonnet)  
**Target:** http://localhost:4173  
**Golden reference:** http://localhost:4173/index.html  
**Session date/time:** 2026-09-04T16:45:56.821Z  
**Pages covered:** 9

## Session Summary

This session covered all eight in-scope pages of WidgetWorks and found defects at every severity level, ranging from three completely non-functional catalog controls (search, sort direction, pagination) that make the core browse-and-buy experience largely unusable, to high-severity form-safety failures on the edit and contact pages, to a compound false promise about real-time catalog accuracy spread across three pages. The account and edit-item pages both silently fail on their primary CRUD operations, leaving the shop owner with no feedback and potentially corrupted data. Cross-cutting issues — a site-wide primary button color regression, stale © 2019 footers on every page except Home, inconsistent weight-unit labeling between the two inventory forms, and an unverifiable soft-delete promise with no restore UI anywhere in the product — indicate that the pages were developed without a shared component baseline and without a cross-page review pass. The most credible page in the product is the Home page, which ironically also contains the seed of several cross-page contradictions (hardcoded "1,200+ parts" stat, "Always current" brand promise) that compound into confirmed false claims when compared against Contact's FAQ and the broken Catalog.

### Prioritized issues

1. Catalog pagination completely broken: 'Next' on 'Page 1 of 3' produces no change — two-thirds of the catalog is unreachable (Catalog page, CRUD-Read/Purpose/User Expectations, high severity)
1. Catalog search non-functional: entering any query produces zero change in the product grid with no error, no 'no results' state, no feedback of any kind (Catalog page, Purpose/Explainability/CRUD-Read, high severity)
1. Catalog 'Price: Low to High' sort is inverted — observed order is descending [$42, $34.99, ...], the direct opposite of the label's promise (Catalog page, User Expectations/Claims/CRUD-Read, high severity)
1. Contact form submits empty with no client-side validation, server returns a bad response, and no feedback is shown to the user — outcome is entirely ambiguous (Contact page, Explainability/User Expectations/CRUD-Create, high severity)
1. Edit Item Cancel button fires a network request instead of cleanly discarding changes — comparison with New Item's safe `<a href>` Cancel confirms this is a defect, not intent (cross-page: Edit Item + New Item, User Expectations/Familiarity/CRUD-Update, high severity)
1. Edit Item submits an empty form to the server with no client-side validation guard and shows no error indicator — a shop owner can silently push an empty or partial record (Edit Item page, CRUD-Update/User Expectations/Statutes-Standards, high severity)
1. Account form: submitting with a bad API response exposes the raw JavaScript exception 'Error: Cannot read properties of null (reading 'field')' directly to the user (Account page, Explainability, high severity)
1. Account 'Email me order updates' checkbox state does not persist on save — toggling and saving reverts to the original state on reload, CRUD-Update lifecycle broken for this field (Account page, CRUD-Update/User Expectations, high severity)
1. New Item weight field: placeholder 'e.g. 12 lbs' directly contradicts the hint 'Weight (kg)' and the Edit Item form's label 'Weight (kg)' — a user following the example stores a value ~2.2× too large (cross-page: New Item + Edit Item, World/Claims/Comparable Products, high severity)
1. Contact FAQ states 'The catalog page reflects current stock in real time' — false on two counts: Home page stats are hardcoded HTML that cannot update, and Catalog pagination is broken hiding two-thirds of items (cross-page: Contact + Home + Catalog, Claims/History/Purpose, high severity)
1. Edit Item 'archived and restorable within 30 days' delete promise is unverifiable: no restore UI exists anywhere in the product across all eight pages reviewed (cross-page: Edit Item vs. all other pages, Claims/CRUD-Delete, high severity)
1. About page: 'Founded in 2018, WidgetWorks has been serving customers for over 15 years' — as of 2026-09-04 the company is approximately 8 years old; the claim would only be true in 2033 (About page, World/History/Claims, high severity)
1. Contact page helper text fails WCAG 2 AA contrast: #b5b5b5 on #ffffff yields 2.05:1, against the 4.5:1 minimum — confirmed serious accessibility violation (Contact page, Statutes/Standards, high severity)
1. New Item form has no `<label>` elements on any of its five fields (placeholder-only) — violates WCAG 1.3.1 and 4.1.2, directly contradicting Edit Item which implements labels correctly for the same fields (cross-page: New Item + Edit Item, Statutes/Standards/Comparable Products, high severity)
1. Three-decimal price formatting ($14.200) appears on both Catalog and Item Detail — confirmed shared display-formatter bug; Edit Item shows the same value as '14.2' (raw float), revealing three inconsistent representations of the same price (cross-page, World/Explainability, high severity)
1. Primary button color drift (rgb(44,111,187) vs. golden rgb(59,111,160)) affects every action page in the product — Catalog, Account, Item Detail, Edit Item, New Item — while Home alone is correct; site-wide CSS regression (cross-page, Image/Comparable Products, medium severity)
1. Home footer © 2026 is correct; every other page shows © 2019, seven years stale — selective maintenance that reveals no shared footer template or propagation process (cross-page, History/Image, medium severity)
1. Cable Tension Meter image has incorrect src path '/img/widgets-missing/w-024.svg' — broken image visible in Catalog, causing 3 console errors and a broken-image icon for that product (Catalog page, Image/CRUD-Read, medium severity)

### Cross-page findings

- **[🟠 medium, confidence: high]** Home footer reads '© 2026 WidgetWorks' (correct); every other page in the product — Catalog, Account, Contact, About, New Item, Item Detail, Edit Item — reads '© 2019'. This reveals selective maintenance: the Home page received a footer update that was never propagated to the shared template used by all other pages. The stale 2019 year is only identifiable as selectively stale (rather than consistently stale) by comparing Home to any other page. _(source: ai)_
  - Pages: http://localhost:4173/index.html, http://localhost:4173/catalog.html, http://localhost:4173/account.html, http://localhost:4173/contact.html, http://localhost:4173/about.html, http://localhost:4173/new-item.html, http://localhost:4173/item.html?id=w-009, http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** Contact's FAQ answers the question 'How do I check if an item is in stock?' with 'The catalog page reflects current stock in real time.' This is a direct cross-page false claim: the Home page's 'Always current' feature card makes the same promise but its stats block ('1,200+ Parts in catalog', '6 Categories') is hardcoded HTML that cannot update; and the Catalog page has completely non-functional pagination, making two-thirds of catalog items unreachable. Three pages together assert real-time catalog accuracy; the Catalog and Home together disprove it. _(source: ai)_
  - Pages: http://localhost:4173/contact.html, http://localhost:4173/index.html, http://localhost:4173/catalog.html
- **[🔴 high, confidence: high]** The weight field on the New Item form uses a placeholder of 'e.g. 12 lbs' (pounds) while the hint beneath it reads 'Weight (kg)' — the new-item form is self-contradictory. Comparing to the Edit Item form for the same data field confirms the intended unit is kilograms: edit-item carries a proper label 'Weight (kg)' with no lbs reference at all. A shop owner creating a new item who follows the placeholder example will store a value approximately 2.2× too large, and the discrepancy is only visible by comparing the two inventory management forms. _(source: ai)_
  - Pages: http://localhost:4173/new-item.html, http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** Both the New Item and Edit Item forms manage the same data entity (a widget), but their accessibility treatment is opposite. Edit Item has correct `<label>` elements for all five fields (Name, Category, Description, Price, Weight). New Item has zero label elements — all five fields use placeholder text as their only identification, which disappears as the user types and violates WCAG 1.3.1 and 4.1.2. The inconsistency is only detectable by comparing the two forms; a single-page view of either form does not reveal that the other exists and handles the same fields correctly or incorrectly. _(source: ai)_
  - Pages: http://localhost:4173/new-item.html, http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** The Cancel button on New Item is implemented as `<a href="/catalog.html">` — a safe navigation link that discards changes and returns to the catalog. The Cancel button on Edit Item is a `<button type="button" id="cancelBtn">` that triggers a network request when clicked. These two forms handle the same user intent (abandon an edit and go back) in structurally opposite ways. The new-item implementation is the correct pattern and makes clear that the edit-item Cancel firing a network request is not intentional design but a defect — a conclusion only reachable by comparing both forms. _(source: ai)_
  - Pages: http://localhost:4173/new-item.html, http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: medium]** The Edit Item page promises 'This item will be archived and can be restored within 30 days' in its danger zone, creating a contractual soft-delete expectation. Reviewing every other page in the product — Home, Catalog, Account (profile and notification settings), Contact, About, Item Detail, New Item — finds no restore interface anywhere: no 'Archived items' section, no 'Restore' link, no account-level recovery mechanism. The promise is only recognizable as unverifiable (and likely false) by confirming its absence across the full page set. _(source: ai)_
  - Pages: http://localhost:4173/edit-item.html?id=w-009, http://localhost:4173/catalog.html, http://localhost:4173/account.html, http://localhost:4173 (Home)
- **[🟠 medium, confidence: high]** Five pages — Catalog, Account, Item Detail, Edit Item, and New Item — all show a primary action button with background rgb(44,111,187), consistently deviating from the golden Home page's primary color rgb(59,111,160) by a perceptual distance of ~31–35 units. Each per-page report notes the drift independently, but comparing across pages reveals this is a site-wide CSS regression affecting every action page uniformly, not an isolated per-page override (except new-item, which has an explicit inline style block `#2D6FC0` overriding the token). The full scope of the regression — and the fact that only Home is correct — is only visible across pages. _(source: ai)_
  - Pages: http://localhost:4173/catalog.html, http://localhost:4173/account.html, http://localhost:4173/item.html?id=w-009, http://localhost:4173/edit-item.html?id=w-009, http://localhost:4173/new-item.html, http://localhost:4173/index.html
- **[🔴 high, confidence: high]** Three-decimal price formatting ($14.200, $42.000, $6.200) appears on both the Catalog list and the Item Detail page, confirming the bug lives in a shared display/read formatter rather than in any one page's template. The Edit Item form pre-populates the same item's price as '14.2' (the raw float value, no trailing zero), revealing a third inconsistency: the stored value is a float, the list/detail formatter pads to three places, and the edit form shows the unformatted float. All three display contexts disagree on the canonical representation of the same price. This composite picture only emerges by comparing all three pages. _(source: ai)_
  - Pages: http://localhost:4173/catalog.html, http://localhost:4173/item.html?id=w-009, http://localhost:4173/edit-item.html?id=w-009

## Findings by Heuristic

### Familiarity

- **[🟠 medium, confidence: high]** Header logo is not wrapped in a link, unlike the golden reference page. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** The header logo is a bare <img> with no anchor wrapper (DOM line 14), so clicking it does nothing. Every conventional web product links the logo back to the homepage; Dana and Sam would both expect this. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: visualDeviationsFromGolden[logo-not-linked], dom-snapshot.html:14
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the class `btn btn-secondary` rather than the primary button style, and has an inline override `border-radius: 0` that squares its corners. The golden-page primary button uses `rgb(59, 111, 160)` fill and `border-radius: 6px`. The contact submit button is visually muted (grey/outline) with sharp corners — the opposite of every other primary action in the product. A user's main goal on this page is to send a message; that primary action should carry the primary visual weight. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:51 — class="btn btn-secondary" id="contactSubmitBtn", dom-snapshot.html:10 — #contactSubmitBtn { border-radius: 0; }, golden primaryButton.borderRadius: 6px, backgroundColor: rgb(59,111,160), screenshot-full.png — button visibly grey/outline with square corners
- **[🟡 low, confidence: medium]** The WidgetWorks logo appears twice: once in the top navigation bar (expected) and again as a standalone element in the main content body directly above the 'Our story' heading. No other page in this product appears to repeat the logo in the content area; the duplication is visually redundant and inconsistent with the rest of the site's template. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png
- **[🟡 low, confidence: medium]** The navigation marks 'Catalog' as the active (underlined) link while the user is on new-item.html. Creating a new item is a distinct page, not the catalog list. If a user opened this page via a deep link or bookmark, the active highlight would misdirect them about where they are. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 22, pages/new-item.html/screenshot-full.png
- **[🟡 low, confidence: high]** The browser tab/page title is `Item — WidgetWorks` (generic) rather than `Anodized Standoff Set — WidgetWorks` (item-specific). A user with multiple detail pages open in tabs cannot distinguish them, and search engines/bookmarks also get a meaningless title. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: manifest title field
- **[🔴 high, confidence: high]** The Cancel button (type="button", id="cancelBtn") triggers a network request when clicked. Cancel on an edit form should discard changes and navigate away — it must not send data to the server. A network request from Cancel could mean it is sharing a handler with Save, silently saving changes the user intended to discard, or making an unrelated call. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0].triggeredNetworkRequest=true, dom-snapshot line 56: <button type=button class=btn btn-secondary id=cancelBtn>Cancel</button>
  - Open question/risk: What network request does Cancel actually fire? If it's a GET (e.g., fetching the item to reload), it may be benign. If it's a PUT/PATCH/POST it could be saving changes Dana intended to throw away.

### Explainability

- **[🟠 medium, confidence: high]** 3 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** 1 console error(s) logged during page load/interaction. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: high]** Form "newItemForm" shows the identical error text ("Something went wrong. Please check the form and try again.") whether submitted completely empty or submitted with a non-numeric value in "price" — the message doesn't identify which field or which problem actually caused it. _(source: deterministic)_
  - Page: http://localhost:4173/new-item.html
- **[🔴 high, confidence: high]** The search box is completely non-functional: entering a nonsense query produces zero change in the product grid. This silently fails — no error message, no 'no results' state, no feedback of any kind. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.searchProbes[0]: contentChangedAtAll=false, screenshot: search box present with placeholder 'Search widgets…'
- **[🔴 high, confidence: high]** Submitting the form when the backend returns a bad response shows the error message "Error: Cannot read properties of null (reading 'field')" — a raw JavaScript exception string, not a user-facing message. A confused shop owner has no idea what 'field' means or what to do next. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: formValidationFindings.forms[0].errorTextOnEmptySubmit, consoleErrorCount=1, badResponseCount=1
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted completely empty, the server returns a bad response (badResponseCount: 1, consoleErrorCount: 1), but no error indicator or message is shown to the user (errorIndicatorShown: false, errorTextOnEmptySubmit: null). Sam clicks 'Send message' and nothing visible happens — the outcome is entirely ambiguous. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: scanner: formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: false; badResponseCount: 1; consoleErrorCount: 1
- **[🟠 medium, confidence: high]** Form validation returns the identical message — 'Something went wrong. Please check the form and try again.' — for both an entirely empty submission and for a non-numeric value in the price field. The message does not identify which field is invalid, what the field requires, or what the user should fix. A user who misunderstands why submission failed gets no actionable help. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: formValidationFindings.forms[0].errorTextOnEmptySubmit, formValidationFindings.forms[0].sameErrorTextAcrossScenarios
- **[🔴 high, confidence: high]** Price is displayed as `$14.200` — three decimal places instead of the standard two for USD. This is neither valid US formatting ($14.20) nor valid European thousands-separator usage (which would use a comma, not a period, and would imply $14,200). The extra digit is unexplained and could cause a customer to misread the price. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/text-content.txt line 10, pages/item.html_id_w-009/screenshot-full.png

### World

- **[🟠 medium, confidence: high]** The stats block ('1,200+ Parts in catalog', '6 Categories', '10k+ Customers served') is hardcoded in the HTML template — confirmed by DOM inspection. It cannot update when catalog contents change. This directly contradicts the 'Always current' feature card on the same page, which promises 'Stock levels and listings are kept up to date as items come and go.' In a test/seed environment, the actual catalog almost certainly contains far fewer than 1,200 parts, making the 'Parts in catalog' figure a likely false claim for any user who then browses the catalog. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html lines 62–74 (hardcoded stat-number divs), pages/index.html/dom-snapshot.html lines 51–53 (Always current card)
  - Open question/risk: If Sam browses to the Catalog after reading '1,200+ Parts in catalog', the mismatch between the promised count and the actual item count is a credibility failure. The 'Always current' promise is also materially false for these particular figures.
- **[🟠 medium, confidence: high]** All prices are formatted with three decimal places ($14.200, $42.000, $6.200) instead of the standard two for USD. This is factually incorrect currency formatting and could confuse customers about actual prices. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: text-content.txt lines 14, 20, 26, 32, 38, 44, 50, 56: all prices end in three-digit decimal, dom-snapshot.html: <p class="price">$14.200</p> etc.
- **[🟠 medium, confidence: medium]** The page claims 'Support response within 1 hour, 24/7.' This is an unusually strong SLA for a small-business widget catalog with no evident staffing or infrastructure to back it. If WidgetWorks does not actually operate 24/7 with a 1-hour response guarantee, this claim is misleading to prospective customers and a legal/reputational risk. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt:8 — 'Support response within 1 hour, 24/7.', screenshot-full.png — visible below 'Contact us' heading
- **[🔴 high, confidence: high]** "Founded in 2018, WidgetWorks has been serving customers for over 15 years" — as of 2026-09-04 the company is approximately 8 years old, less than half the claimed 15+. The claim would only be true in 2033 or later. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/screenshot-full.png
- **[🟡 low, confidence: high]** The badge reads 'Since 2018-06-01' — an ISO 8601 date exposed verbatim in a customer-facing pill. Human readers expect 'Since June 2018' or 'Est. 2018'; the machine format reads as a data leak from an internal field rather than intentional copy. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 12, pages/about.html/screenshot-full.png
- **[🔴 high, confidence: high]** The weight field placeholder reads 'e.g. 12 lbs' but the field hint immediately below it reads 'Weight (kg)'. Pounds and kilograms are not interchangeable units — a user who follows the example will store a value roughly 2.2× too large. DOM confirms: placeholder='e.g. 12 lbs' with a <div class='hint'>Weight (kg)</div>. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49–51, pages/new-item.html/screenshot-full.png
- **[🔴 high, confidence: high]** Price is displayed as `$14.200` — three decimal places instead of the standard two for USD. This is neither valid US formatting ($14.20) nor valid European thousands-separator usage (which would use a comma, not a period, and would imply $14,200). The extra digit is unexplained and could cause a customer to misread the price. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/text-content.txt line 10, pages/item.html_id_w-009/screenshot-full.png
- **[🟠 medium, confidence: high]** Price and Weight fields use type=text rather than type=number. The scanner confirmed that submitting an invalid (non-numeric) value still fires a network request with no error shown. A shop owner could accidentally enter 'tbc' in Price and the request goes through unchallenged. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot lines 48, 52: type=text on price and weight inputs, formValidationFindings.forms[0].networkRequestFiredOnInvalidType=true, formValidationFindings.forms[0].errorTextOnInvalidType=null
  - Open question/risk: Does the server validate numeric types and reject non-numeric price/weight values, or can a text string be persisted as a price?
- **[🟡 low, confidence: medium]** Price is pre-populated as '14.2' rather than '14.20'. USD currency values conventionally display two decimal places. If this value is written back to the server on save it may alter the canonical precision of the stored price. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: screenshot-full.png: price field shows 14.2
  - Open question/risk: Is '14.2' the stored precision, or is the API returning a float that loses the trailing zero on deserialization?

### History

- **[🟠 medium, confidence: high]** The stats block ('1,200+ Parts in catalog', '6 Categories', '10k+ Customers served') is hardcoded in the HTML template — confirmed by DOM inspection. It cannot update when catalog contents change. This directly contradicts the 'Always current' feature card on the same page, which promises 'Stock levels and listings are kept up to date as items come and go.' In a test/seed environment, the actual catalog almost certainly contains far fewer than 1,200 parts, making the 'Parts in catalog' figure a likely false claim for any user who then browses the catalog. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html lines 62–74 (hardcoded stat-number divs), pages/index.html/dom-snapshot.html lines 51–53 (Always current card)
  - Open question/risk: If Sam browses to the Catalog after reading '1,200+ Parts in catalog', the mismatch between the promised count and the actual item count is a credibility failure. The 'Always current' promise is also materially false for these particular figures.
- **[🟠 medium, confidence: medium]** The 'WidgetWorks by the numbers' section shows '1,200+ Parts in catalog' and '6 Categories' as hardcoded HTML strings (confirmed in DOM: literal text nodes, no JS fetch). These figures will not update as items are added or removed. If actual catalog counts diverge, the home page makes materially false claims about the business's scale. This is compounded by the 'Always current' feature card on the same page, which promises 'Stock levels and listings are kept up to date as items come and go' — a brand claim the stat section structurally cannot honor. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 62–74, pages/index.html/text-content.txt lines 25–30
  - Open question/risk: Are '1,200+' and '6' close to the actual live catalog counts? If seed data only contains a handful of items, these figures are demonstrably false today, not just a future-drift risk.
- **[🟡 low, confidence: high]** Footer copyright reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, making this seven years out of date. A stale copyright year signals neglect to prospective customers and may have minor legal implications. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: footerText: '© 2019 WidgetWorks', text-content.txt line 62: '© 2019 WidgetWorks'
- **[🟡 low, confidence: high]** The footer reads '© 2019 WidgetWorks'. Today is 2026-09-04 — seven years out of date. A stale copyright year signals either poor maintenance hygiene or a hardcoded value that was never updated. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: footerText=© 2019 WidgetWorks, text-content.txt:15
- **[🟠 medium, confidence: high]** The footer reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, making the copyright notice seven years stale. This undermines the brand's credibility and gives the impression the site has not been maintained. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt:28 — '© 2019 WidgetWorks', dom-snapshot.html:75 — <p>© 2019 WidgetWorks</p>
- **[🔴 high, confidence: high]** "Founded in 2018, WidgetWorks has been serving customers for over 15 years" — as of 2026-09-04 the company is approximately 8 years old, less than half the claimed 15+. The claim would only be true in 2033 or later. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/screenshot-full.png
- **[🟠 medium, confidence: high]** Footer reads '© 2019 WidgetWorks'. The current year is 2026, making the copyright notice seven years stale. This is the kind of detail prospective customers notice and that signals an unmaintained or careless web presence. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 18, pages/about.html/screenshot-full.png
- **[🟡 low, confidence: high]** The footer reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making the copyright notice seven years stale. This gives a poor brand impression and is factually inaccurate. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/text-content.txt line 11, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: high]** Footer reads `© 2019 WidgetWorks`. Today is 2026-09-04, making the copyright seven years stale. Either the year was never updated after launch or is hardcoded. Both undermine credibility for a prospective customer and represent a factually incorrect historical claim. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/text-content.txt line 17, pages/item.html_id_w-009/screenshot-full.png
- **[🟡 low, confidence: high]** Footer reads '© 2019 WidgetWorks'. The current year is 2026 — seven years stale. Signals maintenance neglect and can undermine customer trust. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 20: © 2019 WidgetWorks, dom-snapshot line 70
  - Open question/risk: Is the copyright year hardcoded across all pages or is this a template variable that failed to update?

### Image

- **[🟠 medium, confidence: high]** This page has no favicon link, unlike the golden reference page. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟡 low, confidence: high]** The hero lede reads 'Trusted by over 10,000 happy customers'; the stats section on the same page reads '10k+ Customers served'. These refer to the same metric but use two different formats (written-out vs abbreviated) and two different framings ('happy customers' vs 'customers served'). While not contradictory, the inconsistency within a single page undermines editorial polish and could cause a careful reader to wonder if they are the same number. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html line 33 (hero lede), pages/index.html/dom-snapshot.html line 73 (stat label)
  - Open question/risk: Minor credibility / copy-quality issue. Low impact but easy to fix.
- **[🟡 low, confidence: low]** The three 'Why builders choose WidgetWorks' feature cards are text-only — no icons, illustrations, or any visual differentiation between cards. Comparable marketing landing pages at this level of polish typically include icons to aid scannability. The cards render with the same visual weight, making the section harder to scan at a glance. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/screenshot-full.png
- **[🟠 medium, confidence: high]** All prices are formatted with three decimal places ($14.200, $42.000, $6.200) instead of the standard two for USD. This is factually incorrect currency formatting and could confuse customers about actual prices. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: text-content.txt lines 14, 20, 26, 32, 38, 44, 50, 56: all prices end in three-digit decimal, dom-snapshot.html: <p class="price">$14.200</p> etc.
- **[🟠 medium, confidence: high]** Cable Tension Meter's image has an incorrect src path '/img/widgets-missing/w-024.svg' (note 'widgets-missing' instead of 'widgets'), resulting in a broken image icon visible in the screenshot. All other product images use '/img/widgets/'. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: dom-snapshot.html line 115: src='/img/widgets-missing/w-024.svg', screenshot: broken image icon on Cable Tension Meter card, badResponseCount: 3, consoleErrorCount: 3
- **[🟡 low, confidence: high]** The 'Add widget' primary button uses background color rgb(44, 111, 187), which deviates from the golden reference primary color rgb(59, 111, 160) by a distance of 30.9. The button appears noticeably bluer than the brand color established on the Home page. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: visualDeviationsFromGolden[0]: primary-button-color-drift, distance=30.9, screenshot: 'Add widget' button is a distinctly different shade of blue
- **[🟡 low, confidence: high]** Footer copyright reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, making this seven years out of date. A stale copyright year signals neglect to prospective customers and may have minor legal implications. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: footerText: '© 2019 WidgetWorks', text-content.txt line 62: '© 2019 WidgetWorks'
- **[🟡 low, confidence: high]** The footer reads '© 2019 WidgetWorks'. Today is 2026-09-04 — seven years out of date. A stale copyright year signals either poor maintenance hygiene or a hardcoded value that was never updated. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: footerText=© 2019 WidgetWorks, text-content.txt:15
- **[🟡 low, confidence: high]** The 'Save changes' primary button background is rgb(44,111,187), measurably different from the golden reference rgb(59,111,160) (distance 30.9). The screenshot shows a noticeably brighter, more saturated blue that visually diverges from the home-page brand color. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: visualDeviationsFromGolden[primary-button-color-drift]
- **[🟡 low, confidence: high]** The page <head> has no Google Fonts link for Inter (the brand typeface). Text is rendering in the browser's fallback system font instead of the Inter defined in the golden reference, causing subtle typographic drift from the brand identity. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: visualDeviationsFromGolden[webfont-not-imported], dom-snapshot.html:1-10
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the class `btn btn-secondary` rather than the primary button style, and has an inline override `border-radius: 0` that squares its corners. The golden-page primary button uses `rgb(59, 111, 160)` fill and `border-radius: 6px`. The contact submit button is visually muted (grey/outline) with sharp corners — the opposite of every other primary action in the product. A user's main goal on this page is to send a message; that primary action should carry the primary visual weight. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:51 — class="btn btn-secondary" id="contactSubmitBtn", dom-snapshot.html:10 — #contactSubmitBtn { border-radius: 0; }, golden primaryButton.borderRadius: 6px, backgroundColor: rgb(59,111,160), screenshot-full.png — button visibly grey/outline with square corners
- **[🟠 medium, confidence: high]** The footer reads '© 2019 WidgetWorks'. Today's date is 2026-09-04, making the copyright notice seven years stale. This undermines the brand's credibility and gives the impression the site has not been maintained. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt:28 — '© 2019 WidgetWorks', dom-snapshot.html:75 — <p>© 2019 WidgetWorks</p>
- **[🟡 low, confidence: high]** This page has no favicon link, unlike the golden reference (index.html). While minor, it creates a slight brand inconsistency in browser tabs and bookmarks. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: scanner: visualDeviationsFromGolden — missing-favicon, golden: hasFaviconLink: true
- **[🟠 medium, confidence: high]** Footer reads '© 2019 WidgetWorks'. The current year is 2026, making the copyright notice seven years stale. This is the kind of detail prospective customers notice and that signals an unmaintained or careless web presence. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 18, pages/about.html/screenshot-full.png
- **[🟡 low, confidence: high]** The badge reads 'Since 2018-06-01' — an ISO 8601 date exposed verbatim in a customer-facing pill. Human readers expect 'Since June 2018' or 'Est. 2018'; the machine format reads as a data leak from an internal field rather than intentional copy. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 12, pages/about.html/screenshot-full.png
- **[🟡 low, confidence: medium]** The WidgetWorks logo appears twice: once in the top navigation bar (expected) and again as a standalone element in the main content body directly above the 'Our story' heading. No other page in this product appears to repeat the logo in the content area; the duplication is visually redundant and inconsistent with the rest of the site's template. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png
- **[🔴 high, confidence: high]** The Save widget button background is hard-coded via an inline <style> block to #2D6FC0 (rgb(45,111,192)), overriding the global brand token. The golden reference primary color is rgb(59,111,160) — a perceptible 34.9-unit distance. No other page is expected to override this token locally; the DOM shows this is an isolated per-page rule, not a shared style. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 10–11, pages/new-item.html/screenshot-full.png
- **[🟡 low, confidence: high]** The footer reads '© 2019 WidgetWorks'. The current date is 2026-09-04, making the copyright notice seven years stale. This gives a poor brand impression and is factually inaccurate. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/text-content.txt line 11, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: high]** Footer reads `© 2019 WidgetWorks`. Today is 2026-09-04, making the copyright seven years stale. Either the year was never updated after launch or is hardcoded. Both undermine credibility for a prospective customer and represent a factually incorrect historical claim. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/text-content.txt line 17, pages/item.html_id_w-009/screenshot-full.png
- **[🟠 medium, confidence: high]** The primary action button (`Edit this widget`) renders with background `rgb(44, 111, 187)`, deviating from the golden reference primary color `rgb(59, 111, 160)` by a distance of 30.9. Visually the button reads as a noticeably cooler/brighter blue than the Home page standard, breaking brand consistency. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, manifest visualDeviationsFromGolden
- **[🟠 medium, confidence: medium]** No product photograph is present; the image slot shows a brown placeholder tile with the initials `AS`. Item detail is described in the product spec as showing 'full description, price, and photo' — the photo is the primary visual evidence a browsing customer uses to evaluate the item. A placeholder satisfies none of that purpose. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png
  - Open question/risk: Is the image placeholder expected for items where no photo has been uploaded, or is this a data-entry gap for this specific item? If the former, the placeholder UI should still communicate that a photo is missing rather than silently substituting initials.
- **[🟠 medium, confidence: high]** The primary 'Save changes' button uses background-color rgb(44, 111, 187), deviating from the golden reference primary color rgb(59, 111, 160) by a perceptual distance of 30.9. Visible in the screenshot as a noticeably cooler/brighter blue vs. the brand's slate-blue. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: visualDeviationsFromGolden[0].description, screenshot-full.png: Save changes button is a different hue from expected brand color
  - Open question/risk: Is this a CSS variable override specific to edit-item, or a site-wide regression affecting all primary buttons?
- **[🟡 low, confidence: high]** Footer reads '© 2019 WidgetWorks'. The current year is 2026 — seven years stale. Signals maintenance neglect and can undermine customer trust. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 20: © 2019 WidgetWorks, dom-snapshot line 70
  - Open question/risk: Is the copyright year hardcoded across all pages or is this a template variable that failed to update?

### Comparable Products

- **[🟠 medium, confidence: high]** Primary button background (rgb(44, 111, 187)) differs from the golden reference's primary color (rgb(59, 111, 160)), distance=30.9. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: high]** Primary button background (rgb(44, 111, 187)) differs from the golden reference's primary color (rgb(59, 111, 160)), distance=30.9. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** This page does not import the brand typeface (Inter) via the Google Fonts link the golden reference page uses — text is likely rendering in a fallback system font instead. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** Primary button background (rgb(45, 111, 192)) differs from the golden reference's primary color (rgb(59, 111, 160)), distance=34.9. _(source: deterministic)_
  - Page: http://localhost:4173/new-item.html
- **[🟠 medium, confidence: high]** Primary button background (rgb(44, 111, 187)) differs from the golden reference's primary color (rgb(59, 111, 160)), distance=30.9. _(source: deterministic)_
  - Page: http://localhost:4173/item.html?id=w-009
- **[🟠 medium, confidence: high]** Primary button background (rgb(44, 111, 187)) differs from the golden reference's primary color (rgb(59, 111, 160)), distance=30.9. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🟡 low, confidence: low]** The three 'Why builders choose WidgetWorks' feature cards are text-only — no icons, illustrations, or any visual differentiation between cards. Comparable marketing landing pages at this level of polish typically include icons to aid scannability. The cards render with the same visual weight, making the section harder to scan at a glance. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/screenshot-full.png
- **[🟡 low, confidence: high]** The 'Add widget' primary button uses background color rgb(44, 111, 187), which deviates from the golden reference primary color rgb(59, 111, 160) by a distance of 30.9. The button appears noticeably bluer than the brand color established on the Home page. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: visualDeviationsFromGolden[0]: primary-button-color-drift, distance=30.9, screenshot: 'Add widget' button is a distinctly different shade of blue
- **[🟡 low, confidence: high]** The 'Save changes' primary button background is rgb(44,111,187), measurably different from the golden reference rgb(59,111,160) (distance 30.9). The screenshot shows a noticeably brighter, more saturated blue that visually diverges from the home-page brand color. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: visualDeviationsFromGolden[primary-button-color-drift]
- **[🟡 low, confidence: high]** The page <head> has no Google Fonts link for Inter (the brand typeface). Text is rendering in the browser's fallback system font instead of the Inter defined in the golden reference, causing subtle typographic drift from the brand identity. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: visualDeviationsFromGolden[webfont-not-imported], dom-snapshot.html:1-10
- **[🟠 medium, confidence: high]** The 'Send message' submit button uses the class `btn btn-secondary` rather than the primary button style, and has an inline override `border-radius: 0` that squares its corners. The golden-page primary button uses `rgb(59, 111, 160)` fill and `border-radius: 6px`. The contact submit button is visually muted (grey/outline) with sharp corners — the opposite of every other primary action in the product. A user's main goal on this page is to send a message; that primary action should carry the primary visual weight. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:51 — class="btn btn-secondary" id="contactSubmitBtn", dom-snapshot.html:10 — #contactSubmitBtn { border-radius: 0; }, golden primaryButton.borderRadius: 6px, backgroundColor: rgb(59,111,160), screenshot-full.png — button visibly grey/outline with square corners
- **[🟡 low, confidence: medium]** The WidgetWorks logo appears twice: once in the top navigation bar (expected) and again as a standalone element in the main content body directly above the 'Our story' heading. No other page in this product appears to repeat the logo in the content area; the duplication is visually redundant and inconsistent with the rest of the site's template. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/screenshot-full.png
- **[🔴 high, confidence: high]** The Save widget button background is hard-coded via an inline <style> block to #2D6FC0 (rgb(45,111,192)), overriding the global brand token. The golden reference primary color is rgb(59,111,160) — a perceptible 34.9-unit distance. No other page is expected to override this token locally; the DOM shows this is an isolated per-page rule, not a shared style. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 10–11, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: high]** The primary action button (`Edit this widget`) renders with background `rgb(44, 111, 187)`, deviating from the golden reference primary color `rgb(59, 111, 160)` by a distance of 30.9. Visually the button reads as a noticeably cooler/brighter blue than the Home page standard, breaking brand consistency. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png, manifest visualDeviationsFromGolden
- **[🟠 medium, confidence: medium]** No delete confirmation dialog structure is present anywhere in the DOM snapshot. A single click on 'Delete widget' appears to immediately trigger the delete operation. Industry convention and user safety both require a confirmation step, especially given the irreversibility claim is already uncertain. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot: no modal or dialog element present, screenshot-full.png: single Delete widget button with no confirm affordance visible
  - Open question/risk: Does the JS for deleteBtn attach a window.confirm() or inline modal? If not, a misclick permanently removes a catalog item with no recovery prompt.
- **[🟠 medium, confidence: high]** The primary 'Save changes' button uses background-color rgb(44, 111, 187), deviating from the golden reference primary color rgb(59, 111, 160) by a perceptual distance of 30.9. Visible in the screenshot as a noticeably cooler/brighter blue vs. the brand's slate-blue. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: visualDeviationsFromGolden[0].description, screenshot-full.png: Save changes button is a different hue from expected brand color
  - Open question/risk: Is this a CSS variable override specific to edit-item, or a site-wide regression affecting all primary buttons?

### Claims

- **[🔴 high, confidence: high]** Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward — the create action silently does not persist. _(source: deterministic)_
  - Page: http://localhost:4173
- **[🟡 low, confidence: low]** Delete confirmation dialog text: "This item will be archived and can be restored within 30 days. Continue?" — worth checking this claim (e.g. about recoverability) against what deletion actually does server-side. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-001
- **[🟠 medium, confidence: high]** The stats block ('1,200+ Parts in catalog', '6 Categories', '10k+ Customers served') is hardcoded in the HTML template — confirmed by DOM inspection. It cannot update when catalog contents change. This directly contradicts the 'Always current' feature card on the same page, which promises 'Stock levels and listings are kept up to date as items come and go.' In a test/seed environment, the actual catalog almost certainly contains far fewer than 1,200 parts, making the 'Parts in catalog' figure a likely false claim for any user who then browses the catalog. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html lines 62–74 (hardcoded stat-number divs), pages/index.html/dom-snapshot.html lines 51–53 (Always current card)
  - Open question/risk: If Sam browses to the Catalog after reading '1,200+ Parts in catalog', the mismatch between the promised count and the actual item count is a credibility failure. The 'Always current' promise is also materially false for these particular figures.
- **[🟡 low, confidence: high]** The hero lede reads 'Trusted by over 10,000 happy customers'; the stats section on the same page reads '10k+ Customers served'. These refer to the same metric but use two different formats (written-out vs abbreviated) and two different framings ('happy customers' vs 'customers served'). While not contradictory, the inconsistency within a single page undermines editorial polish and could cause a careful reader to wonder if they are the same number. _(source: ai)_
  - Page: http://localhost:4173 (Home)
  - Evidence: pages/index.html/dom-snapshot.html line 33 (hero lede), pages/index.html/dom-snapshot.html line 73 (stat label)
  - Open question/risk: Minor credibility / copy-quality issue. Low impact but easy to fix.
- **[🟠 medium, confidence: medium]** The 'WidgetWorks by the numbers' section shows '1,200+ Parts in catalog' and '6 Categories' as hardcoded HTML strings (confirmed in DOM: literal text nodes, no JS fetch). These figures will not update as items are added or removed. If actual catalog counts diverge, the home page makes materially false claims about the business's scale. This is compounded by the 'Always current' feature card on the same page, which promises 'Stock levels and listings are kept up to date as items come and go' — a brand claim the stat section structurally cannot honor. _(source: ai)_
  - Page: http://localhost:4173/index.html
  - Evidence: pages/index.html/dom-snapshot.html lines 62–74, pages/index.html/text-content.txt lines 25–30
  - Open question/risk: Are '1,200+' and '6' close to the actual live catalog counts? If seed data only contains a handful of items, these figures are demonstrably false today, not just a future-drift risk.
- **[🔴 high, confidence: high]** Selecting 'Price: Low to High' yields items in descending price order: [42, 34.99, 29.99, 27, 22.5, 19.9, 18.4, 16.8]. The sort direction is inverted relative to the label. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch: claimedDirection=asc, observedValues=[42,34.99,...]
- **[🟠 medium, confidence: medium]** The page claims 'Support response within 1 hour, 24/7.' This is an unusually strong SLA for a small-business widget catalog with no evident staffing or infrastructure to back it. If WidgetWorks does not actually operate 24/7 with a 1-hour response guarantee, this claim is misleading to prospective customers and a legal/reputational risk. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: text-content.txt:8 — 'Support response within 1 hour, 24/7.', screenshot-full.png — visible below 'Contact us' heading
- **[🔴 high, confidence: high]** "Founded in 2018, WidgetWorks has been serving customers for over 15 years" — as of 2026-09-04 the company is approximately 8 years old, less than half the claimed 15+. The claim would only be true in 2033 or later. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 8, pages/about.html/screenshot-full.png
- **[🟡 low, confidence: low]** 'Carbon-neutral shipping on every order' is a substantive environmental claim in a prominent badge. The evidence cannot confirm or deny the underlying business practice, but the claim is verifiable and carries regulatory/reputational risk if inaccurate (greenwashing). Worth flagging for stakeholder confirmation. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 12
- **[🔴 high, confidence: high]** The weight field placeholder reads 'e.g. 12 lbs' but the field hint immediately below it reads 'Weight (kg)'. Pounds and kilograms are not interchangeable units — a user who follows the example will store a value roughly 2.2× too large. DOM confirms: placeholder='e.g. 12 lbs' with a <div class='hint'>Weight (kg)</div>. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49–51, pages/new-item.html/screenshot-full.png
- **[🟠 medium, confidence: high]** Footer reads `© 2019 WidgetWorks`. Today is 2026-09-04, making the copyright seven years stale. Either the year was never updated after launch or is hardcoded. Both undermine credibility for a prospective customer and represent a factually incorrect historical claim. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/text-content.txt line 17, pages/item.html_id_w-009/screenshot-full.png
- **[🔴 high, confidence: medium]** The 'Remove this widget' section claims: 'This item will be archived and can be restored within 30 days.' This is a specific, contractual promise — not 'permanently deleted' but a soft delete with a 30-day recovery window. If the actual API performs a hard delete, this claim is false and Dana may not realize her data is gone permanently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16: This item will be archived and can be restored within 30 days., dom-snapshot line 62
  - Open question/risk: Does the backend actually implement soft-delete/archival with a 30-day restore mechanism, or is this aspirational copy on top of a hard delete? If the latter, this is a false claim on a destructive action.

### User Expectations

- **[🔴 high, confidence: high]** Selecting "Price: Low to High" (a "low to high / ascending" option) produced values that are NOT actually in that order: [42,34.99,29.99,27,22.5,19.9,18.4,16.8]. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🔴 high, confidence: high]** Checkbox "notifications" was set to false and the form saved, but after a fresh page load it reads back as true — the saved value does not match what was submitted (possibly inverted or not persisted at all). _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: medium]** A button labeled "Cancel" triggered a network request when clicked — a Cancel-like control that appears to save/submit instead of discarding. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** Clicking 'Next' on 'Page 1 of 3' produces no content change and no status change. The catalog claims 3 pages exist but navigation is completely non-functional, making two-thirds of the catalog unreachable. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.paginationProbes[0]: statusBefore=statusAfter='Page 1 of 3', contentChanged=false, screenshot: Next/Previous buttons present but inert
- **[🔴 high, confidence: high]** Selecting 'Price: Low to High' yields items in descending price order: [42, 34.99, 29.99, 27, 22.5, 19.9, 18.4, 16.8]. The sort direction is inverted relative to the label. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch: claimedDirection=asc, observedValues=[42,34.99,...]
- **[🔴 high, confidence: high]** The interaction probe toggled the 'Email me order updates' checkbox from checked to unchecked, the form was submitted, and after reload the value had reverted to checked (persistedCorrectly: false). The Save changes button appears to have no functional effect on the checkbox state — the CRUD-Update lifecycle is broken for this field. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: interactionProbeFindings.checkboxRoundTrip[0], badResponseCount=1
- **[🟡 low, confidence: medium]** The <input> elements for Name and Email have no 'name' attribute (DOM lines 34, 38). While labels are properly associated via for/id, missing name attributes suppress browser autofill heuristics and could break any native-form fallback path — surprising for a profile form where autofill is expected. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: dom-snapshot.html:34, dom-snapshot.html:38
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted completely empty, the server returns a bad response (badResponseCount: 1, consoleErrorCount: 1), but no error indicator or message is shown to the user (errorIndicatorShown: false, errorTextOnEmptySubmit: null). Sam clicks 'Send message' and nothing visible happens — the outcome is entirely ambiguous. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: scanner: formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: false; badResponseCount: 1; consoleErrorCount: 1
- **[🔴 high, confidence: high]** None of the three form fields (Name, Email, Message) enforce required constraints — no `required` attribute in the DOM, no client-side validation fires before submission. An empty form is sent to the server unchecked. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:39 — <input type="text" id="name"> (no required), dom-snapshot.html:43 — <input type="email" id="email"> (no required), dom-snapshot.html:47 — <textarea id="message" rows="5"></textarea> (no required)
- **[🟡 low, confidence: high]** The badge reads 'Since 2018-06-01' — an ISO 8601 date exposed verbatim in a customer-facing pill. Human readers expect 'Since June 2018' or 'Est. 2018'; the machine format reads as a data leak from an internal field rather than intentional copy. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 12, pages/about.html/screenshot-full.png
- **[🔴 high, confidence: high]** The weight field placeholder reads 'e.g. 12 lbs' but the field hint immediately below it reads 'Weight (kg)'. Pounds and kilograms are not interchangeable units — a user who follows the example will store a value roughly 2.2× too large. DOM confirms: placeholder='e.g. 12 lbs' with a <div class='hint'>Weight (kg)</div>. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 49–51, pages/new-item.html/screenshot-full.png
- **[🔴 high, confidence: medium]** None of the five form fields (name, category, description, price, weight) have an associated <label> element. Each field relies solely on placeholder text for identification. Placeholder text disappears once a user starts typing, leaving no persistent label visible or accessible. WCAG 1.3.1 and 4.1.2 require programmatic labels for form controls. The automated accessibility scanner reported 0 violations, which may indicate a lenient rule configuration rather than genuine compliance. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 36–51
- **[🟠 medium, confidence: high]** Form validation returns the identical message — 'Something went wrong. Please check the form and try again.' — for both an entirely empty submission and for a non-numeric value in the price field. The message does not identify which field is invalid, what the field requires, or what the user should fix. A user who misunderstands why submission failed gets no actionable help. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: formValidationFindings.forms[0].errorTextOnEmptySubmit, formValidationFindings.forms[0].sameErrorTextAcrossScenarios
- **[🟠 medium, confidence: low]** The product description states that item detail pages show a photo for each widget, yet the new-item creation form has no image or photo upload field. If items can only have photos added via a later edit step, that workflow is not surfaced here — a new shop owner creating their first item has no indication a photo can be added at all. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 35–56, app-spec/test-app-description.md
- **[🟡 low, confidence: medium]** The navigation marks 'Catalog' as the active (underlined) link while the user is on new-item.html. Creating a new item is a distinct page, not the catalog list. If a user opened this page via a deep link or bookmark, the active highlight would misdirect them about where they are. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 22, pages/new-item.html/screenshot-full.png
- **[🟡 low, confidence: high]** The browser tab/page title is `Item — WidgetWorks` (generic) rather than `Anodized Standoff Set — WidgetWorks` (item-specific). A user with multiple detail pages open in tabs cannot distinguish them, and search engines/bookmarks also get a meaningless title. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: manifest title field
- **[🔴 high, confidence: high]** The form fires a network request on empty submit with no error indicator shown (errorIndicatorShown: false, errorTextOnEmptySubmit: null). None of the five fields (Name, Category, Description, Price, Weight) carry a `required` attribute or any visible client-side validation guard. A shop owner who accidentally clicks 'Save changes' with a cleared field will push an empty or partial record to the server silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0].networkRequestFiredOnEmptySubmit=true, formValidationFindings.forms[0].errorIndicatorShown=false, dom-snapshot: no required attribute on any input/textarea
  - Open question/risk: Does the server-side handler enforce required fields and return an error, or does it silently persist a partial record? If server validation exists but no error is surfaced back to the UI, Dana has no way to know her save failed.
- **[🔴 high, confidence: high]** The Cancel button (type="button", id="cancelBtn") triggers a network request when clicked. Cancel on an edit form should discard changes and navigate away — it must not send data to the server. A network request from Cancel could mean it is sharing a handler with Save, silently saving changes the user intended to discard, or making an unrelated call. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0].triggeredNetworkRequest=true, dom-snapshot line 56: <button type=button class=btn btn-secondary id=cancelBtn>Cancel</button>
  - Open question/risk: What network request does Cancel actually fire? If it's a GET (e.g., fetching the item to reload), it may be benign. If it's a PUT/PATCH/POST it could be saving changes Dana intended to throw away.
- **[🔴 high, confidence: medium]** The 'Remove this widget' section claims: 'This item will be archived and can be restored within 30 days.' This is a specific, contractual promise — not 'permanently deleted' but a soft delete with a 30-day recovery window. If the actual API performs a hard delete, this claim is false and Dana may not realize her data is gone permanently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16: This item will be archived and can be restored within 30 days., dom-snapshot line 62
  - Open question/risk: Does the backend actually implement soft-delete/archival with a 30-day restore mechanism, or is this aspirational copy on top of a hard delete? If the latter, this is a false claim on a destructive action.
- **[🟠 medium, confidence: medium]** No delete confirmation dialog structure is present anywhere in the DOM snapshot. A single click on 'Delete widget' appears to immediately trigger the delete operation. Industry convention and user safety both require a confirmation step, especially given the irreversibility claim is already uncertain. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot: no modal or dialog element present, screenshot-full.png: single Delete widget button with no confirm affordance visible
  - Open question/risk: Does the JS for deleteBtn attach a window.confirm() or inline modal? If not, a misclick permanently removes a catalog item with no recovery prompt.
- **[🟠 medium, confidence: high]** Price and Weight fields use type=text rather than type=number. The scanner confirmed that submitting an invalid (non-numeric) value still fires a network request with no error shown. A shop owner could accidentally enter 'tbc' in Price and the request goes through unchallenged. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot lines 48, 52: type=text on price and weight inputs, formValidationFindings.forms[0].networkRequestFiredOnInvalidType=true, formValidationFindings.forms[0].errorTextOnInvalidType=null
  - Open question/risk: Does the server validate numeric types and reject non-numeric price/weight values, or can a text string be persisted as a price?

### Purpose

- **[🟠 medium, confidence: high]** 3 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🔴 high, confidence: high]** Typing a query into search input "searchInput" and pressing Enter produced no change to the page — the search control appears to be wired to nothing. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🔴 high, confidence: high]** Clicking "Next" (status showed "Page 1 of 3", implying more than one page) produced no change to the page content or page-status text — pagination appears to be non-functional, making most of the list unreachable. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: high]** 1 network response(s) with a 4xx/5xx status. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🔴 high, confidence: high]** A "Next"-like pagination control exists but clicking it produced no change to the page — content beyond the first page is unreachable through the UI, and could not be explored this session as a result. _(source: deterministic)_
  - Page: http://localhost:4173
- **[🔴 high, confidence: high]** Clicking 'Next' on 'Page 1 of 3' produces no content change and no status change. The catalog claims 3 pages exist but navigation is completely non-functional, making two-thirds of the catalog unreachable. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.paginationProbes[0]: statusBefore=statusAfter='Page 1 of 3', contentChanged=false, screenshot: Next/Previous buttons present but inert
- **[🔴 high, confidence: high]** Selecting 'Price: Low to High' yields items in descending price order: [42, 34.99, 29.99, 27, 22.5, 19.9, 18.4, 16.8]. The sort direction is inverted relative to the label. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch: claimedDirection=asc, observedValues=[42,34.99,...]
- **[🔴 high, confidence: high]** The search box is completely non-functional: entering a nonsense query produces zero change in the product grid. This silently fails — no error message, no 'no results' state, no feedback of any kind. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.searchProbes[0]: contentChangedAtAll=false, screenshot: search box present with placeholder 'Search widgets…'
- **[🟠 medium, confidence: low]** The product description states that item detail pages show a photo for each widget, yet the new-item creation form has no image or photo upload field. If items can only have photos added via a later edit step, that workflow is not surfaced here — a new shop owner creating their first item has no indication a photo can be added at all. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 35–56, app-spec/test-app-description.md
- **[🟠 medium, confidence: medium]** No product photograph is present; the image slot shows a brown placeholder tile with the initials `AS`. Item detail is described in the product spec as showing 'full description, price, and photo' — the photo is the primary visual evidence a browsing customer uses to evaluate the item. A placeholder satisfies none of that purpose. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png
  - Open question/risk: Is the image placeholder expected for items where no photo has been uploaded, or is this a data-entry gap for this specific item? If the former, the placeholder UI should still communicate that a photo is missing rather than silently substituting initials.

### Statutes/Standards

- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🔴 high, confidence: high]** Accessibility: Elements must meet minimum color contrast ratio thresholds (color-contrast, impact: serious) _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🟠 medium, confidence: medium]** All product images have empty alt attributes (alt=""). Product images in a catalog are informative — they depict what the item looks like — and should carry descriptive alt text for screen-reader users. Empty alt signals to assistive technology that the image is purely decorative, which it is not. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: dom-snapshot.html lines 61, 70, 79, 88, 97, 106, 115, 124: all img tags have alt=""
  - Open question/risk: Automated accessibility scanner did not flag this (empty alt is technically valid for decorative images), but by catalogue-context judgement these images are informative. Warrants manual verification with a screen reader.
- **[🟡 low, confidence: medium]** The <input> elements for Name and Email have no 'name' attribute (DOM lines 34, 38). While labels are properly associated via for/id, missing name attributes suppress browser autofill heuristics and could break any native-form fallback path — surprising for a profile form where autofill is expected. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: dom-snapshot.html:34, dom-snapshot.html:38
- **[🔴 high, confidence: high]** None of the three form fields (Name, Email, Message) enforce required constraints — no `required` attribute in the DOM, no client-side validation fires before submission. An empty form is sent to the server unchecked. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:39 — <input type="text" id="name"> (no required), dom-snapshot.html:43 — <input type="email" id="email"> (no required), dom-snapshot.html:47 — <textarea id="message" rows="5"></textarea> (no required)
- **[🔴 high, confidence: high]** The helper text 'Please include your order number if applicable.' renders in #b5b5b5 on a #ffffff background, giving a contrast ratio of only 2.05:1 — far below the WCAG 2 AA minimum of 4.5:1 for normal text. This is a confirmed serious accessibility violation. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: scanner: accessibilityViolations[0] — color-contrast, impact: serious, foreground #b5b5b5 / background #ffffff, ratio 2.05:1, dom-snapshot.html:12 — .helper-text { color: #B5B5B5; }
- **[🟡 low, confidence: low]** 'Carbon-neutral shipping on every order' is a substantive environmental claim in a prominent badge. The evidence cannot confirm or deny the underlying business practice, but the claim is verifiable and carries regulatory/reputational risk if inaccurate (greenwashing). Worth flagging for stakeholder confirmation. _(source: ai)_
  - Page: http://localhost:4173/about.html
  - Evidence: pages/about.html/text-content.txt line 12
- **[🔴 high, confidence: medium]** None of the five form fields (name, category, description, price, weight) have an associated <label> element. Each field relies solely on placeholder text for identification. Placeholder text disappears once a user starts typing, leaving no persistent label visible or accessible. WCAG 1.3.1 and 4.1.2 require programmatic labels for form controls. The automated accessibility scanner reported 0 violations, which may indicate a lenient rule configuration rather than genuine compliance. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 36–51
- **[🟠 medium, confidence: medium]** The price field is declared as type='text', not type='number'. This means the browser applies no native numeric constraint — negative prices, letters, or currency symbols are accepted at the input level. The custom validation handler does catch the invalid-type case on submit, but client-side type enforcement is entirely absent, and it is unknown whether server-side validation enforces a positive numeric constraint independently. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 46
- **[🔴 high, confidence: high]** The form fires a network request on empty submit with no error indicator shown (errorIndicatorShown: false, errorTextOnEmptySubmit: null). None of the five fields (Name, Category, Description, Price, Weight) carry a `required` attribute or any visible client-side validation guard. A shop owner who accidentally clicks 'Save changes' with a cleared field will push an empty or partial record to the server silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0].networkRequestFiredOnEmptySubmit=true, formValidationFindings.forms[0].errorIndicatorShown=false, dom-snapshot: no required attribute on any input/textarea
  - Open question/risk: Does the server-side handler enforce required fields and return an error, or does it silently persist a partial record? If server validation exists but no error is surfaced back to the UI, Dana has no way to know her save failed.
- **[🟡 low, confidence: high]** Heading hierarchy jumps from h1 'Edit widget' directly to h3 'Remove this widget', skipping h2. Screen readers announce heading levels to orient users; a skip from h1 to h3 breaks the document outline and may confuse assistive technology users navigating by heading. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot lines 32, 61: h1 then h3 with no h2 between them
  - Open question/risk: Is this heading-level skip intentional (treating the danger zone as a sub-section of an implied h2), or an oversight?

## CRUD Findings

### Create

- **[🟠 medium, confidence: medium]** Form "accountForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: medium]** Form "contactForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/contact.html
- **[🟠 medium, confidence: medium]** Form "editItemForm" fired a network request even when submitted empty — client-side validation may be missing or incomplete. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
- **[🔴 high, confidence: high]** Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward — the create action silently does not persist. _(source: deterministic)_
  - Page: http://localhost:4173
- **[🔴 high, confidence: high]** The contact form fires a network request when submitted completely empty, the server returns a bad response (badResponseCount: 1, consoleErrorCount: 1), but no error indicator or message is shown to the user (errorIndicatorShown: false, errorTextOnEmptySubmit: null). Sam clicks 'Send message' and nothing visible happens — the outcome is entirely ambiguous. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: scanner: formValidationFindings — networkRequestFiredOnEmptySubmit: true, errorIndicatorShown: false; badResponseCount: 1; consoleErrorCount: 1
- **[🔴 high, confidence: high]** None of the three form fields (Name, Email, Message) enforce required constraints — no `required` attribute in the DOM, no client-side validation fires before submission. An empty form is sent to the server unchecked. _(source: ai)_
  - Page: http://localhost:4173/contact.html
  - Evidence: dom-snapshot.html:39 — <input type="text" id="name"> (no required), dom-snapshot.html:43 — <input type="email" id="email"> (no required), dom-snapshot.html:47 — <textarea id="message" rows="5"></textarea> (no required)
- **[🟠 medium, confidence: medium]** The price field is declared as type='text', not type='number'. This means the browser applies no native numeric constraint — negative prices, letters, or currency symbols are accepted at the input level. The custom validation handler does catch the invalid-type case on submit, but client-side type enforcement is entirely absent, and it is unknown whether server-side validation enforces a positive numeric constraint independently. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html line 46
- **[🟠 medium, confidence: low]** The product description states that item detail pages show a photo for each widget, yet the new-item creation form has no image or photo upload field. If items can only have photos added via a later edit step, that workflow is not surfaced here — a new shop owner creating their first item has no indication a photo can be added at all. _(source: ai)_
  - Page: http://localhost:4173/new-item.html
  - Evidence: pages/new-item.html/dom-snapshot.html lines 35–56, app-spec/test-app-description.md

### Read

- **[🔴 high, confidence: high]** Clicking "Next" (status showed "Page 1 of 3", implying more than one page) produced no change to the page content or page-status text — pagination appears to be non-functional, making most of the list unreachable. _(source: deterministic)_
  - Page: http://localhost:4173/catalog.html
- **[🔴 high, confidence: high]** A "Next"-like pagination control exists but clicking it produced no change to the page — content beyond the first page is unreachable through the UI, and could not be explored this session as a result. _(source: deterministic)_
  - Page: http://localhost:4173
- **[🔴 high, confidence: high]** Clicking 'Next' on 'Page 1 of 3' produces no content change and no status change. The catalog claims 3 pages exist but navigation is completely non-functional, making two-thirds of the catalog unreachable. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.paginationProbes[0]: statusBefore=statusAfter='Page 1 of 3', contentChanged=false, screenshot: Next/Previous buttons present but inert
- **[🔴 high, confidence: high]** Selecting 'Price: Low to High' yields items in descending price order: [42, 34.99, 29.99, 27, 22.5, 19.9, 18.4, 16.8]. The sort direction is inverted relative to the label. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.directionalControls[0].directionClaimMismatch: claimedDirection=asc, observedValues=[42,34.99,...]
- **[🔴 high, confidence: high]** The search box is completely non-functional: entering a nonsense query produces zero change in the product grid. This silently fails — no error message, no 'no results' state, no feedback of any kind. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: interactionProbeFindings.searchProbes[0]: contentChangedAtAll=false, screenshot: search box present with placeholder 'Search widgets…'
- **[🟠 medium, confidence: high]** Cable Tension Meter's image has an incorrect src path '/img/widgets-missing/w-024.svg' (note 'widgets-missing' instead of 'widgets'), resulting in a broken image icon visible in the screenshot. All other product images use '/img/widgets/'. _(source: ai)_
  - Page: http://localhost:4173/catalog.html
  - Evidence: dom-snapshot.html line 115: src='/img/widgets-missing/w-024.svg', screenshot: broken image icon on Cable Tension Meter card, badResponseCount: 3, consoleErrorCount: 3
- **[🟠 medium, confidence: medium]** No product photograph is present; the image slot shows a brown placeholder tile with the initials `AS`. Item detail is described in the product spec as showing 'full description, price, and photo' — the photo is the primary visual evidence a browsing customer uses to evaluate the item. A placeholder satisfies none of that purpose. _(source: ai)_
  - Page: http://localhost:4173/item.html?id=w-009
  - Evidence: pages/item.html_id_w-009/screenshot-full.png
  - Open question/risk: Is the image placeholder expected for items where no photo has been uploaded, or is this a data-entry gap for this specific item? If the former, the placeholder UI should still communicate that a photo is missing rather than silently substituting initials.

### Update

- **[🔴 high, confidence: high]** Checkbox "notifications" was set to false and the form saved, but after a fresh page load it reads back as true — the saved value does not match what was submitted (possibly inverted or not persisted at all). _(source: deterministic)_
  - Page: http://localhost:4173/account.html
- **[🟠 medium, confidence: medium]** Editing and saving this record does not result in the change being visible afterward — the update does not appear to persist for this record. _(source: deterministic)_
  - Page: http://localhost:4173/item.html?id=w-009
- **[🔴 high, confidence: high]** Editing this record changed a DIFFERENT record instead/as well: [{"href":"/item.html?id=w-002","beforeText":"(not visible in this view before the edit)","afterText":"AAA-PROBE-1788540316172-UPDATED-1\n        Exploratory tester probe value\n        $9.990"}]. This is a strong signal of an index-vs-id mismatch in how updates are applied. _(source: deterministic)_
  - Page: http://localhost:4173/item.html?id=w-009
- **[🟠 medium, confidence: medium]** Editing and saving this record does not result in the change being visible afterward — the update does not appear to persist for this record. _(source: deterministic)_
  - Page: http://localhost:4173/item.html?id=w-021
- **[🔴 high, confidence: high]** Editing this record changed a DIFFERENT record instead/as well: [{"href":"/item.html?id=w-004","beforeText":"(not visible in this view before the edit)","afterText":"AAA-PROBE-1788540316172-UPDATED-2\n        Exploratory tester probe value\n        $9.990"}]. This is a strong signal of an index-vs-id mismatch in how updates are applied. _(source: deterministic)_
  - Page: http://localhost:4173/item.html?id=w-021
- **[🟠 medium, confidence: high]** The Save button is not disabled while a save is in flight — two rapid clicks fired 2 separate mutating requests, risking a lost update on a slow network or an impatient double-click. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-021
- **[🔴 high, confidence: high]** The interaction probe toggled the 'Email me order updates' checkbox from checked to unchecked, the form was submitted, and after reload the value had reverted to checked (persistedCorrectly: false). The Save changes button appears to have no functional effect on the checkbox state — the CRUD-Update lifecycle is broken for this field. _(source: ai)_
  - Page: http://localhost:4173/account.html
  - Evidence: interactionProbeFindings.checkboxRoundTrip[0], badResponseCount=1
- **[🔴 high, confidence: high]** The form fires a network request on empty submit with no error indicator shown (errorIndicatorShown: false, errorTextOnEmptySubmit: null). None of the five fields (Name, Category, Description, Price, Weight) carry a `required` attribute or any visible client-side validation guard. A shop owner who accidentally clicks 'Save changes' with a cleared field will push an empty or partial record to the server silently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.forms[0].networkRequestFiredOnEmptySubmit=true, formValidationFindings.forms[0].errorIndicatorShown=false, dom-snapshot: no required attribute on any input/textarea
  - Open question/risk: Does the server-side handler enforce required fields and return an error, or does it silently persist a partial record? If server validation exists but no error is surfaced back to the UI, Dana has no way to know her save failed.
- **[🔴 high, confidence: high]** The Cancel button (type="button", id="cancelBtn") triggers a network request when clicked. Cancel on an edit form should discard changes and navigate away — it must not send data to the server. A network request from Cancel could mean it is sharing a handler with Save, silently saving changes the user intended to discard, or making an unrelated call. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: formValidationFindings.cancelButtonProbes[0].triggeredNetworkRequest=true, dom-snapshot line 56: <button type=button class=btn btn-secondary id=cancelBtn>Cancel</button>
  - Open question/risk: What network request does Cancel actually fire? If it's a GET (e.g., fetching the item to reload), it may be benign. If it's a PUT/PATCH/POST it could be saving changes Dana intended to throw away.
- **[🟠 medium, confidence: high]** Price and Weight fields use type=text rather than type=number. The scanner confirmed that submitting an invalid (non-numeric) value still fires a network request with no error shown. A shop owner could accidentally enter 'tbc' in Price and the request goes through unchallenged. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot lines 48, 52: type=text on price and weight inputs, formValidationFindings.forms[0].networkRequestFiredOnInvalidType=true, formValidationFindings.forms[0].errorTextOnInvalidType=null
  - Open question/risk: Does the server validate numeric types and reject non-numeric price/weight values, or can a text string be persisted as a price?

### Delete

- **[🟠 medium, confidence: high]** After deleting a record, it still appears on the list page within the same browser session until a hard refresh — the list view is using stale cached data that isn't invalidated on delete. _(source: deterministic)_
  - Page: http://localhost:4173
- **[🟡 low, confidence: low]** Delete confirmation dialog text: "This item will be archived and can be restored within 30 days. Continue?" — worth checking this claim (e.g. about recoverability) against what deletion actually does server-side. _(source: deterministic)_
  - Page: http://localhost:4173/edit-item.html?id=w-001
- **[🔴 high, confidence: medium]** The 'Remove this widget' section claims: 'This item will be archived and can be restored within 30 days.' This is a specific, contractual promise — not 'permanently deleted' but a soft delete with a 30-day recovery window. If the actual API performs a hard delete, this claim is false and Dana may not realize her data is gone permanently. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: text-content.txt line 16: This item will be archived and can be restored within 30 days., dom-snapshot line 62
  - Open question/risk: Does the backend actually implement soft-delete/archival with a 30-day restore mechanism, or is this aspirational copy on top of a hard delete? If the latter, this is a false claim on a destructive action.
- **[🟠 medium, confidence: medium]** No delete confirmation dialog structure is present anywhere in the DOM snapshot. A single click on 'Delete widget' appears to immediately trigger the delete operation. Industry convention and user safety both require a confirmation step, especially given the irreversibility claim is already uncertain. _(source: ai)_
  - Page: http://localhost:4173/edit-item.html?id=w-009
  - Evidence: dom-snapshot: no modal or dialog element present, screenshot-full.png: single Delete widget button with no confirm affordance visible
  - Open question/risk: Does the JS for deleteBtn attach a window.confirm() or inline modal? If not, a misclick permanently removes a catalog item with no recovery prompt.

### CRUD smoke flow detail

### create
- formUrl: http://localhost:4173/new-item.html
- tagValue: AAA-PROBE-1788540316172
- navigatedTo: http://localhost:4173/catalog.html

### read-after-create
- listUrl: http://localhost:4173/catalog.html
- foundOnListPage: false

### update-0
- itemUrl: http://localhost:4173/item.html?id=w-001
- editUrl: http://localhost:4173/edit-item.html?id=w-001
- originalName: null
- updatedTag: AAA-PROBE-1788540316172-UPDATED-0
- intendedItemReflectsUpdate: true
- otherRecordsThatChangedUnexpectedly: []

### update-1
- itemUrl: http://localhost:4173/item.html?id=w-009
- editUrl: http://localhost:4173/edit-item.html?id=w-009
- originalName: Anodized Standoff Set
- updatedTag: AAA-PROBE-1788540316172-UPDATED-1
- intendedItemReflectsUpdate: false
- otherRecordsThatChangedUnexpectedly: [{"href":"/item.html?id=w-002","beforeText":"(not visible in this view before the edit)","afterText":"AAA-PROBE-1788540316172-UPDATED-1\n        Exploratory tester probe value\n        $9.990"}]

### update-2
- itemUrl: http://localhost:4173/item.html?id=w-021
- editUrl: http://localhost:4173/edit-item.html?id=w-021
- originalName: Anti-Vibration Washer Set
- updatedTag: AAA-PROBE-1788540316172-UPDATED-2
- intendedItemReflectsUpdate: false
- otherRecordsThatChangedUnexpectedly: [{"href":"/item.html?id=w-004","beforeText":"(not visible in this view before the edit)","afterText":"AAA-PROBE-1788540316172-UPDATED-2\n        Exploratory tester probe value\n        $9.990"}]

### update-double-submit-race
- editUrl: http://localhost:4173/edit-item.html?id=w-021
- saveButtonDisabledAfterFirstClick: false
- mutatingRequestsFiredFromTwoRapidClicks: 2

### read-beyond-page-1
- attempted: true
- reached: false
- page2ItemUrl: null

### delete
- deleteEditUrl: http://localhost:4173/edit-item.html?id=w-001
- deletedItemName: AAA-PROBE-1788540316172-UPDATED-0
- confirmDialogMessage: This item will be archived and can be restored within 30 days. Continue?
- stillVisibleInSameSessionAfterDelete: true
- stillVisibleInFreshSessionAfterDelete: false

**Confirmation dialog text captured during the session:**
- "This item will be archived and can be restored within 30 days. Continue?"

## Deterministic Scan Summary

- Pages scanned: 9
- Broken links: 0
- Broken assets: 1
- Console errors (total): 5
- Accessibility violations (total): 1
- Visual deviations from golden reference (total): 8
- CRUD smoke flow ran: true

## Open Questions

- http://localhost:4173 (Home): Does the actual seeded catalog contain 1,200+ items, or is that figure aspirational/stale marketing copy that will always mismatch the real catalog count?
- http://localhost:4173 (Home): Should the stats block be wired to a live API endpoint (e.g. GET /api/stats) so it stays accurate as inventory changes — was this an intentional design choice or a deferred implementation?
- http://localhost:4173 (Home): The 'Fast answers' card says 'reach out any time' — is there a defined SLA or async-support mechanism behind the Contact page, or is this an unsubstantiated availability claim?
- http://localhost:4173/index.html: Do the hardcoded stats (1,200+ parts, 6 categories, 10k+ customers) reflect actual live catalog data, or are they aspirational copy that was never wired to the API?
- http://localhost:4173/index.html: Is there a plan to make the stats section dynamic, or are these values intended to be updated manually on each deploy?
- http://localhost:4173/index.html: The 'Fast answers' card says 'reach out any time' — does the Contact page set any expectation about response time, and does that match this implicit promise?
- http://localhost:4173/catalog.html: Does the 'Download catalog (PDF)' button work? The DOM shows href='#' with an id suggesting a JS click handler, but 3 console errors are present and the scanner could not confirm the download triggers. This needs manual verification.
- http://localhost:4173/catalog.html: Are pages 2 and 3 of the catalog correctly populated server-side, or is broken pagination masking additional data issues?
- http://localhost:4173/catalog.html: Is the 3-decimal-place price formatting a locale misconfiguration (e.g., toFixed(3) instead of toFixed(2)) or does it reflect a data storage issue (prices stored in thousandths)?
- http://localhost:4173/catalog.html: The scanner recorded 3 bad HTTP responses and 3 console errors. One is attributable to the missing Cable Tension Meter image. What are the other two?
- http://localhost:4173/catalog.html: Is 'Price: High to Low' also inverted (i.e., actually ascending), or is only the 'Low to High' option broken?
- http://localhost:4173/account.html: Does 'Save changes' display any success feedback (e.g. via formBanner) when the API call actually succeeds, or is the banner always silent?
- http://localhost:4173/account.html: What HTTP endpoint is returning the bad response, and what is its response body — is the account API entirely broken or only under certain conditions?
- http://localhost:4173/account.html: Does the 'Last updated' timestamp (currently 11/2/2025) actually refresh when a successful save is made, or is it hardcoded in the server seed data?
- http://localhost:4173/account.html: Are the missing 'name' attributes on Name and Email inputs deliberate (JS-only form handling reads by id) or an accidental omission that would break a non-JS or native-form fallback?
- http://localhost:4173/contact.html: Does the contact.js script show any success feedback path at all — is there a code path that should display a confirmation banner in #formBanner that is simply failing to trigger due to the server error?
- http://localhost:4173/contact.html: What does the server actually return on a bad submit — a 4xx validation error or a 5xx? This would determine whether the root cause is missing client validation, a broken server endpoint, or both.
- http://localhost:4173/contact.html: Is the '1 hour, 24/7' response-time claim intentional marketing copy agreed upon by the business, or placeholder text that was never reviewed?
- http://localhost:4173/contact.html: Does the FAQ claim that 'the catalog page reflects current stock in real time' hold up — is the catalog actually live-synced, or is it a static/cached view?
- http://localhost:4173/about.html: Is the '15 years' figure a copy-paste from a template that was never updated, or is it dynamically computed from a wrong base date — the fix differs depending on the answer.
- http://localhost:4173/about.html: Should the copyright year be the founding year (2018/2019), the current year (2026), or a range (2018–2026)? Current value appears to have been hardcoded rather than generated.
- http://localhost:4173/about.html: Is the second in-body logo intentional brand storytelling on the About page specifically, or is it a template artifact that leaked in?
- http://localhost:4173/about.html: Does 'Carbon-neutral shipping on every order' reflect a current certified programme, and does any other page in the product make a conflicting or absent claim about shipping that would create a Claims inconsistency?
- http://localhost:4173/new-item.html: Does the server-side API enforce that price is a positive number, or would a negative or non-numeric string be accepted and persisted?
- http://localhost:4173/new-item.html: Is photo upload available via the edit-item flow after creation, or is it simply missing from the product entirely?
- http://localhost:4173/new-item.html: Is 'Catalog' as the active nav link on new-item.html an intentional design decision (new item as a sub-flow of Catalog), or an oversight?
- http://localhost:4173/new-item.html: The automated accessibility scanner reported 0 violations despite no <label> elements — what ruleset/tool version is being used, and are label-association rules enabled?
- http://localhost:4173/item.html?id=w-009: Is the three-decimal-place price (`$14.200`) a rendering bug (the value stored is 14.2 and the formatter pads to three places) or a data-entry bug (the stored value is literally 14.200)? Checking other items with non-round prices would confirm scope.
- http://localhost:4173/item.html?id=w-009: Is the placeholder image (`AS` initials tile) the intended fallback UI for items without an uploaded photo, or does this item have a photo URL that failed to load silently?
- http://localhost:4173/item.html?id=w-009: The `Edit this widget` button is fully visible to anonymous visitors (Sam). Given the no-auth design, is this intentional and accepted, or is there a planned access-control layer not yet implemented?
- http://localhost:4173/edit-item.html?id=w-009: What HTTP method and payload does the Cancel button's network request actually send — is it a GET reload of the item data, or a mutation request?
- http://localhost:4173/edit-item.html?id=w-009: Does the backend's delete endpoint perform a true soft-delete (archival + 30-day restore) or a hard delete? No restore UI is visible anywhere in the evidence bundle, which makes the soft-delete claim harder to trust.
- http://localhost:4173/edit-item.html?id=w-009: Do the other edit-item pages (w-001, w-006, etc.) exhibit the same primary button color drift, or is it isolated to w-009's rendered state?
- http://localhost:4173/edit-item.html?id=w-009: Are there server-side validation responses that the UI should be surfacing but is silently swallowing on empty or invalid submit?

## Session Metadata

- Run ID: measured-run-4
- Evidence directory: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\measured-run-4
- AI findings: C:\Users\PaulYardley\Projects\ExporitoryTesting\exploratory-tester\runs\measured-run-4\ai-findings
