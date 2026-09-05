# Exploratory Tester Effectiveness — Comparison Report

**Target run:** measured-run-3  
**Base URL:** http://localhost:4173  
**Generated:** 2026-09-04T15:13:37.622Z

## Scorecard

| Metric | Count | % of 40 faults |
|---|---|---|
| Found | 20 | 50% |
| Partially found | 7 | 18% |
| Missed | 13 | 33% |

Recall (found + 0.5×partial): **59%**

False positives (findings with no matching seeded fault): **8**  
Bonus findings (real defects not in the seeded catalog): **9**

## By Heuristic Category

| Category | Found | Partial | Missed | Total |
|---|---|---|---|---|
| Familiarity | 2 | 0 | 1 | 3 |
| Explainability | 0 | 2 | 1 | 3 |
| World | 2 | 1 | 0 | 3 |
| History | 2 | 0 | 1 | 3 |
| Image | 4 | 0 | 0 | 4 |
| Comparable Products (internal consistency) | 2 | 0 | 1 | 3 |
| User Expectations | 1 | 0 | 2 | 3 |
| Purpose | 1 | 1 | 1 | 3 |
| Statutes/Standards | 3 | 0 | 1 | 4 |
| CRUD — Create | 0 | 2 | 0 | 2 |
| CRUD — Read | 0 | 0 | 1 | 1 |
| CRUD — Update | 0 | 0 | 2 | 2 |
| CRUD — Delete | 1 | 0 | 1 | 2 |
| CRUD — Read (list/pagination) | 0 | 0 | 1 | 1 |
| Claims (cross-page) | 1 | 0 | 0 | 1 |
| Claims | 1 | 1 | 0 | 2 |

## Fault-by-Fault Detail

### ✅ F-01 — Header logo is not a link home (Familiarity)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Header logo is a bare <img> with no <a> wrapper on account.html
- **Detected via:** both
- **Reasoning:** Explicitly identified by both deterministic scanner (visual-deviation: logo-not-linked) and AI review.

### ✅ F-02 — Primary submit button styled as secondary (Familiarity)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** 'Send message' button uses btn-secondary class instead of primary style
- **Detected via:** ai
- **Reasoning:** AI review correctly identified the secondary class on the primary CTA on contact.html.

### ❌ F-03 — Product cards have no hover feedback (Familiarity)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** No finding mentions catalog product cards lacking hover feedback vs Home feature cards which do have hover.

### ❌ E-01 — All validation failures show one generic message (Explainability)
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Reasoning:** Tester noted new-item form correctly blocks empty submission but did not probe specific validation error messages to catch the generic-message issue.

### 🟡 E-02 — Raw JavaScript error exposed to the user (Explainability)
- **Page(s):** account.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** 1 console error and 1 bad HTTP response on account with opaque origin
- **Detected via:** both
- **Reasoning:** Deterministic scanner counted console errors and AI noted background failure with no on-screen indication, but neither identified the raw TypeError banner shown to the user on empty Name save.

### 🟡 E-03 — Save gives no success or failure feedback (Explainability)
- **Page(s):** edit-item.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** Empty or partial data may be silently written to the server with no feedback to Dana
- **Detected via:** ai
- **Reasoning:** AI identified the no-feedback pattern on empty submit but didn't specifically call out that even successful saves lack any success confirmation.

### ✅ W-01 — Prices rendered with 3 decimal places (World)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** Every price on the page is formatted with three decimal places (catalog and item detail)
- **Detected via:** ai
- **Reasoning:** AI clearly identified the three-decimal formatting on both catalog and item detail pages.

### 🟡 W-02 — Inconsistent date formats across the app (World)
- **Page(s):** item.html vs about.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** ISO date '2018-06-01' displayed raw in About 'Since' badge
- **Detected via:** ai
- **Reasoning:** AI flagged the raw ISO date on About and noted item added on 09/12/2025 elsewhere, but didn't explicitly connect the two as inconsistent date-format conventions across the app.

### ✅ W-03 — Weight field labeled in kg with a pounds example (World)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Placeholder says 'e.g. 12 lbs' but hint label reads 'Weight (kg)'
- **Detected via:** ai
- **Reasoning:** AI clearly identified the unit mismatch.

