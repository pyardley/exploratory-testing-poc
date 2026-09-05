// Orchestrates the whole pipeline end-to-end from a clean checkout: reset the
// test app's data, start it, run exploratory-tester against it, then score
// the result with comparison/. Mirrors the manual steps in README.md "Running
// it" — this just automates them for a one-command demo.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.BASE_URL || "http://localhost:4173";
const runId = process.env.RUN_ID || `demo-${new Date().toISOString().replace(/[:.]/g, "-")}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...opts });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(300);
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function main() {
  const dbPath = path.join(root, "test-app/server/data/db.json");
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath);

  console.log("[demo] starting test app ...");
  const server = spawn("node", ["server/index.js"], { cwd: path.join(root, "test-app"), stdio: "inherit" });
  server.on("error", (err) => {
    console.error("[demo] test app failed to start:", err);
    process.exit(1);
  });

  try {
    await waitForServer(baseUrl);
    console.log(`[demo] test app is up at ${baseUrl}`);

    console.log(`[demo] running exploratory-tester (run id: ${runId}) ...`);
    await run(
      "node",
      [
        "bin/cli.js",
        "--url", baseUrl,
        "--checklist", "../checklist/few-hiccupss-crud-checklist.md",
        "--charter", "../charter/exploratory-charter.md",
        "--app-desc", "../app-spec/test-app-description.md",
        "--golden-path", "/index.html",
        "--run-id", runId,
      ],
      { cwd: path.join(root, "exploratory-tester") }
    );

    console.log("[demo] scoring the run against the answer key ...");
    await run("node", ["src/compare.js", "--run-dir", path.join(root, "exploratory-tester/runs", runId)], {
      cwd: path.join(root, "comparison"),
    });

    console.log("[demo] done — see exploratory-tester/runs/" + runId + "/session-notes.md and comparison/reports/");
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error("[demo] fatal error:", err);
  process.exitCode = 1;
});
