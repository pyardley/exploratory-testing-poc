# Regression Phase — Planner / Generator / Healer

Closes the loop described in the project's opening framing (Playwright agents + MCP) and in the root README's Recommendation #6: explore → find → confirm → regression-test → self-heal.

## What's real here

- **`.claude/agents/playwright-test-planner.md`, `playwright-test-generator.md`, `playwright-test-healer.md`, `.mcp.json`, `specs/`, `seed.spec.ts`** — genuinely scaffolded by running `npx playwright init-agents --loop=claude` inside this folder, exactly as Playwright ships it. Not hand-written.
- **`playwright.config.ts`, `package.json`, `tests/*.spec.ts`** — a real Playwright project pointed at the test app (`baseURL: http://localhost:4173` by default).

## An important limitation, found by testing it

The plan assumed the scaffolded `.claude/agents/*.md` files would become available as subagents I could invoke directly from the parent session (which is rooted at the repo root, one level up from here). I tested this directly — `Agent({ subagent_type: "playwright-test-generator" })` — and it failed: `Agent type 'playwright-test-generator' not found`. Claude Code discovers project agents from the **project root's** `.claude/agents/`, not from an arbitrary subdirectory's. Since `regression/` is nested inside this repo rather than being its own project root, these agents are invisible to the session working in the parent directory.

**What this means concretely:** the 6 test files in `tests/` were authored directly by me (Claude), not by a live invocation of `playwright-test-generator`. Functionally they're what Generator would have produced — each guards one confirmed `FOUND` fault from `comparison/reports/2026-09-04T15-13-37-624Z-comparison-report.md`, asserting the *correct* expected behavior — but they weren't generated through the MCP-driven `browser_click`/`browser_navigate`/`generator_write_test` tool loop the agent definition describes.

**To get the real, live agent loop:** open a separate Claude Code session with `regression/` itself as the working directory/project root (`cd regression && claude`). From there, `playwright-test-planner`, `playwright-test-generator`, and `playwright-test-healer` will be available as normal project subagents, backed by the `playwright-test` MCP server declared in `.mcp.json`.

## Tests included

| File | Guards against | Verdict in the reference run |
|---|---|---|
| `familiarity-logo-links-home.spec.ts` | `F-01` — header logo not linked home on `account.html` | FOUND |
| `world-price-formatting.spec.ts` | `W-01` — prices rendered with 3 decimal places | FOUND |
| `history-copyright-year.spec.ts` | `H-01` — copyright year hardcoded to 2019 everywhere but Home | FOUND |
| `image-product-photos-load.spec.ts` | `I-03` — one broken product image (real 404) | FOUND |
| `user-expectations-cancel-does-not-save.spec.ts` | `U-01` — Cancel button actually saves | FOUND |
| `claims-consistent-customer-count.spec.ts` | `CL-01` — contradictory customer-count claims (Home vs About) | FOUND |

Each asserts the **correct** behavior, not the bug — so they're expected to fail red against the still-buggy `test-app/`, which is the point: they're what should protect against these regressions once fixed.

## Running it

```bash
npm install
npx playwright install chromium   # only needed once
# in another terminal: start the test app (npm run app:start from the repo root)
npm test
```

## The Healer demonstration

`tests/familiarity-logo-links-home.spec.ts` locates the logo via `header a:has(img)`. To demonstrate Healer's actual job — repairing a drifted selector without changing test *intent* — deliberately rename `.logo-link` in `test-app/public/css/main.css` (or restructure the header markup) so that locator stops matching, breaking the test for a reason unrelated to the app's actual behavior. A live Healer session (run from inside `regression/`, per above) would detect the selector no longer resolves, inspect the current DOM, and patch the locator — leaving the assertion itself untouched. Not run in this session, for the same reason Generator wasn't: no live subagent available from the parent working directory.
