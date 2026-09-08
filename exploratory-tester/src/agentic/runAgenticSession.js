// EXPERIMENTAL — the "agentic browsing" architecture option explicitly NOT
// chosen as the default (see README.md's architecture-decision note). This
// module exists to empirically test that road not taken: how many of the
// still-missed faults can a live, MCP-driven browsing agent catch, and at
// what cost/reliability, compared to the static-artifact-review pipeline.
// Kept fully separate from scan.js / reviewOrchestrator.js on purpose.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WINDOWS_GIT_BASH_CANDIDATES = [
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  "C:\\Users\\" + (process.env.USERNAME || "") + "\\AppData\\Local\\Programs\\Git\\usr\\bin\\bash.exe",
];
function resolveGitBashPath() {
  if (process.env.CLAUDE_CODE_GIT_BASH_PATH) return process.env.CLAUDE_CODE_GIT_BASH_PATH;
  for (const candidate of WINDOWS_GIT_BASH_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Default areas to explore, deliberately phrased around checklist-style
// activities (not fault IDs) — the agent must never be told what's actually
// wrong. Shaped around WidgetWorks specifically; a site with different pages
// should pass --tasks-file pointing at its own {id, description}[] JSON
// instead of relying on this fallback (see config.js's tasksFile).
const DEFAULT_TASKS = [
  {
    id: "home-and-about",
    description:
      "Explore the Home page and the About page. Read all visible marketing claims, statistics, and historical/founding claims closely — check whether the numbers and dates make sense and are internally consistent within and across the two pages. Look closely at the logo and any images on both pages for visual quality issues (distortion, wrong proportions, broken images).",
  },
  {
    id: "catalog-interactions",
    description:
      "On the Catalog page: open the sort control and try each of its options, noting the resulting order each time. Type a real search term into the search box and see what happens to the results. Try the pagination controls (Next/Previous) and see whether the visible items actually change. Look closely at the product card images and hover states for visual consistency issues. Try the 'Download catalog (PDF)' control and report exactly what happens when you click it.",
  },
  {
    id: "create-widget-edge-cases",
    description:
      "Go to the 'Add widget' / new item form. Create a widget using at least one unusual or boundary value for the price field (for example a negative number). Observe and report exactly what happens — is it accepted, rejected with a specific error, or does nothing visible happen? Try to verify afterward whether the new widget actually appears in the catalog.",
  },
  {
    id: "edit-widget-twice",
    description:
      "Open an existing widget's edit page. Change a field and save. Then change a different field and save again. After each save, check carefully for any confirmation that the save succeeded, and check whether any 'last updated' or similar timestamp/metadata on the page actually changes between the two saves.",
  },
  {
    id: "account-and-contact",
    description:
      "Review the Account settings page and the Contact page (including its FAQ content). Try submitting the contact form with real values. Compare what the FAQ and contact page claim will happen against what actually visibly happens when you interact with the form and its controls.",
  },
  {
    id: "delete-widget",
    description:
      "Open an existing widget's edit page and find the delete/remove control. Read any confirmation text carefully BEFORE confirming — quote it exactly in your findings. Confirm the deletion, then verify afterward (by reloading fresh) whether the item is actually gone.",
  },
];

function buildMcpConfig(baseUrl) {
  const origin = new URL(baseUrl).origin;
  return JSON.stringify({
    mcpServers: {
      playwright: {
        command: "npx",
        args: ["@playwright/mcp@0.0.80", "--headless", "--isolated", "--allowed-origins", origin],
      },
    },
  });
}

async function runOneTask({ task, baseUrl, promptTemplate, schema, model, maxBudgetUsd }) {
  const prompt = promptTemplate
    .replace("{{CHARTER}}", runOneTask.charter)
    .replace("{{APP_DESCRIPTION}}", runOneTask.appDescription)
    .replace("{{CHECKLIST}}", runOneTask.checklist)
    .replace("{{BASE_URL}}", baseUrl)
    .replace("{{TASK_DESCRIPTION}}", task.description);

  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", JSON.stringify(schema),
    "--tools", "",
    "--strict-mcp-config", "--mcp-config", buildMcpConfig(baseUrl),
    "--permission-mode", "bypassPermissions",
    "--no-session-persistence",
    "--model", model,
    "--max-budget-usd", String(maxBudgetUsd),
  ];

  const env = { ...process.env };
  if (process.platform === "win32") {
    const gitBash = resolveGitBashPath();
    if (gitBash) env.CLAUDE_CODE_GIT_BASH_PATH = gitBash;
  }

  const startedAt = Date.now();
  return new Promise((resolve) => {
    const child = spawn("claude", args, { env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      resolve({ task: task.id, ok: false, error: String(err.message || err), wallClockMs: Date.now() - startedAt });
    });
    child.on("close", (code) => {
      const wallClockMs = Date.now() - startedAt;
      if (code !== 0) {
        resolve({ task: task.id, ok: false, error: `exited ${code}: ${stderr.slice(0, 1000)}`, wallClockMs });
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({
          task: task.id,
          ok: !parsed.is_error,
          structured: parsed.structured_output || null,
          rawResultText: parsed.result || null,
          costUsd: parsed.total_cost_usd ?? null,
          numTurns: parsed.num_turns ?? null,
          durationMs: parsed.duration_ms ?? null,
          wallClockMs,
        });
      } catch (err) {
        resolve({ task: task.id, ok: false, error: `unparseable output: ${err.message}`, wallClockMs, rawStdout: stdout.slice(0, 2000) });
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export async function runAgenticExperiment(config) {
  const promptTemplate = fs.readFileSync(path.join(__dirname, "prompts/agenticTask.md"), "utf-8");
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "schemas/agenticTask.schema.json"), "utf-8"));

  const tasks = config.tasksFile
    ? JSON.parse(fs.readFileSync(config.tasksFile, "utf-8"))
    : DEFAULT_TASKS;

  runOneTask.charter = fs.readFileSync(config.charterPath, "utf-8");
  runOneTask.appDescription = fs.readFileSync(config.appDescPath, "utf-8");
  runOneTask.checklist = fs.readFileSync(config.checklistPath, "utf-8");

  const results = [];
  for (const task of tasks) {
    console.log(`[agentic] task: ${task.id} ...`);
    // eslint-disable-next-line no-await-in-loop
    const result = await runOneTask({
      task,
      baseUrl: config.baseUrl,
      promptTemplate,
      schema,
      model: config.model,
      maxBudgetUsd: config.maxBudgetUsd,
    });
    console.log(
      `[agentic]   -> ok=${result.ok} cost=$${result.costUsd ?? "?"} turns=${result.numTurns ?? "?"} wallClock=${(result.wallClockMs / 1000).toFixed(1)}s`
    );
    results.push(result);
  }

  const runDir = path.join(__dirname, "..", "..", "runs", config.runId);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "agentic-results.json"), JSON.stringify(results, null, 2));

  const totalCostUsd = results.reduce((s, r) => s + (r.costUsd || 0), 0);
  const totalWallClockMs = results.reduce((s, r) => s + (r.wallClockMs || 0), 0);
  const successCount = results.filter((r) => r.ok && r.structured).length;

  fs.writeFileSync(
    path.join(runDir, "meta.json"),
    JSON.stringify(
      {
        runId: config.runId,
        baseUrl: config.baseUrl,
        goldenUrl: new URL(config.goldenPath, config.baseUrl + "/").toString(),
        mode: "agentic-mcp-browsing",
        checklistPath: config.checklistPath,
        charterPath: config.charterPath,
        appDescPath: config.appDescPath,
        startedAt: new Date().toISOString(),
        totalCostUsd,
        totalWallClockMs,
        tasksRun: tasks.length,
        tasksSucceeded: successCount,
      },
      null,
      2
    )
  );

  const sessionNotesPath = path.join(runDir, "session-notes.md");
  fs.writeFileSync(sessionNotesPath, renderSessionNotes(config, results, { totalCostUsd, totalWallClockMs, successCount, tasksRun: tasks.length }));

  console.log(`[agentic] done. ${successCount}/${tasks.length} tasks completed successfully. Total cost: $${totalCostUsd.toFixed(2)}. Total wall clock: ${(totalWallClockMs / 1000).toFixed(0)}s.`);
  console.log(`[agentic] session notes: ${sessionNotesPath}`);
  return { runDir, results, totalCostUsd, totalWallClockMs, successCount };
}

function renderSessionNotes(config, results, totals) {
  let md = `# Exploratory Test Session Notes — Agentic MCP Browsing (EXPERIMENTAL)\n\n`;
  md += `**Tester:** live \`claude -p\` session driving real Playwright MCP browser tools (model: ${config.model}), one call per task area — not the default static-artifact-review pipeline.\n`;
  md += `**Target:** ${config.baseUrl}\n`;
  md += `**Tasks run:** ${totals.tasksRun}, succeeded: ${totals.successCount}\n`;
  md += `**Total cost:** $${totals.totalCostUsd.toFixed(2)}  \n**Total wall-clock time:** ${(totals.totalWallClockMs / 1000).toFixed(0)}s\n\n`;

  md += `## Findings\n\n`;
  for (const r of results) {
    md += `### Task: ${r.task}\n\n`;
    if (!r.ok || !r.structured) {
      md += `**FAILED / no structured output.** ${r.error || "unknown reason"}\n\n`;
      if (r.rawResultText) md += `Raw model output: ${r.rawResultText.slice(0, 800)}\n\n`;
      continue;
    }
    const s = r.structured;
    md += `- **Area explored:** ${s.areaExplored}\n`;
    md += `- **Actions performed:** ${(s.actionsPerformed || []).join("; ")}\n`;
    md += `- **Tool reliability notes:** ${s.toolReliabilityNotes}\n`;
    md += `- **Cost:** $${(r.costUsd || 0).toFixed(3)}, turns: ${r.numTurns}, wall clock: ${(r.wallClockMs / 1000).toFixed(1)}s\n\n`;
    for (const f of s.findings || []) {
      md += `- **[${f.severity}, confidence: ${f.confidence}]** ${f.observation} _(source: ai-agentic)_\n`;
      md += `  - Heuristics: ${(f.heuristics || []).join(", ")}\n`;
      if (f.evidenceNote) md += `  - Evidence: ${f.evidenceNote}\n`;
    }
    md += "\n";
  }

  md += `## Session Metadata\n\n`;
  md += `- Run ID: ${config.runId}\n`;
  md += `- Mode: agentic-mcp-browsing (experimental)\n`;
  return md;
}
