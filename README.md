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
| `answer-key/` | The hidden fault catalog (41 seeded faults — 40 from the initial commit, plus `H-04`, a git-history-only regression on the golden page's own brand color, added later). Never an input to `exploratory-tester/`. |
| `exploratory-tester/` | The tool: deterministic scanners (crawler, console/network, accessibility, visual/spacing consistency, nav consistency, form validation, interaction-outcome probing, CRUD smoke) + `claude -p`-based AI review → session notes. Works against any site. |
| `comparison/` | Scores a tester run against `answer-key/`, via a separate LLM adjudication pass (optionally multi-run majority-vote with `--runs N`). |
| `regression/` | Scaffolded Playwright Planner/Generator/Healer agents (`npx playwright init-agents --loop=claude`) plus 6 hand-authored regression tests covering confirmed `FOUND` faults — see `regression/README.md` for a live-agent-availability caveat discovered while building it. |
| `exploratory-tester/src/agentic/` | **Experimental, not the default.** A live agentic-browsing mode (`bin/agentic-cli.js`) using real `@playwright/mcp` tools instead of a fixed evidence bundle — the architecture option §2 explicitly didn't choose, tried anyway to get real data. See `FINDINGS.md` §8 for the full cost/reliability/complementarity writeup. |

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

# 4. Score it against the answer key (add --runs 3 for a multi-run majority-vote score)
cd ../comparison
node src/compare.js --run-dir ../exploratory-tester/runs/my-run-1
# → comparison/reports/<timestamp>-comparison-report.md

# 5. Optional: run the regression suite that guards the confirmed FOUND faults
cd ../regression && npm install && npx playwright install chromium && npm test
```

Steps 2–4 are also automated as a single command: `npm run demo` (starts the app, runs the tester, scores it, then stops the app).

**Pointing this at a login-gated or client-side-routed site:** add `--login-url <url> --login-username <user> --login-password <pass>` for sites that require a real form-submit login (not just a session cookie), and/or `--storage-state <path.json>` for sites where a pre-captured cookie/localStorage session is enough on its own. The crawler also auto-falls-back to click-path reconstruction for pages that only exist via client-side routing (`history.pushState`, `href="#"` + `onClick`) rather than a real, independently-navigable URL — all three of these were added after pointing the tool at Sauce Demo (`saucedemo.com`) broke it three different ways; see `FINDINGS.md` §9 for the full story and what it found once it worked. A second external target, Shady Meadows B&B (a self-hosted Docker Compose app, `external-validation/shadymeadows/`), needed none of these — a useful contrast showing the plain direct-navigation path still works cleanly on a third, unrelated site; see `FINDINGS.md` §10 for what it found instead, including a booking-flow defect traced to a confirmed root cause in the target's own source.

**Windows/Git Bash note:** if invoking `node bin/cli.js ... --golden-path /index.html` from Git Bash, prefix the command with `MSYS_NO_PATHCONV=1` — otherwise Git Bash silently rewrites the leading-slash argument into a local filesystem path before Node ever sees it (a classic MSYS path-mangling gotcha), which sends the golden-reference navigation to a dead local file path and hangs. The same gotcha bites any other command invoked from Git Bash with a leading-slash argument (for example `docker run ... -w /workspace ...`) — same fix.

exploratory-tester performs real state-mutating actions (it creates/edits/deletes real records as part of its CRUD smoke flow) — only point it at a test/staging environment, or pass `--read-only` to skip that flow. Reset the test app's data with `npm run app:reset-db` (workspace: `test-app`) between runs if you want a clean baseline.

### Mode 1: Deterministic + AI interpretation (the default pipeline)

This is what `bin/cli.js` runs, and what steps 1–5 above walk through: fixed Playwright scanners capture a static evidence bundle per page (screenshots, DOM, console/network logs, an axe-core accessibility scan, extracted text, plus scripted interaction probes and a CRUD smoke flow), then `claude -p` reviews that fixed bundle with no live browsing capability at all — see "Design notes" below for why. This is the default because it's fast, cheap (~$0.50/run), and deterministic scan output doesn't vary run to run.

```bash
npm install                # once
npm run app:start          # terminal 1 — http://localhost:4173

# terminal 2
cd exploratory-tester
node bin/cli.js \
  --url http://localhost:4173 \
  --checklist ../checklist/few-hiccupss-crud-checklist.md \
  --charter ../charter/exploratory-charter.md \
  --app-desc ../app-spec/test-app-description.md \
  --golden-path /index.html \
  --run-id my-run-1
# → exploratory-tester/runs/my-run-1/session-notes.md

cd ../comparison
node src/compare.js --run-dir ../exploratory-tester/runs/my-run-1
# add --runs 3 for a multi-run majority-vote score instead of a single-pass adjudication
# → comparison/reports/<timestamp>-comparison-report.md
```

Flags specific to this mode:

| Flag | Purpose |
|---|---|
| `--url` *(required)* | Base URL of the site to test. |
| `--checklist` / `--charter` / `--app-desc` *(required)* | Paths to the three input MDs (must not resolve under `answer-key/`). |
| `--golden-path` | Path (relative to `--url`) of the visual/brand reference page. Default `/`. |
| `--run-id` | Output directory name under `runs/`. Default: a timestamp. |
| `--model` | Model for the `claude -p` review calls. Default `sonnet`. |
| `--max-budget-usd` | Hard spend cap for the AI phase. Default `0.50`. |
| `--skip-ai` | Deterministic scanners only, no `claude -p` calls — useful for a fast sanity check or CI. |
| `--read-only` | Skip the CRUD smoke flow (no create/edit/delete against the target). |
| `--login-url` / `--login-username` / `--login-password` | Real form-submit login bootstrap, for sites where a cookie alone doesn't establish a session. |
| `--storage-state` | Path to a pre-captured Playwright `storageState` JSON, for sites where that's sufficient on its own. |

### Mode 2: Playwright MCP + heavy AI usage (experimental agentic mode)

This is what `bin/agentic-cli.js` runs — a live agentic-browsing mode using the real `@playwright/mcp` server, so the model drives an actual browser via `browser_navigate`/`browser_click`/`browser_snapshot`/etc. tool calls instead of reviewing a fixed evidence bundle. It exists to answer "what if the AI just explored like a human tester, tools and all?" as a genuine empirical comparison against Mode 1, not as a replacement for it — see `FINDINGS.md` §8 for the full cost/reliability/complementarity results (57% recall vs. 71% for Mode 1 after its fixes, ~$3.04 vs. ~$0.50, ~23 minutes vs. a few minutes, on the same WidgetWorks target).

Unlike Mode 1, this mode doesn't crawl pages — it runs 6 fixed, bounded tasks (`home-and-about`, `catalog-interactions`, `create-widget-edge-cases`, `edit-widget-twice`, `account-and-contact`, `delete-widget`), each its own `claude -p` call with a live, isolated, headless `@playwright/mcp` browser session scoped to the target origin.

```bash
npm install                # once — @playwright/mcp is fetched automatically via npx when the run starts
npm run app:start          # terminal 1 — http://localhost:4173

# terminal 2
cd exploratory-tester
node bin/agentic-cli.js \
  --url http://localhost:4173 \
  --checklist ../checklist/few-hiccupss-crud-checklist.md \
  --charter ../charter/exploratory-charter.md \
  --app-desc ../app-spec/test-app-description.md \
  --run-id my-agentic-run-1
# → exploratory-tester/runs/my-agentic-run-1/session-notes.md
# → exploratory-tester/runs/my-agentic-run-1/agentic-results.json (per-task cost/turns/duration)

cd ../comparison
node src/compare.js --run-dir ../exploratory-tester/runs/my-agentic-run-1
# → comparison/reports/<timestamp>-comparison-report.md
```

Accepts the same `--model`/`--max-budget-usd`/`--run-id`/`--golden-path` flags as Mode 1 (`--max-budget-usd` here is a per-task cap, applied across all 6 tasks, so budget for several times the single-run figure). `comparison/` scores an agentic run exactly the same way as a Mode 1 run — it only ever reads `session-notes.md` and the structured findings, not which mode produced them.

**Before trying Mode 2 against a new target:** confirm `npx @playwright/mcp@0.0.80 --version` resolves (first run downloads it), and expect meaningfully higher cost/runtime and lower, less consistent recall than Mode 1 — per `FINDINGS.md` §8, its main value in this PoC was catching a handful of findings Mode 1's static bundle genuinely couldn't (things that only surface via live interaction sequencing), not replacing the default pipeline.

## Design notes

- **Static artifact review, not live agentic browsing.** Deterministic scanners capture a fixed evidence bundle (screenshots, DOM, console/network logs, accessibility scan, extracted text) per page first. The AI phase only ever reviews that fixed bundle — it has no MCP servers, no Bash, and Read access scoped to nothing but the evidence directory (`--tools Read --strict-mcp-config --mcp-config '{"mcpServers":{}}' --add-dir <evidence-dir>`). This is what makes results comparable run to run and keeps the AI phase cheap.
- **Deterministic first, AI only where automation genuinely can't judge.** Broken links/images, console/network errors, WCAG-checkable accessibility issues, brand/visual drift vs. the golden page, nav consistency, and scripted CRUD diffing are all found without any LLM call. The AI phase is reserved for heuristics that need judgement: Familiarity, Explainability, Claims, User Expectations, Purpose, Comparable Products, Image polish, and anything that only shows up by comparing pages to each other.
- **Answer-key isolation is layered, not a single control.** `answer-key/` is a sibling folder never under `test-app/public/` and never referenced in `exploratory-tester/src/`. The AI phase's only filesystem grant points at its own evidence directory. `exploratory-tester/src/config.js` also resolves every configured input path to its realpath and hard-aborts if any falls under `answer-key/`. `comparison/` is the only package that reads the fault catalog, and only after a tester run already exists independently.
- **A single LLM adjudication pass has real variance.** Treat any comparison report as illustrative for one session, not as a precise, reproducible metric — see that report's own Methodology/Caveats section.

## Results: before and after implementing the Recommendations

Two full, clean pipeline runs, scored against the answer key — one before any of the fixes in "Recommendations for Improvement" below, one after:

| Metric | Baseline (`measured-run-3`, 40 faults) | After fixes (`measured-run-4`, 41 faults — `H-04` added, see §History below) |
|---|---|---|
| Found | 20 / 40 (50%) | 28 / 41 (68%) |
| Partially found | 7 / 40 (18%) | 2 / 41 (5%) |
| Missed | 13 / 40 (33%) | 11 / 41 (27%) |
| **Recall** (found + 0.5×partial) | **59%** | **71%** |
| False positives | 8 | 4 |
| Bonus findings (real, unseeded defects) | 9 | 11 |
| Detected by deterministic scan alone | 1 of 27 caught faults | 4 of 30 caught faults |
| Detected by AI review alone | 20 of 27 caught faults | 12 of 30 caught faults |
| Detected by both | 6 of 27 caught faults | 14 of 30 caught faults |

Full reports: `comparison/reports/2026-09-04T15-13-37-624Z-comparison-report.md` (baseline) and `comparison/reports/2026-09-04T17-06-47-139Z-comparison-report.md` (after fixes).

The category-level shift makes the improvement concrete — every category the baseline did poorly on moved to 100% found after implementing Recommendation #1 and #2 below:

| Category | Baseline | After fixes |
|---|---|---|
| User Expectations | 1/3 found | **3/3 found** |
| CRUD — Update | 0/2 found | **2/2 found** |
| CRUD — Read (pagination) | 0/1 found | **1/1 found** |
| Explainability | 0/3 found (2 partial) | **2/3 found** |

11 faults remained missed even after the fixes — mostly ones needing an oracle the tool still doesn't have (see `H-04` and Conclusion #3 below), or narrower CRUD-Read/Create edge cases not covered by the broadened smoke flow.

## Conclusions

1. **Static-artifact review had a real ceiling — but it turned out to be a scope gap, not a structural limit.** In the baseline run, nearly every miss shared one shape: a fault only becomes visible if you actually *do* the thing — change the sort dropdown and check the resulting order (`U-03`), type in the search box and check results change (`P-02`), click Next and check the page advances (`CRUD-08`), toggle a checkbox and check what got saved (`U-02`), double-click Save and check for a lost update (`CRUD-05`). A screenshot and a DOM snapshot, however good, cannot show the *after* state of an action never performed. Once scanners were extended to actually perform these interactions and diff the outcome (Recommendations #1–#2), every one of those categories went to 100% found. This is the single biggest, most actionable finding from this PoC: a large share of what looks like it needs AI judgement actually just needs something to click the thing and check what happened.
2. **The hybrid architecture's balance shifted substantially once the deterministic layer stopped being just an evidence-gathering pass.** Baseline: 26 of 27 caught faults involved the AI review, only 1 caught by deterministic scanning alone. After the fixes: 18 of 30 caught faults now involve deterministic scanning (4 alone, 14 confirmed by both), nearly a 3x increase in deterministic-alone catches and more than double the "both" overlap — while overall recall still went *up* (59%→71%), not down. The AI layer's remaining comparative advantage concentrated where it should: judgement about intent, tone, and cross-page contradictions that no diff can express (`CL-01`, `CL-03`, brand/Claims-heavy findings).
3. **A deliberate experiment confirmed a distinct, unimplemented capability gap: none of this is git-history-aware.** A 41st fault (`H-04`) was added after the baseline — a silent regression of the golden reference page's own brand color, seeded as a second git commit specifically to be uncatchable by any same-snapshot comparison. It was, exactly as predicted: the adjudicator's own reasoning states the tool "treated \[the regressed page\] as correct and all other pages were reported as drifting instead — exactly the perverse inversion the seeded fault documents." Consistency heuristics (Familiarity, Image, Comparable Products) are only as good as the reference they're compared against; if the reference itself drifts, the same apparatus that catches everything else can point in exactly the wrong direction. "History" — is the software consistent with its own past? — needs an oracle outside the current snapshot (version control, a changelog) that this tool doesn't have.
4. **One seeded fault (`CRUD-03`) remained structurally unreachable even after broadening the CRUD smoke flow, and that's honest, not a tool failure.** It lives on catalog page 2, reachable only by an item the flow's 3-record sample didn't happen to select. Worth keeping as a reminder that "missed" and "wasn't exercised this session" are different things a report should be able to tell apart, the same way a human tester constrained to a limited session would have the same gap.
5. **Building this surfaced real bugs in the tool itself, not just the target app** — worth keeping as documented pitfalls for anyone extending it: Git Bash silently rewrites a leading-slash CLI argument into a local filesystem path (`MSYS_NO_PATHCONV=1` fixes it); Windows has a hard command-line length limit that a large inlined prompt reliably exceeded as a `-p <prompt>` argument (fixed by piping the prompt over stdin instead); Playwright's `page.screenshot()` temporarily injects a `caret-color` style into every text input by default, which a concurrent `page.content()` call caught mid-mutation and the AI dutifully — and wrongly — reported as a serious sitewide defect (fixed with `caret: 'initial'`); a diff-based bug scanner can be defeated by the target app's own client-side caching unless it deliberately bypasses it; and a test probe's own synthetic-data naming can defeat the probe on a sorted/paginated view (a `"ZZZ-"` tag prefix pushed renamed records off-page; `"AAA-"` kept them visible). See `FINDINGS.md` for the full writeup of each.
6. **The AI review's own honesty is a feature.** It repeatedly flagged when it couldn't be sure of something a scanner can't see (e.g., "does the delete action trigger a JS confirmation dialog at runtime — not visible in the static DOM snapshot?" — which the CRUD smoke flow's dialog capture actually answers) rather than asserting either way. That calibration is part of why the false-positive list is short (and got shorter — 8→4) rather than full of confident wrong guesses.

## Recommendations for Improvement

All 7 recommendations below are now implemented (previously this section was future-tense). See "Results After Implementing the Recommendations" further down for the before/after impact, measured on a fresh run.

1. ✅ **Add an interaction-outcome prober scanner.** Implemented as `exploratory-tester/src/scanners/interactionProbe.js`: actually selects every option on a `<select>`/custom dropdown and diffs the resulting content (with a generic "low to high"/"high to low" wording check against the actual observed order), types a nonsense query into search-like inputs and checks whether anything changes, clicks a "Next"-like pagination control and checks whether a "Page X of Y" status or the content actually changes, and toggles checkboxes tied to a save action through a full page reload to verify the persisted value round-trips correctly. On the reference app this deterministically catches `U-02`, `U-03`, `P-02`, and `CRUD-08` — exactly as predicted, without any AI judgement needed.
2. ✅ **Broaden the CRUD smoke flow.** `crudSmoke.js` now tests update against up to 3 distinct records (diffing the *entire* list, including records that weren't visible before the edit but become visible after — this is what actually catches an index-vs-id bug like `CRUD-04`, since a renamed record can jump onto the visible page from off-page), adds an explicit rapid-double-click race test for `CRUD-05`, and attempts to reach records beyond page 1 rather than silently only ever testing the first page. One non-obvious fix along the way: the probe's own tag prefix mattered — a `"ZZZ-"` tag sorts a renamed record to the end of an alphabetically-sorted list (often off-page, making a real change look like nothing happened); switching to `"AAA-"` keeps it visible where the diff can see it.
3. ✅ **Sharpen validation testing.** `formValidation.js` now runs a second scenario per form — filling every field with a plausible value except one numeric-looking field, which gets a non-numeric string — and captures the actual error *text* (not just a boolean) for both scenarios. If the text is identical across both, that's now a first-class deterministic finding, not something left for the AI to notice. This catches `E-01` without any AI judgement.
4. ✅ **Prevent adjudication double-counting.** The adjudication prompt (`comparison/src/adjudicate.js`) now explicitly instructs the model that a finding already credited toward a verdict must never also appear in false positives, backed by a post-processing dedup pass that drops any false-positive whose text substantially overlaps an already-credited `matchingFinding`.
5. ✅ **Multi-run adjudication majority-vote.** `comparison/src/compare.js --runs N` runs adjudication N times in parallel and aggregates each fault's verdict by mean score (not a naive majority, so a 2–1 split lands as `PARTIALLY_FOUND` rather than an arbitrary tie-break), reporting per-fault run-agreement and a recall range (min/max/mean) instead of a single point estimate.
6. ✅ **Build the `regression/` phase** — with a real limitation surfaced along the way: `npx playwright init-agents --loop=claude` was actually run inside `regression/`, producing genuine `.claude/agents/{planner,generator,healer}.md` definitions and an `.mcp.json`. But testing it directly (`Agent({subagent_type: "playwright-test-generator"})`) confirmed these nested project agents aren't visible to a session rooted one directory up — Claude Code only discovers agents from the project root's own `.claude/`, not a subdirectory's. The 6 regression tests in `regression/tests/` were therefore authored directly rather than through a live Generator tool-loop; see `regression/README.md` for the full explanation and how to get the live agent loop (run `claude` with `regression/` itself as the working directory).
7. ✅ **Extend spacing/layout checks.** `visualConsistency.js` now hard-checks primary-button padding, page-container horizontal padding, and inter-form-field spacing against the golden reference with a 2px tolerance, the same way color/font/radius already were.
