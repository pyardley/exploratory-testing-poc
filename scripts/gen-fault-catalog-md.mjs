// Renders answer-key/fault-catalog.md deterministically from fault-catalog.json,
// so the human-readable version can never drift from the structured source of truth.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const jsonPath = path.join(root, "answer-key/fault-catalog.json");
const mdPath = path.join(root, "answer-key/fault-catalog.md");

const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

const byCategory = new Map();
for (const fault of data.faults) {
  if (!byCategory.has(fault.category)) byCategory.set(fault.category, []);
  byCategory.get(fault.category).push(fault);
}

let out = `# ${data.appName} — Deliberate Fault Catalog (Answer Key)\n\n`;
out += `**This file is ground truth for grading the exploratory-tester tool. It must never be read by exploratory-tester/ — only \`comparison/\` may reference it, and only after a tester run already exists.**\n\n`;
out += `Golden reference page: \`${data.goldenPage}\`  \nTotal seeded faults: **${data.totalFaults}**\n\n---\n\n`;

for (const [category, faults] of byCategory) {
  out += `## ${category} (${faults.length})\n\n`;
  for (const f of faults) {
    out += `### ${f.id} — ${f.title}\n`;
    out += `- **Page(s):** ${f.page}\n`;
    out += `- **What it is:** ${f.description}\n`;
    out += `- **Technical detail:** ${f.technicalDetail}\n\n`;
  }
}

writeFileSync(mdPath, out, "utf-8");
console.log(`Wrote ${mdPath} (${data.faults.length} faults across ${byCategory.size} categories)`);
