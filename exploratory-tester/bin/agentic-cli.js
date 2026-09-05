#!/usr/bin/env node
// EXPERIMENTAL entry point for the agentic MCP-browsing mode. Separate from
// bin/cli.js (the default static-artifact-review pipeline) on purpose.
import { loadConfig } from "../src/config.js";
import { runAgenticExperiment } from "../src/agentic/runAgenticSession.js";

async function main() {
  const config = loadConfig();
  console.log(`[agentic-cli] run ${config.runId} against ${config.baseUrl}`);
  await runAgenticExperiment(config);
}

main().catch((err) => {
  console.error("[agentic-cli] fatal error:", err);
  process.exitCode = 1;
});
