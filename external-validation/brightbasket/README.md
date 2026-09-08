# External validation: BrightBasket

Not a truly "external" site the way Sauce Demo (`external-validation/saucedemo/`) or Shady Meadows B&B (`external-validation/shadymeadows/`) are — it's a sibling proof-of-concept app, `ExploratoryTestApp` (a separate sibling repo/directory next to this one), built to the exact same shape as WidgetWorks: its own `checklist/`, `charter/`, `app-spec/`, `test-app/`, and a hidden `answer-key/fault-catalog.md` (48 seeded faults, vs. WidgetWorks' 41). BrightBasket is a small e-commerce storefront (browse → basket → two-step checkout → confirmation → order history) rather than WidgetWorks' inventory-catalog CRUD shape, so it's still a genuine generalization test — a different app, a different domain, a different primary flow (a multi-step checkout with seam-testing risk instead of a flat CRUD list) — just one where, unlike Sauce Demo/Shady Meadows, ground truth exists for scoring.

## Standing up the site locally

```bash
cd /path/to/ExploratoryTestApp/test-app
npm install
npm start
# → http://localhost:4174
```

SQLite-backed (`test-app/server/data/brightbasket.db`), seeded automatically on first start. `npm run reset-db` (or delete the `.db` file) to get back to a clean baseline between runs.

## How the tool is pointed at this site

No login, no client-side routing — every page resolves via ordinary direct navigation, so none of the Sauce Demo generalization fixes (§9 in the root `FINDINGS.md`) were needed here either, same as Shady Meadows.

```bash
cd ../../ExporitoryTesting/exploratory-tester

# Mode 1: static pipeline
MSYS_NO_PATHCONV=1 node bin/cli.js \
  --url http://localhost:4174 \
  --checklist "/path/to/ExploratoryTestApp/checklist/few-hiccupss-crud-checklist.md" \
  --charter "/path/to/ExploratoryTestApp/charter/exploratory-charter.md" \
  --app-desc "/path/to/ExploratoryTestApp/app-spec/test-app-description.md" \
  --golden-path /index.html \
  --run-id brightbasket-static-1

# Mode 2: agentic MCP-browsing pipeline
MSYS_NO_PATHCONV=1 node bin/agentic-cli.js \
  --url http://localhost:4174 \
  --checklist "/path/to/ExploratoryTestApp/checklist/few-hiccupss-crud-checklist.md" \
  --charter "/path/to/ExploratoryTestApp/charter/exploratory-charter.md" \
  --app-desc "/path/to/ExploratoryTestApp/app-spec/test-app-description.md" \
  --tasks-file "../external-validation/brightbasket/agentic-tasks.json" \
  --golden-path /index.html \
  --run-id brightbasket-agentic-1
```

**Windows/Git Bash note, one layer deeper than the usual `MSYS_NO_PATHCONV=1` warning:** when the checklist/charter/app-desc paths point *outside* this repo (as they do here — they live in the sibling `ExploratoryTestApp` checkout), pass them as real Windows-style paths (`C:/Users/.../checklist.md`), not POSIX-style (`/c/Users/...`). `MSYS_NO_PATHCONV=1` stops Git Bash from mangling the *golden-path* argument (`/index.html`, not a real file) into a bogus local path — but it also means Git Bash won't auto-convert a genuine POSIX-style input path into the Windows path Node actually needs, so a `/c/Users/...` path fails Node's own `fs.existsSync` check instead. Windows-style paths sidestep the conversion question entirely since they were never going to be misread as a URL path.

## A new generalization gap this run surfaced: agentic mode's task list was hardcoded

Unlike the static pipeline (which crawls whatever pages it finds and needs no site-specific configuration), `bin/agentic-cli.js`'s live-browsing mode runs a fixed list of **6 bounded task prompts hardcoded in `src/agentic/runAgenticSession.js`**, written around WidgetWorks' own pages and flows ("Go to the 'Add widget' form...", "Open an existing widget's edit page..."). Pointing agentic mode at BrightBasket unmodified would have run those exact WidgetWorks-shaped prompts against a site with no widgets, no admin CRUD, and a completely different page set — a real gap, not yet encountered because agentic mode had only ever been run against WidgetWorks itself before this.

**Fix, generalized rather than special-cased for this one site:** `config.js` gained an optional `--tasks-file <path.json>` flag; `runAgenticSession.js` loads a `{id, description}[]` array from that file when given, falling back to the original built-in WidgetWorks task list (renamed `DEFAULT_TASKS`) when omitted — so every prior agentic run/result stays reproducible with zero flag changes. `agentic-tasks.json` in this directory is BrightBasket's task set: 7 tasks mirroring the charter's own Target Areas table (Home/About claims, Shop search/filter/sort/pagination, Product detail + add-to-basket edge cases including stock limits, Basket lifecycle + all 4 discount codes, Checkout Delivery/Payment edge-case input + card-length rules, a full place-order-then-cross-check-Confirmation-vs-Order-Detail seam test, and Contact/FAQ claim-checking) — written from the charter and product description alone, before the answer key was read for scoring, the same discipline the static pipeline's inputs already follow.