### ✅ H-01 — Copyright year hardcoded to 2019 everywhere except Home (History)
- **Page(s):** catalog.html, item.html, new-item.html, edit-item.html, account.html, contact.html, about.html
- **Verdict:** FOUND
- **Matching finding:** Copyright hardcoded as © 2019 on every page except Home
- **Detected via:** ai
- **Reasoning:** AI cross-page finding explicitly names all seven affected pages.

### ✅ H-02 — Founding-date arithmetic doesn't add up (History)
- **Page(s):** about.html
- **Verdict:** FOUND
- **Matching finding:** 'Founded in 2018, serving customers for over 15 years' — should be ~8 years
- **Detected via:** ai
- **Reasoning:** AI clearly identified the arithmetic error.

### ❌ H-03 — 'Last updated' timestamp never advances (History)
- **Page(s):** account.html
- **Verdict:** MISSED
- **Reasoning:** Only surfaced as an open question ('Does saving actually update the Last updated timestamp?'), not confirmed as a finding.

### ✅ I-01 — Logo rendered at a distorted aspect ratio (Image)
- **Page(s):** about.html
- **Verdict:** FOUND
- **Matching finding:** About logo sized 200×120 (~1.67:1) vs canonical 160×40 (4:1)
- **Detected via:** ai
- **Reasoning:** AI identified the exact aspect-ratio mismatch and the specific dimensions from the fault detail.

### ✅ I-02 — Product thumbnails squashed instead of cropped (Image)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Inline CSS on product card images uses object-fit: fill rather than cover/contain
- **Detected via:** ai
- **Reasoning:** AI identified the exact CSS override that causes the squashing.

### ✅ I-03 — One product image is broken (real 404) (Image)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** Cable Tension Meter image src is /img/widgets-missing/w-024.svg — broken
- **Detected via:** ai
- **Reasoning:** AI identified the exact broken path and confirmed via screenshot and bad response count.

### ✅ I-04 — Missing favicon (Image)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Contact page has no favicon link element, unlike golden reference
- **Detected via:** both
- **Reasoning:** Both deterministic (visual-deviation: missing-favicon) and AI review flagged this.

