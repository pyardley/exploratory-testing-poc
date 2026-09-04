# WidgetWorks — Deliberate Fault Catalog (Answer Key)

**This file is ground truth for grading the exploratory-tester tool. It must never be read by exploratory-tester/ — only `comparison/` may reference it, and only after a tester run already exists.**

Golden reference page: `index.html`  
Total seeded faults: **41**

---

## Familiarity (3)

### F-01 — Header logo is not a link home
- **Page(s):** account.html
- **What it is:** On every other page the header logo is wrapped in a link back to index.html. On account.html it is a bare <img> with no surrounding <a>.
- **Technical detail:** test-app/public/account.html header markup omits the <a href="/index.html"> wrapper present on all other pages.

### F-02 — Primary submit button styled as secondary
- **Page(s):** contact.html
- **What it is:** The 'Send message' button uses the secondary (grey) button style instead of the primary (blue) style used for the equivalent primary action on every other form in the app, making it read as disabled or de-emphasized.
- **Technical detail:** #contactSubmitBtn has class btn-secondary instead of btn-primary.

### F-03 — Product cards have no hover feedback
- **Page(s):** catalog.html
- **What it is:** Cards elsewhere in the app (e.g. the Home page feature cards) lift and show a shadow on hover. Catalog product cards show no hover state at all, inconsistent with the app's own interaction pattern.
- **Technical detail:** Catalog product cards use class="card product-card" but omit the card-hover class that provides the :hover elevation styles in main.css.

## Explainability (3)

### E-01 — All validation failures show one generic message
- **Page(s):** new-item.html
- **What it is:** Whether the name is missing, the price is blank, or the price isn't a number, the form shows the same generic 'Something went wrong. Please check the form and try again.' with no indication of which field is the problem.
- **Technical detail:** public/js/new-item.js sets the same banner text for every validation branch instead of identifying the offending field.

### E-02 — Raw JavaScript error exposed to the user
- **Page(s):** account.html
- **What it is:** Saving the account form with an empty Name field displays a raw technical error string in the UI banner instead of a human-readable message.
- **Technical detail:** The PATCH /api/account 400 response body has details: null, but public/js/account.js unconditionally reads data.details.field, throwing a TypeError that is caught and rendered verbatim as 'Error: Cannot read properties of null (reading 'field')'.

### E-03 — Save gives no success or failure feedback
- **Page(s):** edit-item.html
- **What it is:** Clicking Save shows a brief 'Saving…' state on the button and then silently reverts, with no confirmation that the save succeeded (or failed).
- **Technical detail:** public/js/edit-item.js's saveItem() never renders a success or error banner after the PATCH request resolves.

## World (3)

### W-01 — Prices rendered with 3 decimal places
- **Page(s):** catalog.html, item.html
- **What it is:** Prices are displayed like $19.999 instead of standard 2-decimal currency formatting, on both the catalog grid and the item detail page.
- **Technical detail:** public/js/catalog.js and public/js/item.js both call price.toFixed(3) instead of toFixed(2).

### W-02 — Inconsistent date formats across the app
- **Page(s):** item.html vs about.html
- **What it is:** Item detail pages show 'Added on' in an ambiguous DD/MM/YYYY-or-MM/DD/YYYY numeric format (e.g. 05/12/2025), while the About page states 'Since 2018-06-01' in ISO format — the same product using two different date conventions.
- **Technical detail:** Seed data addedOn fields use "DD/MM/YYYY" strings (test-app/server/data/seed.json), rendered as-is by item.js, while about.html hardcodes an ISO-format date string.

### W-03 — Weight field labeled in kg with a pounds example
- **Page(s):** new-item.html
- **What it is:** The field is labeled 'Weight (kg)' but its placeholder/example text reads 'e.g. 12 lbs' — a unit mismatch.
- **Technical detail:** public/new-item.html: the weight input's placeholder says "e.g. 12 lbs" directly under a "Weight (kg)" hint label.

## History (4)

### H-01 — Copyright year hardcoded to 2019 everywhere except Home
- **Page(s):** catalog.html, item.html, new-item.html, edit-item.html, account.html, contact.html, about.html
- **What it is:** Every page's footer shows a fixed '© 2019 WidgetWorks' except the Home page, which computes the current year with JavaScript.
- **Technical detail:** Only index.html has the <script> that sets #copyright-year to new Date().getFullYear(); every other page has a literal "2019" in its footer markup.

### H-02 — Founding-date arithmetic doesn't add up
- **Page(s):** about.html
- **What it is:** "Founded in 2018, ... serving customers for over 15 years" — from 2018 to the present is roughly 7-8 years, not over 15.
- **Technical detail:** Static copy in test-app/public/about.html's 'Our story' paragraph.

