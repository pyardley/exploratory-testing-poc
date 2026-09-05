# Exploratory Tester Effectiveness — Comparison Report

**Target run:** measured-run-4  
**Base URL:** http://localhost:4173  
**Generated:** 2026-09-04T17:06:47.137Z

## Scorecard

| Metric | Count | % of 41 faults |
|---|---|---|
| Found | 28 | 68% |
| Partially found | 2 | 5% |
| Missed | 11 | 27% |

Recall (found + 0.5×partial): **71%**

False positives (findings with no matching seeded fault): **4**  
Bonus findings (real defects not in the seeded catalog): **11**

## By Heuristic Category

| Category | Found | Partial | Missed | Total |
|---|---|---|---|---|
| Familiarity | 2 | 0 | 1 | 3 |
| Explainability | 2 | 0 | 1 | 3 |
| World | 2 | 1 | 0 | 3 |
| History | 2 | 0 | 2 | 4 |
| Image | 2 | 0 | 2 | 4 |
| Comparable Products (internal consistency) | 3 | 0 | 0 | 3 |
| User Expectations | 3 | 0 | 0 | 3 |
| Purpose | 2 | 0 | 1 | 3 |
| Statutes/Standards | 3 | 0 | 1 | 4 |
| CRUD — Create | 1 | 0 | 1 | 2 |
| CRUD — Read | 0 | 0 | 1 | 1 |
| CRUD — Update | 2 | 0 | 0 | 2 |
| CRUD — Delete | 2 | 0 | 0 | 2 |
| CRUD — Read (list/pagination) | 1 | 0 | 0 | 1 |
| Claims (cross-page) | 0 | 0 | 1 | 1 |
| Claims | 1 | 1 | 0 | 2 |

## Fault-by-Fault Detail

### ✅ F-01 — Header logo is not a link home (Familiarity)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Header logo is not wrapped in a link, unlike the golden reference page (account.html)
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Both the deterministic visual-consistency scan and the AI review flagged the bare <img> without an <a> wrapper on account.html.

### ✅ F-02 — Primary submit button styled as secondary (Familiarity)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** The 'Send message' submit button uses the class `btn btn-secondary` rather than the primary button style
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI explicitly identified the btn-secondary class being used on the contact page's primary action.

### ❌ F-03 — Product cards have no hover feedback (Familiarity)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding mentions the catalog product cards lacking hover feedback/elevation relative to home feature cards.

### ✅ E-01 — All validation failures show one generic message (Explainability)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Form validation returns the identical message for empty submit and non-numeric price — 'Something went wrong. Please check the form and try again.'
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic form-validation probe and AI review both flagged the same generic error message.

### ✅ E-02 — Raw JavaScript error exposed to the user (Explainability)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Error 'Cannot read properties of null (reading \'field\')' shown to user
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review explicitly identified the raw JavaScript exception exposed in the account form banner.

### ❌ E-03 — Save gives no success or failure feedback (Explainability)
- **Page(s):** edit-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding notes that a successful save on edit-item shows no success/failure banner. Findings around edit-item focus on empty-submit and Cancel behaviour, not silent-success. Only an open question hints at this for account, not edit-item.

### ✅ W-01 — Prices rendered with 3 decimal places (World)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** All prices are formatted with three decimal places ($14.200, $42.000, $6.200) — appears on both Catalog and Item Detail
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review captured the toFixed(3) formatting across catalog and item pages; also called out in cross-page synthesis.

### 🟡 W-02 — Inconsistent date formats across the app (World)
- **Page(s):** item.html vs about.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** The badge reads 'Since 2018-06-01' — an ISO 8601 date exposed verbatim in a customer-facing pill
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"PARTIALLY_FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"PARTIALLY_FOUND":1}. AI flagged the About ISO date as odd but never compared it to item.html's DD/MM/YYYY 'Added on' format — the cross-page inconsistency itself was not captured.

### ✅ W-03 — Weight field labeled in kg with a pounds example (World)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Weight field placeholder reads 'e.g. 12 lbs' but the field hint immediately below it reads 'Weight (kg)'
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review captured the kg/lbs contradiction on new-item.html, both per-page and cross-page.

### ✅ H-01 — Copyright year hardcoded to 2019 everywhere except Home (History)
- **Page(s):** catalog.html, item.html, new-item.html, edit-item.html, account.html, contact.html, about.html
- **Verdict:** FOUND
- **Matching finding:** Home footer reads '© 2026 WidgetWorks' (correct); every other page reads '© 2019'
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI cross-page finding correctly identified the selective staleness of the 2019 copyright on every page except Home.

