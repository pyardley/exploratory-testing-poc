#!/usr/bin/env node
import { loadConfig } from "../src/config.js";
import { runScan } from "../src/scan.js";
import { runAiReview } from "../src/ai/reviewOrchestrator.js";
import { writeSessionNotes } from "../src/report/sessionNotesWriter.js";

async function main() {
  const config = loadConfig();
  console.log(`[cli] run ${config.runId} against ${config.baseUrl}`);

  const scanOutput = await runScan(config);

  let aiOutput = null;
  if (!config.skipAi) {
    aiOutput = await runAiReview(config, scanOutput);
  } else {
    console.log("[cli] --skip-ai set, skipping the AI review phase");
  }

  const notesPath = writeSessionNotes(config, scanOutput, aiOutput);
  console.log(`[cli] session notes written to ${notesPath}`);
}

main().catch((err) => {
  console.error("[cli] fatal error:", err);
  process.exitCode = 1;
});
