# Exploratory Tester Effectiveness — Comparison Report

**Target run:** agentic-run-1  
**Base URL:** http://localhost:4173  
**Generated:** 2026-09-05T11:23:07.070Z

## Scorecard

| Metric | Count | % of 41 faults |
|---|---|---|
| Found | 22 | 54% |
| Partially found | 3 | 7% |
| Missed | 16 | 39% |

Recall (found + 0.5×partial): **57%**

False positives (findings with no matching seeded fault): **2**  
Bonus findings (real defects not in the seeded catalog): **6**

## By Heuristic Category

| Category | Found | Partial | Missed | Total |
|---|---|---|---|---|
| Familiarity | 1 | 0 | 2 | 3 |
| Explainability | 2 | 0 | 1 | 3 |
| World | 2 | 1 | 0 | 3 |
| History | 3 | 1 | 0 | 4 |
| Image | 1 | 0 | 3 | 4 |
| Comparable Products (internal consistency) | 0 | 0 | 3 | 3 |
| User Expectations | 1 | 0 | 2 | 3 |
| Purpose | 3 | 0 | 0 | 3 |
| Statutes/Standards | 2 | 0 | 2 | 4 |
| CRUD — Create | 2 | 0 | 0 | 2 |
| CRUD — Read | 0 | 0 | 1 | 1 |
| CRUD — Update | 0 | 1 | 1 | 2 |
| CRUD — Delete | 2 | 0 | 0 | 2 |
| CRUD — Read (list/pagination) | 1 | 0 | 0 | 1 |
| Claims (cross-page) | 1 | 0 | 0 | 1 |
| Claims | 1 | 0 | 1 | 2 |

## Fault-by-Fault Detail

### ✅ F-01 — Header logo is not a link home (Familiarity)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Logo on the Account page is not a clickable link... Account page renders the logo as a bare img with no parent anchor.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Directly identified in account-and-contact task.

### ❌ F-02 — Primary submit button styled as secondary (Familiarity)
- **Page(s):** contact.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding mentions the contact submit button using secondary/grey styling.

### ❌ F-03 — Product cards have no hover feedback (Familiarity)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about missing hover feedback on catalog product cards.

### ❌ E-01 — All validation failures show one generic message (Explainability)
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester tested new-item form with negative price but did not test all validation branches (missing name, non-numeric price) to notice the generic banner behavior.

### ✅ E-02 — Raw JavaScript error exposed to the user (Explainability)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** Submitting the Account form with the Name field empty... displays a raw JavaScript implementation error: 'Error: Cannot read properties of null (reading field)'.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Exactly matches E-02.

### ✅ E-03 — Save gives no success or failure feedback (Explainability)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** No save confirmation or error feedback: after clicking 'Save changes'... no toast, banner, inline message, redirect, or any visual change.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Directly matches E-03 on edit-item page.

### ✅ W-01 — Prices rendered with 3 decimal places (World)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** All prices on the catalog cards are displayed with 3 decimal places... Same on item detail page.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Found on both catalog and item pages, matching W-01.

### 🟡 W-02 — Inconsistent date formats across the app (World)
- **Page(s):** item.html vs about.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** About page displays a badge reading 'Since 2018-06-01' — a raw ISO 8601 date string; also item detail 'Added on 09/12/2025'
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"PARTIALLY_FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"PARTIALLY_FOUND":1}. Tester observed both date formats separately (ISO on About, DD/MM on item) but framed the ISO one as UX issue and did not connect the inconsistency between the two.

### ✅ W-03 — Weight field labeled in kg with a pounds example (World)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Weight field label ('Weight (kg)') contradicts placeholder ('e.g. 12 lbs') — mixed units on the same field
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Exact match to W-03.

### ✅ H-01 — Copyright year hardcoded to 2019 everywhere except Home (History)
- **Page(s):** catalog.html, item.html, new-item.html, edit-item.html, account.html, contact.html, about.html
- **Verdict:** FOUND
- **Matching finding:** Footer copyright year reads '© 2019 WidgetWorks' on Catalog, Item detail, Edit item, Account, Contact, About pages, but '© 2026 WidgetWorks' on the Home page
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Repeatedly identified across many tasks, exactly matching H-01.

### ✅ H-02 — Founding-date arithmetic doesn't add up (History)
- **Page(s):** about.html
- **Verdict:** FOUND
- **Matching finding:** About page claims 'Founded in 2018... serving customers for over 15 years.' 2026 − 2018 = 8 years — not 15.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match.

### ✅ H-03 — 'Last updated' timestamp never advances (History)
- **Page(s):** account.html
- **Verdict:** FOUND
- **Matching finding:** 'Last updated' timestamp on the Account page shows 11/2/2025 and does not update after a successful save operation.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to H-03.