## A second gap this run surfaced: checkout-only pages are invisible to link-crawling

The first static-pipeline pass (`brightbasket-static-1`) scored only **25% recall** — not because the checklist/charter/app-desc were wrong, but because `checkout-payment.html`, `confirmation.html`, and (transitively) `order-detail.html` were **never visited at all**, and `basket.html` was only ever captured empty. BrightBasket's checkout wizard advances via a plain `window.location.href = '/checkout-payment.html'` redirect inside a form's `submit` handler — not a link, not an `onClick`-driven element, nothing `crawler.js`'s link/click-candidate discovery would ever find. This is a different failure mode than Sauce Demo's href="#" gap (§9): it's not about *how* a real destination is reached, it's a destination that doesn't exist to reach until a valid multi-field form has actually been submitted.

**Fix:** a new scanner, `exploratory-tester/src/scanners/checkoutWalkthrough.js`, drives the real add-to-basket → checkout-delivery → checkout-payment → place-order flow using the same generic accessible-name-matching discipline `crudSmoke.js` already uses (not BrightBasket-specific selectors), running *before* the crawl (not just before evidence capture) so a real order already exists by the time the crawler runs — `order-detail.html` then becomes discoverable via `orders.html`'s own real `<a href>` with zero extra code, since a list page linking to a just-created record is exactly what the existing crawler already handles. `checkout-payment.html` and `confirmation.html`, which never get a real href at all, are evidenced directly by the walkthrough using the same shared `capturePageEvidence()` helper the main crawl loop uses (screenshot, DOM, a11y, form-validation probe, interaction probe — identical evidence depth, not a thinner special case). It also tries the charter's own suggested "deliberately awkward but valid" delivery values first (an apostrophe/hyphen name) and falls back to a safe value only if rejected — which incidentally reproduced seeded fault `U-04` (apostrophes/hyphens wrongly rejected) as a side effect of just trying to get through the form.

One real bug found building this, worth remembering for any future generic-selector heuristic: the first version located the "Basket" nav link via `getByRole("link", { name: /basket|cart|bag/i })` and it matched the **header logo** instead (`<img alt="BrightBasket">` — the brand name itself contains the substring "basket"). Fixed by anchoring to the start of the accessible name (`/^\s*(basket|cart|bag)\b/i`). A brand name colliding with a generic substring match is a real risk for any site, not just this one.

See `FINDINGS.md` §14 for the full writeup, including a real regression this fix introduces (`U-01`, which specifically needs an *empty* basket to be observable, is now permanently missed because the walkthrough deliberately leaves the basket non-empty) and a false positive it introduces (the walkthrough's own post-order "leave basket non-empty" step gets misread by AI review as evidence that "the basket isn't cleared after checkout").

## Answer key format

`ExploratoryTestApp/answer-key/` shipped with only `fault-catalog.md` (BrightBasket-authored, matching that repo's own convention) — `comparison/compare.js` expects a `fault-catalog.json` in the `{faults: [{id, category, page, title, description, technicalDetail}]}` shape WidgetWorks' answer key already used. A matching `fault-catalog.json` was added to `ExploratoryTestApp/answer-key/` (same directory, mechanical transcription of the `.md`'s content, not a new source of truth) so `comparison/` could score these runs without inventing a second scoring format.

## Scoring

```bash
cd ../../ExporitoryTesting/comparison
node src/compare.js \
  --run-dir ../exploratory-tester/runs/brightbasket-static-4 \
  --fault-catalog "/path/to/ExploratoryTestApp/answer-key/fault-catalog.json" \
  --runs 3   # see FINDINGS.md §14's concurrent-spawn caveat if this errors — retry with --runs 1

node src/compare.js \
  --run-dir ../exploratory-tester/runs/brightbasket-agentic-2 \
  --fault-catalog "/path/to/ExploratoryTestApp/answer-key/fault-catalog.json" \
  --runs 3
```

## Results

| Run | Recall | Found | False positives | Bonus findings |
|---|---|---|---|---|
| `brightbasket-static-1` (pre-checkout-walkthrough-fix) | 25% (24–25%) | 11/48 | 24 | 36 |
| `brightbasket-static-4` (post-fix) | ~45% (43–46%) | 20/48 | 2–8 | 10–13 |
| `brightbasket-agentic-2` | 52% (51–54%) | 24/48 | 7 | 23 |

See the root `FINDINGS.md` §14 for the full category-level breakdown, the honest regression/false-positive caveats, and the two other engineering pitfalls found along the way (unreliable concurrent `claude -p` spawns on this machine, and the agentic mode's per-task budget cap being too tight for BrightBasket's broader tasks).
