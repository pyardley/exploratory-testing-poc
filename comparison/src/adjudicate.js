import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callClaude } from "./claudeClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "adjudication.schema.json"), "utf-8"));

const PROMPT_TEMPLATE = `You are adjudicating the results of an exploratory testing session against a known, complete list of deliberately-seeded defects in a test application. This is the ONLY point in the whole pipeline where the tester's findings are compared against the answer key — the tester itself never saw this fault list.

For EVERY fault in the catalog below, decide:
- FOUND: a tester finding clearly identifies this specific fault (even if worded differently, or tagged under a different heuristic than you'd expect).
- PARTIALLY_FOUND: a tester finding touches the same page/area and symptom but doesn't fully capture the defect, or captures a symptom without identifying the actual cause.
- MISSED: nothing in the tester's findings corresponds to this fault.

Each finding in the session notes is tagged with where it came from, e.g. "(source: deterministic)" (a Playwright scanner — link/console/network checks, accessibility audit, visual-consistency diff, form-validation probe, or the CRUD smoke flow) or "(source: ai)" (the \`claude -p\` review of the evidence bundle). For every FOUND or PARTIALLY_FOUND verdict, report which source(s) actually produced the matching finding via detectionSource — this measures how much the deterministic layer alone is pulling weight vs. how much genuinely required AI judgement, so read the tag rather than guessing.

Then separately, list any tester findings that do NOT correspond to any fault in the catalog (false positives) — for each, judge whether it looks like a genuine defect that simply isn't in the seeded list (isRealButUnseededDefect: true) versus something that isn't a real problem at all (isRealButUnseededDefect: false). Be a fair, skeptical grader: don't credit a vague or unrelated finding just because it happens to mention the same page.

## Fault catalog (ground truth — {{FAULT_COUNT}} faults)

\`\`\`json
{{FAULT_CATALOG_JSON}}
\`\`\`

## Tester's session notes

\`\`\`markdown
{{SESSION_NOTES}}
\`\`\`

## Tester's structured findings (per-page)

\`\`\`json
{{PER_PAGE_FINDINGS_JSON}}
\`\`\`

## Tester's structured findings (cross-page synthesis)

\`\`\`json
{{SYNTHESIS_JSON}}
\`\`\`

Produce a verdict for every single fault ID in the catalog (do not skip any), plus the false-positives list.`;

export async function runAdjudication({ faultCatalogPath, runDir, model = "opus", maxBudgetUsd = "1.00" }) {
  const faultCatalog = JSON.parse(fs.readFileSync(faultCatalogPath, "utf-8"));
  const sessionNotes = fs.readFileSync(path.join(runDir, "session-notes.md"), "utf-8");
  const perPageFindingsPath = path.join(runDir, "ai-findings", "per-page.json");
  const synthesisPath = path.join(runDir, "ai-findings", "synthesis.json");
  const perPageFindings = fs.existsSync(perPageFindingsPath) ? fs.readFileSync(perPageFindingsPath, "utf-8") : "[]";
  const synthesis = fs.existsSync(synthesisPath) ? fs.readFileSync(synthesisPath, "utf-8") : "{}";

  const prompt = PROMPT_TEMPLATE.replace("{{FAULT_COUNT}}", String(faultCatalog.faults.length))
    .replace("{{FAULT_CATALOG_JSON}}", JSON.stringify(faultCatalog, null, 2))
    .replace("{{SESSION_NOTES}}", sessionNotes)
    .replace("{{PER_PAGE_FINDINGS_JSON}}", perPageFindings)
    .replace("{{SYNTHESIS_JSON}}", synthesis);

  const result = await callClaude({ prompt, jsonSchema: schema, model, maxBudgetUsd, tools: "" });
  return { faultCatalog, adjudication: result.structured_output };
}