### 🟡 H-04 — Golden reference page's own brand color silently drifted from a prior release (History)
- **Page(s):** index.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** The CSS custom property --color-primary differs between the Home page (#3B6FA0) and the About page (#2C6FBB). Also found the same on catalog page.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"PARTIALLY_FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"PARTIALLY_FOUND":1}. Tester detected the color mismatch symptom but attributed it to About/Catalog pages being wrong, believing Home is canonical. In truth Home is the regressed page (H-04). Symptom found, cause direction wrong.

### ❌ I-01 — Logo rendered at a distorted aspect ratio (Image)
- **Page(s):** about.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about About page logo distortion.

### ❌ I-02 — Product thumbnails squashed instead of cropped (Image)
- **Page(s):** catalog.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about product thumbnails being squashed/stretched vs cropped.

### ✅ I-03 — One product image is broken (real 404) (Image)
- **Page(s):** catalog.html, item.html
- **Verdict:** FOUND
- **Matching finding:** Cable Tension Meter (w-024) image is broken — /img/widgets-missing/w-024.svg returns 404.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match.

### ❌ I-04 — Missing favicon (Image)
- **Page(s):** contact.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about missing favicon on contact page.

### ❌ C-01 — Primary CTA color drifts from brand blue (Comparable Products (internal consistency))
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about save-widget button using a slightly different blue than brand primary.

### ❌ C-02 — Missing web font import — silently falls back to a system font (Comparable Products (internal consistency))
- **Page(s):** account.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about missing Inter web-font import on account page.

### ❌ C-03 — Submit button has square corners (Comparable Products (internal consistency))
- **Page(s):** contact.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about contact submit button having square corners.

### ❌ U-01 — Cancel button actually saves (User Expectations)
- **Page(s):** edit-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester never clicked Cancel on the edit-item page.

### ❌ U-02 — Notification checkbox is inverted on save (User Expectations)
- **Page(s):** account.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester never tested toggling the notifications checkbox and verifying persisted state.

### ✅ U-03 — "Price: Low to High" sorts High to Low (User Expectations)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Sort option 'Price: Low to High' produces a descending order (highest price first).
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to U-03.

### ✅ P-01 — Contact form never actually delivers (Purpose)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Contact form /api/contact returns HTTP 404 on every submission... client always displays 'Message sent!' — false positive confirmation.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Exact match.

### ✅ P-02 — Search box does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Search box ('Search widgets…') does not filter catalog results.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match.

### ✅ P-03 — "Download catalog (PDF)" does nothing (Purpose)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** 'Download catalog (PDF)' is a dead link... href attribute is literally '#'.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match.

### ❌ S-01 — Form inputs have no accessible labels (Statutes/Standards)
- **Page(s):** new-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester checked labels on account and contact forms but did not audit new-item form labels.

### ❌ S-02 — Helper text fails WCAG AA contrast (Statutes/Standards)
- **Page(s):** contact.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about contact page helper-text contrast.

### ✅ S-03 — Product images have empty alt text (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** All 8 product card images have alt="" (empty alt text).
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to S-03.

### ✅ S-04 — Sort control is not keyboard operable (Statutes/Standards)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** Sort dropdown is built entirely from unsemantic div elements with no ARIA... cannot be operated by keyboard alone.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to S-04.

### ✅ CRUD-01 — Negative price is accepted (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** Negative price (-5.00) accepted by new-item form with no validation error
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to CRUD-01.

### ✅ CRUD-02 — Create reports success but silently never persists (CRUD — Create)
- **Page(s):** new-item.html
- **Verdict:** FOUND
- **Matching finding:** POST /api/widgets returned 200 OK... GET /api/widgets response body confirmed the widget is not present — 24 original seed widgets only.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Exact match: creates report success but never persist.

### ❌ CRUD-03 — One specific item's detail page always 500s (CRUD — Read)
- **Page(s):** item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester did not view the 'Stainless Turnbuckle' (w-005) detail page.

### 🟡 CRUD-04 — Editing one item can silently modify a different item (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** PARTIALLY_FOUND
- **Matching finding:** Saves silently fail: both PATCH requests returned HTTP 200 OK, but neither change was persisted... GET response confirmed unchanged data.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"PARTIALLY_FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"PARTIALLY_FOUND":1}. Tester noticed the symptom that PATCH doesn't update the intended item, but never checked other items to discover a different widget's data was actually overwritten. Symptom captured, root cause (wrong-index write to different item) not identified.

### ❌ CRUD-05 — Save button doesn't guard against rapid double-submit (CRUD — Update)
- **Page(s):** edit-item.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. No finding about double-submit protection on save button.

### ✅ CRUD-06 — Delete confirmation claims a 30-day recovery window that doesn't exist (CRUD — Delete)
- **Page(s):** edit-item.html
- **Verdict:** FOUND
- **Matching finding:** Deletion confirmation says 'This item will be archived and can be restored within 30 days.' Actual behavior is a hard delete... No restore mechanism exists.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Exact match to CRUD-06.

### ✅ CRUD-07 — Deleted items linger in the catalog view until a hard refresh (CRUD — Delete)
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** After confirming deletion, the catalog still lists w-001 even after a fresh full-page navigation to catalog.html. Server confirms record is gone.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to CRUD-07 (stale sessionStorage cache).

### ✅ CRUD-08 — Pagination's Next button does nothing (CRUD — Read (list/pagination))
- **Page(s):** catalog.html
- **Verdict:** FOUND
- **Matching finding:** The 'Next' pagination button does not advance to page 2.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to CRUD-08.

### ✅ CL-01 — Contradictory customer-count claims (Claims (cross-page))
- **Page(s):** index.html vs about.html
- **Verdict:** FOUND
- **Matching finding:** About page says 'Proudly serving our first 500 customers since 2018.' Home page says 'Trusted by over 10,000 happy customers'... two pages directly contradict each other.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to CL-01.

### ❌ CL-02 — Unsubstantiated 'carbon-neutral shipping' claim (Claims)
- **Page(s):** about.html
- **Verdict:** MISSED
- **Run agreement:** 100% (votes: {"MISSED":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"MISSED":1}. Tester observed the 'Carbon-neutral shipping' badge exists but never flagged it as an unsubstantiated claim lacking any shipping/checkout flow.

### ✅ CL-03 — Unfulfillable support-response claim (Claims)
- **Page(s):** contact.html
- **Verdict:** FOUND
- **Matching finding:** Contact page headline states 'Support response within 1 hour, 24/7.' This claim is factually violated: the contact API is broken (404), so no submitted message ever reaches the team.
- **Detected via:** ai
- **Run agreement:** 100% (votes: {"FOUND":1})
- **Reasoning:** Aggregated over 1 adjudication run(s): {"FOUND":1}. Direct match to CL-03.

## False Positives

- **edit-item.html:** 'updatedAt' timestamp exists in API but is never shown in the UI on item/edit pages
  - This is an observation about API vs UI surface; not a bug per se, more of a design choice. H-03 already covers the account-page updatedAt issue separately.
- **edit-item.html:** The API 'notes' field is not exposed in the edit form; users cannot create or edit notes via UI
  - Not a defect — notes appear to be a display-only field on the detail page. Speculation about missing feature.

## Bonus Findings (real, not in the seeded catalog)

- **about.html:** About page badge 'Since 2018-06-01' presented in raw ISO 8601 format — customer would expect 'June 2018'
  - A genuine UX/formatting concern (raw ISO in marketing copy) that is not one of the seeded faults; W-02 covers cross-page format inconsistency, not the ISO-ugliness itself.
- **catalog.html:** 'Previous' pagination button on page 1 is not disabled and has no aria-disabled attribute
  - Real UX/a11y issue but not in the seeded catalog.
- **account.html:** 'Email me order updates' checkbox on Account page has no associated <label> element — text is a bare text node
  - Legitimate accessibility defect distinct from S-01 (new-item) and C-02 (font); not in the seeded catalog.
- **contact.html:** Contact form accepts submission with all fields completely empty; no required-field validation
  - Genuine defect (missing client validation) that is not one of the seeded faults; distinct from P-01 (endpoint 404) and CL-03 (response claim).
- **item.html:** Navigating to item.html?id=w-001 after deletion renders a broken page with 'undefined' fields and an unhandled TypeError
  - Genuine defect — deleted-item URL should show a 'not found' state; not in the seeded catalog (distinct from CRUD-03 which is about a specific w-005 500 error).
- **catalog.html:** After deletion redirect to catalog, no success message/toast confirms the deletion
  - Real UX gap (no confirmation feedback after destructive action) not covered by seeded faults.

## Deterministic-vs-AI Attribution

Of the 25 faults caught (found or partially found), the session notes' per-finding source tags attribute:

| Detected via | Count |
|---|---|
| Deterministic scan alone | 0 |
| AI review alone | 25 |
| Both | 0 |
| Unclear/not reported | 0 |

This is the concrete evidence for whether the hybrid architecture (deterministic-first, AI for judgement calls) is pulling its weight, or whether one layer is doing essentially all the work.

## Methodology / Caveats

- Adjudication was performed by a single LLM call and carries real run-to-run variance — treat this scorecard as illustrative for one session, not as a precise, reproducible metric. Consider majority-vote over multiple adjudication runs before treating any specific percentage as authoritative.
- This is a single exploratory session against a fixed evidence snapshot, not exhaustive regression coverage.
- "False positive" here means a finding with no corresponding seeded fault; some may be genuine defects that simply weren't deliberately seeded (see Bonus Findings).