### H-03 — 'Last updated' timestamp never advances
- **Page(s):** account.html
- **What it is:** Saving the account form successfully does not change the displayed 'Last updated' date — it stays fixed at its original seed value no matter how many times you save.
- **Technical detail:** test-app/server/lib/store.js's updateAccount() spreads the existing account object without setting a new updatedAt on write.

### H-04 — Golden reference page's own brand color silently drifted from a prior release
- **Page(s):** index.html
- **What it is:** The primary brand blue on the Home page (nav active-state, hero CTA button) no longer matches the value that shipped in the previous git commit — it changed from #2C6FBB to #3B6FA0 with no changelog, announcement, or accompanying update anywhere else in the app.
- **Technical detail:** test-app/public/index.html has an inline <style>:root{--color-primary:#3B6FA0;}</style> added after the main.css link in a later commit, overriding the shared brand token on this page only. Added deliberately in a follow-up commit to exercise the History heuristic specifically: this is undetectable by any single-snapshot comparison (nav/visual-consistency scanning, cross-page checks) because every other page's 'golden reference' comparison is defined relative to whatever index.html currently shows — since index.html itself is the thing that regressed, the scanner has no independent oracle to catch it, and would instead perversely start flagging every OTHER (still-correct) page as deviating from the now-wrong golden color. Only detectable by diffing this commit against the app's own git history (e.g. git log -p -- test-app/public/index.html, or comparing against a previous release/tag), which the current exploratory-tester tool does not do — see README.md Recommendations.

## Image (4)

### I-01 — Logo rendered at a distorted aspect ratio
- **Page(s):** about.html
- **What it is:** The About page's logo is visibly stretched vertically compared to its correct proportions everywhere else in the app.
- **Technical detail:** .about-logo is explicitly sized 200x120px against the logo's native 160x40 (4:1) viewBox, changing its aspect ratio from 4:1 to ~1.67:1.

### I-02 — Product thumbnails squashed instead of cropped
- **Page(s):** catalog.html
- **What it is:** Catalog thumbnails visibly distort product images (squashed to fit) instead of cropping them proportionally, unlike the item detail page which crops correctly.
- **Technical detail:** catalog.html's inline style overrides .product-card img to object-fit: fill, overriding the object-fit: cover default from main.css that item.html uses unmodified.

### I-03 — One product image is broken (real 404)
- **Page(s):** catalog.html, item.html
- **What it is:** The 'Cable Tension Meter' widget's image fails to load — a genuine broken-image icon, not a placeholder.
- **Technical detail:** Seed item w-024's imageUrl points to /img/widgets-missing/w-024.svg, a path that does not exist; every other item's image was generated under /img/widgets/.

### I-04 — Missing favicon
- **Page(s):** contact.html
- **What it is:** Every other page declares a favicon; the Contact page does not, so the browser tab reverts to a default icon there.
- **Technical detail:** contact.html's <head> omits the <link rel="icon" ...> tag present in every other page's <head>.

## Comparable Products (internal consistency) (3)

### C-01 — Primary CTA color drifts from brand blue
- **Page(s):** new-item.html
- **What it is:** The 'Save widget' button uses a slightly different blue (#2D6FC0) than the brand's actual primary color (#2C6FBB) used everywhere else, including the equivalent button on every other page.
- **Technical detail:** new-item.html's inline <style> overrides #saveBtn's background to #2D6FC0 instead of inheriting .btn-primary's var(--color-primary).

### C-02 — Missing web font import — silently falls back to a system font
- **Page(s):** account.html
- **What it is:** Every other page loads the Inter typeface via Google Fonts; the Account page omits that import entirely, so it silently renders in a different (system/Arial-family) font than the rest of the app.
- **Technical detail:** account.html's <head> lacks the <link rel="preconnect"...> and Google Fonts <link href="https://fonts.googleapis.com/css2?family=Inter..."> tags present on every other page; CSS font-family falls through to the system-ui/sans-serif fallbacks.

### C-03 — Submit button has square corners
- **Page(s):** contact.html
- **What it is:** The 'Send message' button has 0px corner radius, while every other primary/secondary button in the app uses a consistent 6px radius.
- **Technical detail:** contact.html's inline <style> sets #contactSubmitBtn { border-radius: 0; }, overriding the shared .btn radius.

## User Expectations (3)

### U-01 — Cancel button actually saves
- **Page(s):** edit-item.html
- **What it is:** Clicking 'Cancel' on the edit form does not discard changes — it calls the same save routine as the Save button, persisting whatever is currently in the form.
- **Technical detail:** public/js/edit-item.js wires #cancelBtn's click handler to call saveItem(), the same function used by the form's submit handler.

### U-02 — Notification checkbox is inverted on save
- **Page(s):** account.html
- **What it is:** Checking 'Email me order updates' and saving actually turns notifications OFF; unchecking it turns them ON — the stored state is the opposite of what the user selected.
- **Technical detail:** public/js/account.js builds the PATCH payload with notifications: !document.getElementById('notifications').checked — the boolean is negated.

### U-03 — "Price: Low to High" sorts High to Low
- **Page(s):** catalog.html
- **What it is:** Selecting the 'Price: Low to High' sort option actually orders the catalog from most to least expensive.
- **Technical detail:** public/js/catalog.js's comparator for the 'price-asc' sort key uses b.price - a.price (a descending comparator) instead of a.price - b.price.

## Purpose (3)

### P-01 — Contact form never actually delivers
- **Page(s):** contact.html
- **What it is:** Submitting the contact form always shows 'Message sent!' regardless of what actually happened — the form posts to an endpoint that doesn't exist server-side (404), so no message is ever actually delivered.
- **Technical detail:** public/js/contact.js POSTs to /api/contact, which has no corresponding Express route (test-app/server/index.js never mounts a contact router), and never checks the fetch response's ok/status before showing the success banner.

### P-02 — Search box does nothing
- **Page(s):** catalog.html
- **What it is:** The catalog search input is visible and looks functional but typing in it and pressing Enter has no effect on the displayed results whatsoever.
- **Technical detail:** public/js/catalog.js never attaches any event listener to #searchInput.

### P-03 — "Download catalog (PDF)" does nothing
- **Page(s):** catalog.html
- **What it is:** The Download catalog (PDF) control is present and styled like a working action but clicking it produces no download and no visible effect.
- **Technical detail:** #downloadCatalogBtn is an <a href="#"> with no download attribute, no real href, and no click handler wired in catalog.js.

## Statutes/Standards (4)

### S-01 — Form inputs have no accessible labels
- **Page(s):** new-item.html
- **What it is:** Every field on the Add Widget form relies on placeholder text alone; there are no associated <label> elements, so screen reader users get no persistent field name (placeholder text disappears once the user starts typing, and is announced inconsistently across screen readers).
- **Technical detail:** new-item.html's form fields have no <label> elements at all. Note: this does NOT reliably trigger axe-core's automated 'label' rule, because accessible-name computation credits the placeholder attribute as a fallback name — a well-known real-world gap between automated accessibility scanning and genuine usability. Catching this requires human/AI judgement, not just a passing automated scan; it's a deliberately-included test of the hybrid architecture.

### S-02 — Helper text fails WCAG AA contrast
- **Page(s):** contact.html
- **What it is:** The small helper text under the Message field ('Please include your order number...') is light grey on white, well below the WCAG AA contrast minimum for its size.
- **Technical detail:** contact.html's .helper-text uses color: #B5B5B5 on a white background — roughly 2.3:1 contrast, below the 4.5:1 AA threshold for normal text.

### S-03 — Product images have empty alt text
- **Page(s):** catalog.html
- **What it is:** Every product thumbnail in the catalog grid has empty alt text, so screen reader users get no information about which product each image represents.
- **Technical detail:** public/js/catalog.js renders <img src="..." alt=""> for every product card.

### S-04 — Sort control is not keyboard operable
- **Page(s):** catalog.html
- **What it is:** The sort dropdown is a custom-built control that only responds to mouse clicks — it cannot be opened, navigated, or selected using only a keyboard, and has no ARIA role communicating that it's a menu.
- **Technical detail:** catalog.html's #sortDropdown/#sortMenu are plain <div> elements with click-only handlers in catalog.js — no role, tabindex, or keydown handling.

## CRUD — Create (2)

### CRUD-01 — Negative price is accepted
- **Page(s):** new-item.html
- **What it is:** Entering a negative number (e.g. -50) as the price passes both client and server validation and is accepted as if valid.
- **Technical detail:** Neither public/js/new-item.js's client check nor the POST /api/widgets handler in test-app/server/routes/widgets.js validates that price is non-negative — only that it's a parseable number and name is non-empty.

### CRUD-02 — Create reports success but silently never persists
- **Page(s):** new-item.html
- **What it is:** Submitting the Add Widget form redirects to the catalog as if it succeeded (the API even returns {success:true, id:...}), but the new widget never actually appears anywhere — it was never really saved.
- **Technical detail:** test-app/server/lib/store.js's createWidget() copies db.widgets into a new array (const widgets = [...db.widgets]) and pushes the new widget onto that copy, then calls writeDb(db) — writing the original, unmodified db object instead of the copy that was actually pushed to.

## CRUD — Read (1)

### CRUD-03 — One specific item's detail page always 500s
- **Page(s):** item.html
- **What it is:** Viewing the detail page for the 'Stainless Turnbuckle' widget always fails with a server error and renders a blank/broken page with no explanation.
- **Technical detail:** Seed item w-005 has notes: null. GET /api/widgets/:id in test-app/server/routes/widgets.js unconditionally calls widget.notes.trim(), throwing for this record; the response is Express's default (non-JSON) error page, which public/js/item.js's fetch-then-render code doesn't guard against, so it throws again client-side trying to read fields off a null data object.

## CRUD — Update (2)

### CRUD-04 — Editing one item can silently modify a different item
- **Page(s):** edit-item.html
- **What it is:** Saving changes on an item's edit page can actually overwrite a completely different, unrelated widget's data, depending on where the edited item falls alphabetically vs. its position in the underlying data.
- **Technical detail:** test-app/server/lib/store.js's updateWidget() finds the record's index in an alphabetically name-sorted copy of the array (byName.findIndex), then applies that index directly to the original, differently-ordered db.widgets array (db.widgets[idx] = updated) — a classic index-computed-against-one-ordering-applied-to-another bug.

### CRUD-05 — Save button doesn't guard against rapid double-submit
- **Page(s):** edit-item.html
- **What it is:** The Save button stays clickable while a save is in flight, so a rapid double-click (or slow network + impatient click) can fire two overlapping update requests for the same record.
- **Technical detail:** public/js/edit-item.js's saveItem() never sets saveBtn.disabled = true while its fetch is pending.

## CRUD — Delete (2)

### CRUD-06 — Delete confirmation claims a 30-day recovery window that doesn't exist
- **Page(s):** edit-item.html
- **What it is:** The delete confirmation says 'This item will be archived and can be restored within 30 days,' but the deletion is actually immediate and permanent, with no archive and no recovery mechanism anywhere in the app.
- **Technical detail:** test-app/server/lib/store.js's deleteWidget() does a real db.widgets.splice(idx, 1) — a hard delete — while edit-item.html's danger-zone copy and confirm() dialog both promise archival/recovery.

### CRUD-07 — Deleted items linger in the catalog view until a hard refresh
- **Page(s):** catalog.html
- **What it is:** After deleting an item, navigating back to the catalog can still show the deleted item as if it were still available, until the browser session storage is cleared or a fresh tab is opened.
- **Technical detail:** public/js/catalog.js caches the widget list in sessionStorage on first load and reuses that cache on every subsequent visit within the same session; nothing on the create/edit/delete pages ever invalidates that cached key.

## CRUD — Read (list/pagination) (1)

### CRUD-08 — Pagination's Next button does nothing
- **Page(s):** catalog.html
- **What it is:** The catalog correctly reports 'Page 1 of 3', but clicking Next never advances the page — roughly two-thirds of the inventory is effectively unreachable through the UI.
- **Technical detail:** public/js/catalog.js attaches a click handler to #prevPageBtn but never attaches one to #nextPageBtn.

## Claims (cross-page) (1)

### CL-01 — Contradictory customer-count claims
- **Page(s):** index.html vs about.html
- **What it is:** The Home page hero claims WidgetWorks is 'Trusted by over 10,000 happy customers' (repeated in the stats section as '10k+ Customers served'), while the About page says 'Proudly serving our first 500 customers since 2018' — the same company making two incompatible scale claims about itself.
- **Technical detail:** Static copy in index.html's hero/stats sections versus static copy in about.html's story paragraph — only detectable by reading both pages.

## Claims (2)

### CL-02 — Unsubstantiated 'carbon-neutral shipping' claim
- **Page(s):** about.html
- **What it is:** The About page badges 'Carbon-neutral shipping on every order,' but the product has no shipping/checkout flow anywhere, and nothing else in the app explains, evidences, or delivers on this claim.
- **Technical detail:** Static badge copy in about.html with no corresponding feature, page, or explanation anywhere else in the app.

### CL-03 — Unfulfillable support-response claim
- **Page(s):** contact.html
- **What it is:** The Contact page promises 'Support response within 1 hour, 24/7,' but the only contact mechanism on the page is the message form, which (per P-01) never actually delivers messages anywhere — there is no way for the claimed 1-hour response to ever happen.
- **Technical detail:** Static claim in contact.html combined with the broken form submission described in P-01.

