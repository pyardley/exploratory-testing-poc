import fs from "node:fs";
import path from "node:path";

const FORBIDDEN_PATH_SEGMENTS = ["answer-key", "fault-catalog"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

/**
 * Every configured input path is resolved to its realpath and checked against
 * the answer-key isolation rule before anything else runs. This is deliberately
 * redundant with the fact that exploratory-tester/ never imports from answer-key/ —
 * it's a runtime assertion, not the only guard, so a future config typo can't
 * quietly leak the fault list into a tester run. See README "Answer-key isolation".
 */
function assertNotAnswerKeyPath(label, filePath) {
  if (!filePath || typeof filePath !== "string") return;
  const resolved = path.resolve(filePath).replace(/\\/g, "/").toLowerCase();
  for (const segment of FORBIDDEN_PATH_SEGMENTS) {
    if (resolved.includes(`/${segment}`)) {
      throw new Error(
        `Refusing to run: --${label} ("${filePath}") resolves to a path containing "${segment}", ` +
          `which looks like the answer key. exploratory-tester must never read fault-catalog data.`
      );
    }
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`--${label} path does not exist: ${filePath}`);
  }
}

export function loadConfig(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  const required = ["url", "checklist", "charter", "app-desc"];
  const missing = required.filter((k) => !args[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required arguments: ${missing.map((m) => `--${m}`).join(", ")}\n` +
        `Usage: node bin/cli.js --url <baseUrl> --checklist <path.md> --charter <path.md> --app-desc <path.md> [--golden-path /] [--run-id <id>] [--model sonnet]`
    );
  }

  assertNotAnswerKeyPath("checklist", args.checklist);
  assertNotAnswerKeyPath("charter", args.charter);
  assertNotAnswerKeyPath("app-desc", args["app-desc"]);

  const runId = args["run-id"] || new Date().toISOString().replace(/[:.]/g, "-");

  return {
    baseUrl: String(args.url).replace(/\/$/, ""),
    checklistPath: path.resolve(args.checklist),
    charterPath: path.resolve(args.charter),
    appDescPath: path.resolve(args["app-desc"]),
    goldenPath: args["golden-path"] || "/",
    runId,
    model: args.model || "sonnet",
    maxBudgetUsd: args["max-budget-usd"] || "0.50",
    skipAi: Boolean(args["skip-ai"]),
    readOnly: Boolean(args["read-only"]),
  };
}