### ❌ C-01 — Primary CTA color drifts from brand blue (Comparable Products (internal consistency))
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Reasoning:** No finding mentions the saveBtn color drift (#2D6FC0 vs #2C6FBB) on new-item.html.

### ✅ C-02 — Missing web font import — silently falls back to a system font (Comparable Products (internal consistency))
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** No Google Fonts <link> for Inter in Account page head; falls back to system font
- **Detected via:** both
- **Reasoning:** Deterministic visual-deviation and AI review both identified this.

### ✅ C-03 — Submit button has square corners (Comparable Products (internal consistency))
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Contact submit button has border-radius: 0 override
- **Detected via:** ai
- **Reasoning:** AI identified the exact inline style override.

### ✅ U-01 — Cancel button actually saves (User Expectations)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** Cancel button triggers a network request — likely wired to save handler
- **Detected via:** both
- **Reasoning:** Deterministic form-validation probe caught cancelButtonProbes triggeredNetworkRequest=true and AI review escalated it as CRITICAL.

### ❌ U-02 — Notification checkbox is inverted on save (User Expectations)
- **Page(s):** account.html
- **Verdict:** MISSED
- **Reasoning:** Only surfaced as an open question about the notifications checkbox; no test of the inverted-boolean behavior.

### ❌ U-03 — "Price: Low to High" sorts High to Low (User Expectations)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** No finding tests the sort control's ordering behavior.

### 🟡 P-01 — Contact form never actually delivers (Purpose)
- **Page(s):** contact.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** Contact form fires network request, server returns bad response, no error indicator shown
- **Detected via:** ai
- **Reasoning:** Tester identified silent failure on empty submit but didn't establish that ALL submissions (including valid ones) fail because the endpoint doesn't exist server-side, nor did they catch the always-success 'Message sent!' behavior.

### ❌ P-02 — Search box does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** Tester noted search input has no label but never tested that typing does nothing to filter results.

### ✅ P-03 — "Download catalog (PDF)" does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** 'Download catalog (PDF)' href='#' with no JS handler; delivers nothing
- **Detected via:** ai
- **Reasoning:** AI clearly identified the dead-link behavior.

### ✅ S-01 — Form inputs have no accessible labels (Statutes/Standards)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** No form field on new-item has a properly associated <label>; scanner missed it
- **Detected via:** ai
- **Reasoning:** AI review caught this exactly as the fault-catalog note predicted — an explicit scanner-miss that required human/AI judgement.

### ✅ S-02 — Helper text fails WCAG AA contrast (Statutes/Standards)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** helper-text #B5B5B5 on white yields 2.05:1 vs required 4.5:1 (axe: serious)
- **Detected via:** both
- **Reasoning:** Both axe scan and AI review identified this.

### ✅ S-03 — Product images have empty alt text (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** All eight catalog product images have alt='' (empty)
- **Detected via:** ai
- **Reasoning:** AI identified all product thumbnails have empty alt text.

### ❌ S-04 — Sort control is not keyboard operable (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** No finding examines the sort dropdown's keyboard operability or missing ARIA role.

### 🟡 CRUD-01 — Negative price is accepted (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** Price field is type='text', not type='number' — negative values not blocked at browser level
- **Detected via:** ai
- **Reasoning:** AI identified the underlying missing browser-level validation as an open risk but didn't actually submit a negative price to confirm it is accepted end-to-end.

### 🟡 CRUD-02 — Create reports success but silently never persists (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** CRUD smoke flow read-after-create: foundOnListPage: false
- **Detected via:** deterministic
- **Reasoning:** The deterministic CRUD flow captured the create-not-persisting behavior in raw data (foundOnListPage=false) but neither AI nor the narrative called this out as a finding.

### ❌ CRUD-03 — One specific item's detail page always 500s (CRUD — Read)
- **Page(s):** item.html
- **Verdict:** MISSED
- **Reasoning:** No item other than w-009 was inspected on the item detail page, so the Stainless Turnbuckle (w-005) 500 was never triggered.

### ❌ CRUD-04 — Editing one item can silently modify a different item (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** MISSED
- **Reasoning:** No finding tests the index-mismatch bug between name-sorted lookup and original array.

### ❌ CRUD-05 — Save button doesn't guard against rapid double-submit (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** MISSED
- **Reasoning:** No finding tests double-submit or notes that saveBtn is not disabled while in flight.

### ✅ CRUD-06 — Delete confirmation claims a 30-day recovery window that doesn't exist (CRUD — Delete)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** Danger-zone claims 'archived, restorable within 30 days' but no restore UI exists anywhere
- **Detected via:** ai
- **Reasoning:** AI identified this both as a per-page and cross-page finding.

### ❌ CRUD-07 — Deleted items linger in the catalog view until a hard refresh (CRUD — Delete)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** CRUD smoke flow reported stillVisibleInSameSessionAfterDelete: false, so the sessionStorage caching bug either did not fire in this run or the test didn't exercise the specific path. Not identified as a finding.

### ❌ CRUD-08 — Pagination's Next button does nothing (CRUD — Read (list/pagination))
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Reasoning:** Tester noted Previous button is active on page 1 but never tested that Next button also doesn't advance the page.

### ✅ CL-01 — Contradictory customer-count claims (Claims (cross-page))
- **Page(s):** index.html vs about.html
- **Verdict:** FOUND
- **Matching finding:** 10k+ customers on Home vs 'first 500 customers' on About — direct contradiction
- **Detected via:** ai
- **Reasoning:** AI cross-page synthesis explicitly identified this.

### 🟡 CL-02 — Unsubstantiated 'carbon-neutral shipping' claim (Claims)
- **Page(s):** about.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** Open question: 'Is Carbon-neutral shipping on every order an independently verified claim?'
- **Detected via:** ai
- **Reasoning:** Surfaced only as an open question flagging the greenwashing risk, not as a formal finding tied to the absent shipping/checkout flow.

### ✅ CL-03 — Unfulfillable support-response claim (Claims)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** 'Support response within 1 hour, 24/7' compounded with broken contact form
- **Detected via:** ai
- **Reasoning:** AI cross-page finding explicitly connected the SLA claim to the broken form's inability to deliver.

## False Positives

- **new-item.html:** Nav highlights 'Catalog' as active while on New Item page
  - Tester's own confidence is low; defensible design choice given New Item has no dedicated nav entry.
- **edit-item.html:** No confirmation dialog in DOM for Delete widget
  - CRUD smoke flow captured 'This item will be archived...Continue?' — a JS confirm() dialog does exist at runtime, so the static-DOM inference was wrong.
- **account.html:** Date '11/2/2025' auto-linkified/blue in Account 'Last updated' line
  - Likely a browser mobile-Safari-style phone-number/date auto-detect artifact, not a coded defect.
- **account.html:** No Cancel/Discard button on account form
  - Design choice rather than a defect; simple account settings pages commonly omit Cancel.
- **index.html:** 'Always current' Home card implies real-time inventory sync
  - Marketing copy interpretation, low-confidence per tester; not a concrete defect.
- **about.html:** 'Proudly serving our first 500 customers' reads as self-limiting
  - Copy-tone critique; the underlying '500 vs 10k' contradiction is captured by CL-01.
- **item.html:** Item detail product image is placeholder SVG rather than real photo
  - Seed-data behavior — the SVG loads successfully; no coded defect.
- **about.html:** About page 'Carbon-neutral shipping on every order' greenwashing risk
  - This IS CL-02, captured under partially_found rather than counted separately as a false positive.

## Bonus Findings (real, not in the seeded catalog)

- **index.html:** Feature cards on Home carry card-hover class but are purely decorative
  - Legitimate UX concern about affordance, but not in the seeded fault catalog.
- **catalog.html:** Previous pagination button active/enabled on page 1 of 3
  - Genuine minor UX defect but not seeded.
- **index.html vs catalog.html:** Home '1,200+ parts / 6 categories' hardcoded vs actual ~24 items
  - A prominent contradiction genuinely present in the app, adjacent to CL-01 in spirit but not one of the 40 seeded faults.
- **contact.html:** Contact form inputs have id but no name attribute
  - Real minor defect for graceful-degradation, not seeded.
- **account.html:** 'Email me order updates' checkbox implies order tracking that doesn't exist
  - A plausible copy/claim inconsistency not in the seeded catalog.
- **new-item.html, edit-item.html:** New Item and Edit Item forms have no image upload field
  - Real gap in CRUD surface, not in the seeded catalog.
- **item.html:** 'Edit this widget' is the primary CTA on Item Detail
  - Reasonable UX critique for browsing persona, not a seeded fault.
- **new-item.html, edit-item.html:** Price and Weight fields typed 'text' rather than 'number' on new-item and edit-item
  - Real input-typing issue that partially overlaps CRUD-01 but is a distinct observation; kept separate.
- **edit-item.html:** Edit Item Price pre-populated as '14.2' instead of '14.20'
  - Real display inconsistency (Number toString stripping trailing zero), not among the seeded 40.

## Deterministic-vs-AI Attribution

Of the 27 faults caught (found or partially found), the session notes' per-finding source tags attribute:

| Detected via | Count |
|---|---|
| Deterministic scan alone | 1 |
| AI review alone | 20 |
| Both | 6 |
| Unclear/not reported | 0 |

This is the concrete evidence for whether the hybrid architecture (deterministic-first, AI for judgement calls) is pulling its weight, or whether one layer is doing essentially all the work.

## Methodology / Caveats

- Adjudication was performed by a single LLM call and carries real run-to-run variance — treat this scorecard as illustrative for one session, not as a precise, reproducible metric. Consider majority-vote over multiple adjudication runs before treating any specific percentage as authoritative.
- This is a single exploratory session against a fixed evidence snapshot, not exhaustive regression coverage.
- "False positive" here means a finding with no corresponding seeded fault; some may be genuine defects that simply weren't deliberately seeded (see Bonus Findings).
