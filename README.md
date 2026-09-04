# AI-Augmented Exploratory Testing — Proof of Concept

A proof of concept for exploratory testing augmented by AI: a deliberately buggy test application with a hidden answer key of seeded faults, a Playwright-based tool that explores any site the way a human exploratory tester would (deterministic scans first, AI judgement second), and a final report scoring how many of the deliberate faults the tool actually found — without the tool ever having seen the answer key.

## Pipeline

```
checklist/  charter/  app-spec/          test-app/                answer-key/
(oracle)    (mission) (product spec)  →  WidgetWorks, seeded       (ground truth,
                                          with ~40 deliberate       NEVER read by
                                          faults                    exploratory-tester/)
     \          \          /                    |
      \          \        /                     | serves
       ------\    |      /                       v
              v   v     v                  http://localhost:4173
           exploratory-tester/  ------------------^
           (deterministic Playwright scanners, then
            headless `claude -p` review of the fixed
            evidence bundle) → runs/<runId>/session-notes.md
                    |
                    v
             comparison/  (the ONLY package that reads answer-key/,
             and only after a tester run already exists)
                    |
                    v
       comparison/reports/<timestamp>-comparison-report.md
```

## Packages

| Path | What it is |
|---|---|
| `checklist/few-hiccupss-crud-checklist.md` | The FEW HICCUPSS + CRUD heuristic checklist — the oracle exploratory-tester and any human tester works from. |
| `charter/exploratory-charter.md` | Session-Based Test Management charter for testing WidgetWorks. |
| `app-spec/test-app-description.md` | High-level product description of WidgetWorks (no bug hints). |
| `test-app/` | The deliberately buggy test application (Express + static pages). `index.html` is the golden reference page. |
| `answer-key/` | The hidden fault catalog (~40 seeded faults). Never an input to `exploratory-tester/`. |
| `exploratory-tester/` | The tool: deterministic scanners + `claude -p`-based AI review → session notes. Works against any site. |
| `comparison/` | Scores a tester run against `answer-key/`, via a separate LLM adjudication pass. |
| `regression/` | **Not yet built.** Planned: scaffold Playwright's Planner/Generator/Healer agents (`npx playwright init-agents --loop=claude`) and turn a handful of confirmed findings into regression tests, closing the explore → find → confirm → regression-test → self-heal loop. See Recommendations below. |

## Running it

```bash
# 1. Install everything
npm install

# 2. Start the test app
npm run app:start          # http://localhost:4173

# 3. In another terminal, run the exploratory tester against it
cd exploratory-tester
node bin/cli.js \
  --url http://localhost:4173 \
  --checklist ../checklist/few-hiccupss-crud-checklist.md \
  --charter ../charter/exploratory-charter.md \
  --app-desc ../app-spec/test-app-description.md \
  --golden-path /index.html \
  --run-id my-run-1
# → exploratory-tester/runs/my-run-1/session-notes.md

# 4. Score it against the answer key
cd ../comparison
node src/compare.js --run-dir ../exploratory-tester/runs/my-run-1
# → comparison/reports/<timestamp>-comparison-report.md
```

**Windows/Git Bash note:** if invoking `node bin/cli.js ... --golden-path /index.html` from Git Bash, prefix the command with `MSYS_NO_PATHCONV=1` — otherwise Git Bash silently rewrites the leading-slash argument into a local filesystem path before Node ever sees it (a classic MSYS path-mangling gotcha), which sends the golden-reference navigation to a dead local file path and hangs.

exploratory-tester performs real state-mutating actions (it creates/edits/deletes real records as part of its CRUD smoke flow) — only point it at a test/staging environment, or pass `--read-only` to skip that flow. Reset the test app's data with `npm run app:reset-db` (workspace: `test-app`) between runs if you want a clean baseline.

## Design notes

