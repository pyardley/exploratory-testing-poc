function pct(n, d) {
  if (d === 0) return "n/a";
  return `${((n / d) * 100).toFixed(0)}%`;
}

export function buildReport({ faultCatalog, adjudication, runInfo }) {
  const verdicts = adjudication.verdicts || [];
  const byId = new Map(verdicts.map((v) => [v.faultId, v]));

  const found = verdicts.filter((v) => v.verdict === "FOUND").length;
  const partial = verdicts.filter((v) => v.verdict === "PARTIALLY_FOUND").length;
  const missed = verdicts.filter((v) => v.verdict === "MISSED").length;
  const total = faultCatalog.faults.length;
  const falsePositives = adjudication.falsePositives || [];
  const genuineFalsePositives = falsePositives.filter((f) => !f.isRealButUnseededDefect);
  const bonusFindings = falsePositives.filter((f) => f.isRealButUnseededDefect);

  const byCategory = new Map();
  for (const fault of faultCatalog.faults) {
    if (!byCategory.has(fault.category)) byCategory.set(fault.category, []);
    byCategory.get(fault.category).push(fault);
  }

  let md = `# Exploratory Tester Effectiveness — Comparison Report\n\n`;
  md += `**Target run:** ${runInfo.runId}  \n**Base URL:** ${runInfo.baseUrl}  \n**Generated:** ${new Date().toISOString()}\n\n`;

  md += `## Scorecard\n\n`;
  md += `| Metric | Count | % of ${total} faults |\n|---|---|---|\n`;
  md += `| Found | ${found} | ${pct(found, total)} |\n`;
  md += `| Partially found | ${partial} | ${pct(partial, total)} |\n`;
  md += `| Missed | ${missed} | ${pct(missed, total)} |\n\n`;
  md += `Recall (found + 0.5×partial): **${pct(found + 0.5 * partial, total)}**\n\n`;
  md += `False positives (findings with no matching seeded fault): **${genuineFalsePositives.length}**  \n`;
  md += `Bonus findings (real defects not in the seeded catalog): **${bonusFindings.length}**\n\n`;

  md += `## By Heuristic Category\n\n`;
  md += `| Category | Found | Partial | Missed | Total |\n|---|---|---|---|---|\n`;
  for (const [category, faults] of byCategory) {
    const cFound = faults.filter((f) => byId.get(f.id)?.verdict === "FOUND").length;
    const cPartial = faults.filter((f) => byId.get(f.id)?.verdict === "PARTIALLY_FOUND").length;
    const cMissed = faults.filter((f) => byId.get(f.id)?.verdict === "MISSED").length;
    md += `| ${category} | ${cFound} | ${cPartial} | ${cMissed} | ${faults.length} |\n`;
  }
  md += "\n";

  md += `## Fault-by-Fault Detail\n\n`;
  for (const fault of faultCatalog.faults) {
    const v = byId.get(fault.id);
    const icon = { FOUND: "✅", PARTIALLY_FOUND: "🟡", MISSED: "❌" }[v?.verdict] || "❓";
    md += `### ${icon} ${fault.id} — ${fault.title} (${fault.category})\n`;
    md += `- **Page(s):** ${fault.page}\n`;
    md += `- **Verdict:** ${v?.verdict || "NOT ADJUDICATED"}\n`;
    if (v?.matchingFinding) md += `- **Matching finding:** ${v.matchingFinding}\n`;
    if (v?.detectionSource && v.detectionSource !== "n/a") md += `- **Detected via:** ${v.detectionSource}\n`;
    md += `- **Reasoning:** ${v?.reasoning || "n/a"}\n\n`;
  }

  md += `## False Positives\n\n`;
  if (genuineFalsePositives.length === 0) {
    md += `_None._\n\n`;
  } else {
    for (const fp of genuineFalsePositives) {
      md += `- **${fp.page || "?"}:** ${fp.findingText}\n  - ${fp.reasoning}\n`;
    }
    md += "\n";
  }

  if (bonusFindings.length) {
    md += `## Bonus Findings (real, not in the seeded catalog)\n\n`;
    for (const bf of bonusFindings) {
      md += `- **${bf.page || "?"}:** ${bf.findingText}\n  - ${bf.reasoning}\n`;
    }
    md += "\n";
  }

  const caughtVerdicts = verdicts.filter((v) => v.verdict === "FOUND" || v.verdict === "PARTIALLY_FOUND");
  const bySource = { deterministic: 0, ai: 0, both: 0, unclear: 0 };
  for (const v of caughtVerdicts) {
    if (bySource[v.detectionSource] !== undefined) bySource[v.detectionSource] += 1;
    else bySource.unclear += 1;
  }
  md += `## Deterministic-vs-AI Attribution\n\n`;
  md += `Of the ${caughtVerdicts.length} faults caught (found or partially found), the session notes' per-finding source tags attribute:\n\n`;
  md += `| Detected via | Count |\n|---|---|\n`;
  md += `| Deterministic scan alone | ${bySource.deterministic} |\n`;
  md += `| AI review alone | ${bySource.ai} |\n`;
  md += `| Both | ${bySource.both} |\n`;
  md += `| Unclear/not reported | ${bySource.unclear} |\n\n`;
  md += `This is the concrete evidence for whether the hybrid architecture (deterministic-first, AI for judgement calls) is pulling its weight, or whether one layer is doing essentially all the work.\n\n`;

  md += `## Methodology / Caveats\n\n`;
  md += `- Adjudication was performed by a single LLM call and carries real run-to-run variance — treat this scorecard as illustrative for one session, not as a precise, reproducible metric. Consider majority-vote over multiple adjudication runs before treating any specific percentage as authoritative.\n`;
  md += `- This is a single exploratory session against a fixed evidence snapshot, not exhaustive regression coverage.\n`;
  md += `- "False positive" here means a finding with no corresponding seeded fault; some may be genuine defects that simply weren't deliberately seeded (see Bonus Findings).\n`;

  return md;
}
