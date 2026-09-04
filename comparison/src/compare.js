import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAdjudication } from "./adjudicate.js";
import { buildReport } from "./report.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args["run-dir"];
  if (!runDir) {
    throw new Error("Usage: node src/compare.js --run-dir <path to exploratory-tester/runs/<runId>>");
  }
  const faultCatalogPath = args["fault-catalog"] || path.resolve(__dirname, "../../answer-key/fault-catalog.json");

  const meta = JSON.parse(fs.readFileSync(path.join(runDir, "meta.json"), "utf-8"));

  console.log(`[compare] adjudicating run ${meta.runId} against ${faultCatalogPath} ...`);
  const { faultCatalog, adjudication } = await runAdjudication({
    faultCatalogPath,
    runDir,
    model: args.model || "opus",
    maxBudgetUsd: args["max-budget-usd"] || "1.00",
  });

  const md = buildReport({ faultCatalog, adjudication, runInfo: meta });

  const reportsDir = path.resolve(__dirname, "../reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `${new Date().toISOString().replace(/[:.]/g, "-")}-comparison-report.md`);
  fs.writeFileSync(reportPath, md, "utf-8");

  fs.writeFileSync(path.join(reportsDir, "latest-adjudication.json"), JSON.stringify(adjudication, null, 2));

  console.log(`[compare] report written to ${reportPath}`);
}

main().catch((err) => {
  console.error("[compare] fatal error:", err);
  process.exitCode = 1;
});