- **Static artifact review, not live agentic browsing.** Deterministic scanners capture a fixed evidence bundle (screenshots, DOM, console/network logs, accessibility scan, extracted text) per page first. The AI phase only ever reviews that fixed bundle — it has no MCP servers, no Bash, and Read access scoped to nothing but the evidence directory (`--tools Read --strict-mcp-config --mcp-config '{"mcpServers":{}}' --add-dir <evidence-dir>`). This is what makes results comparable run to run and keeps the AI phase cheap.
- **Deterministic first, AI only where automation genuinely can't judge.** Broken links/images, console/network errors, WCAG-checkable accessibility issues, brand/visual drift vs. the golden page, nav consistency, and scripted CRUD diffing are all found without any LLM call. The AI phase is reserved for heuristics that need judgement: Familiarity, Explainability, Claims, User Expectations, Purpose, Comparable Products, Image polish, and anything that only shows up by comparing pages to each other.
- **Answer-key isolation is layered, not a single control.** `answer-key/` is a sibling folder never under `test-app/public/` and never referenced in `exploratory-tester/src/`. The AI phase's only filesystem grant points at its own evidence directory. `exploratory-tester/src/config.js` also resolves every configured input path to its realpath and hard-aborts if any falls under `answer-key/`. `comparison/` is the only package that reads the fault catalog, and only after a tester run already exists independently.
- **A single LLM adjudication pass has real variance.** Treat any comparison report as illustrative for one session, not as a precise, reproducible metric — see that report's own Methodology/Caveats section.

## Results (reference run)

A full, clean pipeline run (`exploratory-tester/runs/measured-run-3/`, scored in `comparison/reports/2026-09-04T15-13-37-624Z-comparison-report.md`) against the 40-fault answer key:

| Metric | Result |
|---|---|
| Found | 20 / 40 (50%) |
| Partially found | 7 / 40 (18%) |
| Missed | 13 / 40 (33%) |
| **Recall** (found + 0.5×partial) | **59%** |
| False positives | 8 (mostly defensible — design-choice disagreements, one low-confidence guess) |
| Bonus findings (real, unseeded defects) | 9 |
| Detected by deterministic scan alone | 1 of 27 caught faults |
| Detected by AI review alone | 20 of 27 caught faults |
| Detected by both | 6 of 27 caught faults |

By heuristic category, the split was stark:

| Did well (≥66% found) | Did poorly (0% found) |
|---|---|
| Image (4/4), Statutes/Standards (3/4), World (2/3), Claims (2/3), History (2/3), Familiarity (2/3), Comparable Products (2/3) | CRUD-Update (0/2), CRUD-Read (0/1), CRUD-Read/pagination (0/1), Explainability (0/3, though 2 partial) |

## Conclusions