### ✅ H-02 — Founding-date arithmetic doesn't add up (History)
- **Page(s):** about.html
- **Verdict:** FOUND
- **Matching finding:** 'Founded in 2018, WidgetWorks has been serving customers for over 15 years' — company is ~8 years old
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review caught the arithmetic contradiction in the About story paragraph.

### ❌ H-03 — 'Last updated' timestamp never advances (History)
- **Page(s):** account.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Only mentioned as an open question ('Does the Last updated timestamp actually refresh...') — no finding asserts that the timestamp fails to advance after save.

### ❌ H-04 — Golden reference page's own brand color silently drifted from a prior release (History)
- **Page(s):** index.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. This fault requires git-history diffing which the tool does not do. The tester's golden reference used the (regressed) current Home page, so index.html was treated as correct and all other pages were reported as drifting instead — exactly the perverse inversion the seeded fault documents.

### ❌ I-01 — Logo rendered at a distorted aspect ratio (Image)
- **Page(s):** about.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester noted the About page has a duplicate logo in the body but did not observe the logo's distorted aspect ratio (200x120 vs native 4:1).

### ❌ I-02 — Product thumbnails squashed instead of cropped (Image)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding mentions catalog thumbnails being squashed/distorted vs item.html's cover-cropped image.

### ✅ I-03 — One product image is broken (real 404) (Image)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** Cable Tension Meter's image src '/img/widgets-missing/w-024.svg' — broken image icon, badResponseCount: 3
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic broken-asset check flagged the 404s and AI identified the specific product.

### ✅ I-04 — Missing favicon (Image)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** This page has no favicon link, unlike the golden reference page (contact.html)
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Both deterministic visual-consistency and AI flagged the missing favicon on contact.html.

### ✅ C-01 — Primary CTA color drifts from brand blue (Comparable Products (internal consistency))
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** The Save widget button background is hard-coded via an inline <style> block to #2D6FC0, overriding the global brand token
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic visual-diff flagged the color drift and AI explicitly identified the isolated per-page inline override on new-item, matching the fault's technical detail.

### ✅ C-02 — Missing web font import — silently falls back to a system font (Comparable Products (internal consistency))
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** The page <head> has no Google Fonts link for Inter — text renders in fallback system font
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic webfont-not-imported check and AI both flagged the missing Inter import on account.html.

### ✅ C-03 — Submit button has square corners (Comparable Products (internal consistency))
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** inline override `border-radius: 0` that squares its corners
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review captured the border-radius: 0 override on the contact submit button vs. the shared 6px radius.

