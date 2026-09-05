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

IMPORTANT — do not double-count: a finding you already credited toward a FOUND or PARTIALLY_FOUND verdict (i.e. it appears as someone's matchingFinding) must NEVER also appear in the false-positives list. The false-positives list is exclusively for findings that matched NO fault in the catalog at all. If a finding partially matches a fault, it belongs only in that fault's PARTIALLY_FOUND verdict — not also listed separately as a false positive because the match isn't perfect.

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
  return { faultCatalog, adjudication: dedupeFalsePositives(result.structured_output) };
}

const VERDICT_SCORE = { FOUND: 1, PARTIALLY_FOUND: 0.5, MISSED: 0 };

/**
 * Runs adjudication N times (in parallel — each is an independent LLM call)
 * and aggregates per-fault verdicts by mean score rather than strict majority,
 * so a 2-1 split still lands as PARTIALLY_FOUND rather than an arbitrary
 * tie-break. Exists because a single adjudication run has real variance —
 * see README.md Recommendations #5.
 */
export async function runMultipleAdjudications({ faultCatalogPath, runDir, model = "opus", maxBudgetUsd = "1.00", runs = 1 }) {
  const attempts = await Promise.all(
    Array.from({ length: runs }, () => runAdjudication({ faultCatalogPath, runDir, model, maxBudgetUsd }))
  );

  const faultCatalog = attempts[0].faultCatalog;
  const perFaultVerdicts = new Map(faultCatalog.faults.map((f) => [f.id, []]));
  for (const attempt of attempts) {
    for (const v of attempt.adjudication.verdicts || []) {
      if (perFaultVerdicts.has(v.faultId)) perFaultVerdicts.get(v.faultId).push(v);
    }
  }

  const aggregateVerdicts = faultCatalog.faults.map((fault) => {
    const votes = perFaultVerdicts.get(fault.id) || [];
    const scores = votes.map((v) => VERDICT_SCORE[v.verdict] ?? 0);
    const meanScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const aggregateVerdict = meanScore >= 0.75 ? "FOUND" : meanScore <= 0.25 ? "MISSED" : "PARTIALLY_FOUND";
    const modeCount = votes.filter((v) => v.verdict === aggregateVerdict).length;
    const distribution = votes.reduce((acc, v) => {
      acc[v.verdict] = (acc[v.verdict] || 0) + 1;
      return acc;
    }, {});
    return {
      faultId: fault.id,
      verdict: aggregateVerdict,
      meanScore,
      agreement: votes.length ? modeCount / votes.length : 0,
      distribution,
      matchingFinding: votes.find((v) => v.verdict === aggregateVerdict)?.matchingFinding || votes[0]?.matchingFinding,
      detectionSource: votes.find((v) => v.verdict === aggregateVerdict)?.detectionSource || "n/a",
      reasoning: `Aggregated over ${votes.length} adjudication run(s): ${JSON.stringify(distribution)}. ${votes[0]?.reasoning || ""}`,
    };
  });

  const falsePositivesUnion = dedupeTextList(attempts.flatMap((a) => a.adjudication.falsePositives || []));

  const recallScores = attempts.map((a) => {
    const found = (a.adjudication.verdicts || []).filter((v) => v.verdict === "FOUND").length;
    const partial = (a.adjudication.verdicts || []).filter((v) => v.verdict === "PARTIALLY_FOUND").length;
    return (found + 0.5 * partial) / faultCatalog.faults.length;
  });

  return {
    faultCatalog,
    runs,
    aggregateAdjudication: { verdicts: aggregateVerdicts, falsePositives: falsePositivesUnion },
    recallRange: { min: Math.min(...recallScores), max: Math.max(...recallScores), mean: recallScores.reduce((a, b) => a + b, 0) / recallScores.length },
    individualRuns: attempts.map((a) => a.adjudication),
  };
}

function dedupeTextList(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = (item.findingText || "").toLowerCase().trim().slice(0, 80);
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

/**
 * Belt-and-suspenders backstop for the "don't double-count" prompt instruction
 * above — a single LLM call won't always follow it perfectly. Drops any
 * false-positive entry whose text substantially overlaps a matchingFinding
 * already credited toward a FOUND/PARTIALLY_FOUND verdict.
 */
function dedupeFalsePositives(adjudication) {
  if (!adjudication?.falsePositives?.length || !adjudication?.verdicts?.length) return adjudication;

  const creditedTexts = adjudication.verdicts
    .filter((v) => v.verdict === "FOUND" || v.verdict === "PARTIALLY_FOUND")
    .map((v) => (v.matchingFinding || "").toLowerCase().trim())
    .filter((t) => t.length > 12); // skip short/empty strings that would over-match

  const overlaps = (a, b) => a.includes(b) || b.includes(a);

  const filtered = adjudication.falsePositives.filter((fp) => {
    const text = (fp.findingText || "").toLowerCase().trim();
    if (!text) return true;
    return !creditedTexts.some((credited) => overlaps(text, credited));
  });

  return { ...adjudication, falsePositives: filtered };
}