1. **The hybrid architecture works as designed, and the AI layer is doing most of the judgement-based work.** 26 of 27 caught faults involved the AI review; only 1 (the silent create-failure, `CRUD-02`) was caught by deterministic scanning alone and never surfaced in the narrative. This validates deterministic-first-then-AI as an architecture, but the current deterministic layer is closer to an evidence-gathering pass than an independent detector — most of its value is anchoring/confirming what the AI already found (6 faults), not finding things on its own.
2. **Static-artifact review has a real, structural ceiling: it can describe a page but can't finish an interaction and check the outcome.** Nearly every miss shares one shape — a fault only becomes visible if you actually *do* the thing: change the sort dropdown and check the resulting order (`U-03`), type in the search box and check results change (`P-02`), click Next and check the page advances (`CRUD-08`), toggle a checkbox and check what got saved (`U-02`), double-click Save and check for a lost update (`CRUD-05`). A screenshot and a DOM snapshot, however good, cannot show the *after* state of an action that was never performed. This is the single biggest, most actionable finding from this PoC.
3. **One seeded fault (`CRUD-03`) was structurally unreachable, and that's honest, not a tool failure.** It lives on catalog page 2, and the pagination Next button is itself broken (`CRUD-08`) — the tool correctly never got there, the same way a human tester constrained to page 1 wouldn't either. Worth noting as a reminder that "missed" and "unreachable given what was actually explored" are different things a report should be able to tell apart.
4. **Building this surfaced real bugs in the tool itself, not just the target app** — worth keeping as documented pitfalls for anyone extending it: Git Bash silently rewrites a leading-slash CLI argument into a local filesystem path (`MSYS_NO_PATHCONV=1` fixes it); Windows has a hard command-line length limit that a large inlined prompt reliably exceeded as a `-p <prompt>` argument (fixed by piping the prompt over stdin instead); and Playwright's `page.screenshot()` temporarily injects a `caret-color` style into every text input by default, which a concurrent `page.content()` call caught mid-mutation and the AI dutifully — and wrongly — reported as a serious sitewide defect (fixed with `caret: 'initial'`, and by not running mutating/transient operations concurrently with evidence capture in general).
5. **The AI review's own honesty is a feature.** It repeatedly flagged when it couldn't be sure of something a scanner can't see (e.g., "does the delete action trigger a JS confirmation dialog at runtime — not visible in the static DOM snapshot?" — which the CRUD smoke flow's dialog capture actually answers) rather than asserting either way. That calibration is part of why the false-positive list is short and mostly defensible rather than full of confident wrong guesses.

## Recommendations for Improvement

1. **Add an interaction-outcome prober scanner.** For every `<select>`/custom-dropdown, actually pick each option and diff the resulting list order/content; for every search input, type a query and diff results before/after; for pagination controls, click Next/Previous and confirm the visible content actually changes; for checkboxes tied to a save action, toggle and re-fetch to confirm the stored value matches. This is the highest-leverage change — it would likely have caught `U-02`, `U-03`, `P-02`, and `CRUD-08` deterministically, without any AI judgement needed.
2. **Broaden the CRUD smoke flow.** Test update/delete against more than one record (to catch index-vs-id bugs like `CRUD-04` that only misfire for some records), add an explicit rapid-double-click race test for `CRUD-05`, and have it attempt to reach records beyond the first paginated page rather than only the first item found on the list page.
3. **Sharpen the per-page AI prompt for validation testing.** Explicitly instruct it to trigger more than one distinct validation failure per form (e.g., empty field vs. wrong type vs. out-of-range value) and compare the resulting error text across them — this is what would catch a generic-message fault like `E-01`.
4. **Tighten the adjudication schema to prevent double-counting.** In this run, one finding was independently listed under both `PARTIALLY_FOUND` (`CL-02`) and `False Positives`, with the adjudicator's own reasoning noting the duplication. Add an explicit instruction (or a post-processing check in `comparison/src/adjudicate.js`) that a finding already credited toward a verdict must not also appear in the false-positives list.
5. **Run adjudication multiple times and majority-vote before trusting a specific percentage.** Both the AI review and the adjudication pass are single LLM calls with real run-to-run variance — the report already discloses this, but the natural next step is `comparison/src/compare.js --runs 3` (or similar) aggregating across repeated adjudications of the same tester run, and reporting a range rather than a point estimate.
6. **Build the `regression/` phase.** Scaffold Playwright's Planner/Generator/Healer agents (`npx playwright init-agents --loop=claude`, run directly inside `regression/`) and use Generator to turn 5–8 of the confirmed `FOUND` faults from a comparison report into real regression tests — expected to fail red against the still-buggy app — then demonstrate Healer repairing a deliberately drifted selector without changing test intent. This is the piece that closes the loop back to the original "Playwright agents + MCP" framing and hasn't been started yet.
7. **Extend the visual-consistency scanner's spacing/layout check.** It currently records container spacing as informational context only (no deviation threshold), unlike color/font/radius which are hard-checked. None of the 40 seeded faults specifically exercise this, so it's untested territory rather than a known gap — but a real target site would likely have layout-drift bugs a color/font-only check can't see.