### ✅ U-01 — Cancel button actually saves (User Expectations)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** The Cancel button (type="button", id="cancelBtn") triggers a network request when clicked
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic cancelButtonProbes detected the network request and AI reasoned this was defect (also cross-page comparison with new-item's <a href> Cancel).

### ✅ U-02 — Notification checkbox is inverted on save (User Expectations)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Checkbox 'notifications' was set to false and the form saved, but after a fresh page load it reads back as true
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic checkboxRoundTrip probe found the inverted persistence and AI elaborated. Matches the seeded '!checkbox.checked' inversion bug precisely.

### ✅ U-03 — "Price: Low to High" sorts High to Low (User Expectations)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** 'Price: Low to High' yields items in descending price order: [42, 34.99, 29.99, ...]
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic directionalControls probe and AI both flagged the inverted sort direction.

### ✅ P-01 — Contact form never actually delivers (Purpose)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Contact form fires a network request when submitted empty, server returns a bad response, no error indicator shown
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic scan detected the 4xx/5xx response and AI reasoned about the silent failure. The failure of the contact endpoint (which is the P-01 root cause) was captured, even if not tied specifically to 'endpoint does not exist'.

### ✅ P-02 — Search box does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Typing a query into search input 'searchInput' and pressing Enter produced no change
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Both deterministic search probe and AI captured the non-functional search box.

### ❌ P-03 — "Download catalog (PDF)" does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Only mentioned as an open question ('Does the Download catalog (PDF) button work?') — not asserted as a defect finding.

### ✅ S-01 — Form inputs have no accessible labels (Statutes/Standards)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** None of the five form fields have an associated <label> element. Each field relies solely on placeholder text
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. As the fault catalog predicted, axe-core did not flag this due to placeholder-as-accessible-name, but the AI review caught it — a good demo of the hybrid architecture.

### ✅ S-02 — Helper text fails WCAG AA contrast (Statutes/Standards)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Helper text renders in #b5b5b5 on #ffffff — contrast ratio 2.05:1, below WCAG 2 AA minimum
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic axe reported the color-contrast violation and AI elaborated with the specific hex values and ratio.

### ✅ S-03 — Product images have empty alt text (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** All product images have empty alt attributes (alt="") — informative in a catalog context
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Axe did not flag empty alt (technically valid for decorative images) but the AI review made the contextual judgement that catalog thumbnails are informative.

### ❌ S-04 — Sort control is not keyboard operable (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding notes that the sort dropdown is keyboard-inaccessible or lacks ARIA roles.

### ❌ CRUD-01 — Negative price is accepted (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Only appears as an open question about server-side validation of negative prices. No finding demonstrates or asserts that negative price is accepted.

### ✅ CRUD-02 — Create reports success but silently never persists (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward
- **Detected via:** deterministic
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. CRUD smoke flow's read-after-create step detected foundOnListPage: false and reported the silent-non-persist.

### ❌ CRUD-03 — One specific item's detail page always 500s (CRUD — Read)
- **Page(s):** item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. The specific w-005 Stainless Turnbuckle 500 error was not exercised — the CRUD smoke flow tested w-001, w-009, w-021 but not w-005.

### ✅ CRUD-04 — Editing one item can silently modify a different item (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** Editing this record changed a DIFFERENT record instead/as well — index-vs-id mismatch
- **Detected via:** deterministic
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. CRUD smoke flow's update probes explicitly detected the cross-record contamination for w-009 and w-021, exactly matching the seeded alphabetical-index bug.

### ✅ CRUD-05 — Save button doesn't guard against rapid double-submit (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** The Save button is not disabled while a save is in flight — two rapid clicks fired 2 separate mutating requests
- **Detected via:** deterministic
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. CRUD smoke flow's update-double-submit-race probe captured saveButtonDisabledAfterFirstClick: false and 2 mutating requests.

### ✅ CRUD-06 — Delete confirmation claims a 30-day recovery window that doesn't exist (CRUD — Delete)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** 'This item will be archived and can be restored within 30 days' — worth checking this claim against what deletion actually does
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic scan captured the confirm-dialog text and AI cross-page finding confirmed no restore UI exists anywhere in the product.

### ✅ CRUD-07 — Deleted items linger in the catalog view until a hard refresh (CRUD — Delete)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** After deleting a record, it still appears on the list page within the same browser session until a hard refresh — stale cached data
- **Detected via:** deterministic
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. CRUD smoke flow captured stillVisibleInSameSessionAfterDelete: true and stillVisibleInFreshSessionAfterDelete: false — a textbook match for the sessionStorage-cache-not-invalidated fault.

### ✅ CRUD-08 — Pagination's Next button does nothing (CRUD — Read (list/pagination))
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Clicking 'Next' on 'Page 1 of 3' produces no content change and no status change
- **Detected via:** both
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Deterministic pagination probe and AI both flagged the inert Next button.

### ❌ CL-01 — Contradictory customer-count claims (Claims (cross-page))
- **Page(s):** index.html vs about.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. The tester noted internal inconsistency between the Home hero '10,000 happy customers' and stats '10k+ Customers served', but never compared to About's 'Proudly serving our first 500 customers' — the specific cross-page contradiction was not captured.

### ✅ CL-02 — Unsubstantiated 'carbon-neutral shipping' claim (Claims)
- **Page(s):** about.html
- **Verdict:** FOUND
- **Matching finding:** 'Carbon-neutral shipping on every order' — substantive environmental claim, cannot confirm or deny
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. AI review flagged the unsubstantiated carbon-neutral shipping badge as a greenwashing/regulatory risk.

### 🟡 CL-03 — Unfulfillable support-response claim (Claims)
- **Page(s):** contact.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** 'Support response within 1 hour, 24/7' — unusually strong SLA... misleading to prospective customers
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"PARTIALLY_FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"PARTIALLY_FOUND":1}. AI flagged the 1hr/24/7 claim as suspicious but never explicitly connected it to the broken contact form (P-01) — the specific 'unfulfillable because the form doesn't deliver' angle was not captured.

## False Positives

- **index.html:** Three 'Why builders choose WidgetWorks' feature cards are text-only — no icons/illustrations
  - Stylistic critique, not a defect. Text-only feature cards are a valid design choice.
- **item.html?id=w-009:** No product photograph — image slot shows a brown placeholder tile with initials 'AS'
  - The tester's own open question notes this could be intentional fallback UI. Not a demonstrable defect and not seeded.
- **new-item.html:** New-item form has no image or photo upload field
  - The tester's own open question acknowledges this may simply not be implemented yet. Not a defect against a documented requirement and not seeded.
- **edit-item.html:** No delete confirmation dialog structure present in the DOM snapshot — single click may immediately trigger delete
  - Incorrect finding: the deterministic scan actually captured the confirm dialog text ('This item will be archived and can be restored within 30 days. Continue?') showing a window.confirm() does fire. The AI made a false-negative claim based on absence of a modal in static DOM.

## Bonus Findings (real, not in the seeded catalog)

- **index.html:** The stats block ('1,200+ Parts in catalog', '6 Categories', '10k+ Customers served') is hardcoded in the HTML template — contradicts 'Always current' promise
  - Legitimate observation about a self-contradicting page: static stats claim vs. 'Always current' promise. Not one of the seeded 41 faults but a genuine editorial/design defect.
- **index.html:** Hero lede reads 'Trusted by over 10,000 happy customers'; stats section reads '10k+ Customers served' — inconsistent formats on same page
  - Real minor editorial inconsistency but not in the seeded catalog (CL-01 is about Home-vs-About, not Home-vs-itself).
- **about.html:** The WidgetWorks logo appears twice on About: once in nav, once above 'Our story'
  - A genuine consistency observation about template duplication, but not in the seeded catalog.
- **new-item.html:** Navigation marks 'Catalog' as active while on new-item.html
  - Plausible small nav-highlight issue, could be intentional (create as sub-flow of Catalog) — the tester flagged the ambiguity. Not seeded.
- **item.html:** Browser tab title is 'Item — WidgetWorks' (generic) rather than product-specific
  - Real usability/SEO defect (generic <title>) but not in the seeded catalog.
- **account.html:** Name and Email inputs have no 'name' attribute (suppresses browser autofill)
  - Real minor form-behaviour issue but not seeded.
- **edit-item.html:** Price and Weight fields use type=text rather than type=number (edit-item)
  - Real minor client-side validation gap, but not in the seeded catalog.
- **edit-item.html:** Price is pre-populated as '14.2' rather than '14.20' on the edit form
  - Real formatting inconsistency between edit form and display, related to but not exactly W-01 (which is about the toFixed(3) padding on display, not the raw-float in edit form).
- **edit-item.html:** Heading hierarchy jumps from h1 'Edit widget' directly to h3 'Remove this widget'
  - Real minor accessibility issue (skipped heading level) but not in the seeded catalog.
- **new-item.html:** Price field is declared as type='text', not type='number' (new-item)
  - Real minor client-side validation issue, distinct from the seeded CRUD-01 (which is about accepting negative values, not input type).
- **contact.html + index.html + catalog.html:** Contact FAQ claim 'The catalog page reflects current stock in real time' is false because Home stats are hardcoded and Catalog pagination is broken
  - Legitimate cross-page claim analysis, but the specific 'real time stock' contradiction isn't one of the seeded faults (P-01/P-02/CRUD-08 are the constituent defects, this is a synthesis observation).

## Deterministic-vs-AI Attribution

Of the 30 faults caught (found or partially found), the session notes' per-finding source tags attribute:

| Detected via | Count |
|---|---|
| Deterministic scan alone | 4 |
| AI review alone | 12 |
| Both | 14 |
| Unclear/not reported | 0 |

This is the concrete evidence for whether the hybrid architecture (deterministic-first, AI for judgement calls) is pulling its weight, or whether one layer is doing essentially all the work.

## Methodology / Caveats

- Adjudication was performed by a single LLM call and carries real run-to-run variance — treat this scorecard as illustrative for one session, not as a precise, reproducible metric. Consider majority-vote over multiple adjudication runs before treating any specific percentage as authoritative.
- This is a single exploratory session against a fixed evidence snapshot, not exhaustive regression coverage.
- "False positive" here means a finding with no corresponding seeded fault; some may be genuine defects that simply weren't deliberately seeded (see Bonus Findings).
