import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { callClaude } from "./claudeClient.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readTemplate(name) {
  return fs.readFileSync(path.join(__dirname, "prompts", name), "utf-8");
}

function fill(template, replacements) {
  let out = template;
  for (const [key, value] of Object.entries(replacements)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

const pageFindingSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "schemas/pageFinding.schema.json"), "utf-8"));
const sessionSynthesisSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "schemas/sessionSynthesis.schema.json"), "utf-8"));

export async function runAiReview(config, scanOutput) {
  const { runDir, pageSummaries, summary, goldenVisualFacts } = scanOutput;

  const charter = fs.readFileSync(config.charterPath, "utf-8");
  const appDescription = fs.readFileSync(config.appDescPath, "utf-8");
  const checklist = fs.readFileSync(config.checklistPath, "utf-8");

  const systemFraming = fill(readTemplate("systemFraming.md"), {
    CHARTER: charter,
    APP_DESCRIPTION: appDescription,
    CHECKLIST: checklist,
  });

  const perPageTemplate = readTemplate("perPageReview.md");
  const perPageFindings = [];

  for (const page of pageSummaries) {
    console.log(`[ai] reviewing ${page.url} ...`);
    const prompt =
      systemFraming +
      "\n\n" +
      fill(perPageTemplate, {
        PAGE_URL: page.url,
        MANIFEST_JSON: JSON.stringify(page, null, 2),
        SCREENSHOT_PATH: page.evidenceFiles.screenshot,
        DOM_SNAPSHOT_PATH: page.evidenceFiles.domSnapshot,
        TEXT_CONTENT_PATH: page.evidenceFiles.textContent,
        GOLDEN_URL: scanOutput.summary.goldenUrl,
        GOLDEN_FACTS_JSON: JSON.stringify(goldenVisualFacts, null, 2),
        SCAFFOLDING_ACTIONS:
          page.scaffoldingActionsThisSession && page.scaffoldingActionsThisSession.length > 0
            ? page.scaffoldingActionsThisSession.map((a) => `- ${a}`).join("\n")
            : "(none)",
      });

    try {
      const result = await callClaude({
        prompt,
        jsonSchema: pageFindingSchema,
        addDir: runDir,
        cwd: runDir,
        model: config.model,
        maxBudgetUsd: config.maxBudgetUsd,
      });
      perPageFindings.push(result.structured_output);
    } catch (err) {
      console.error(`[ai] per-page review failed for ${page.url}:`, err.message);
      perPageFindings.push({ page: page.url, narrative: `AI review failed: ${err.message}`, findings: [], openQuestions: [] });
    }
  }

  console.log("[ai] running cross-page synthesis ...");
  let synthesis = { overallSummary: "", crossPageFindings: [], prioritizedIssues: [] };
  try {
    const synthesisPrompt =
      systemFraming +
      "\n\n" +
      fill(readTemplate("crossPageSynthesis.md"), {
        PER_PAGE_FINDINGS_JSON: JSON.stringify(perPageFindings, null, 2),
        SUMMARY_JSON: JSON.stringify(summary, null, 2),
      });
    const result = await callClaude({
      prompt: synthesisPrompt,
      jsonSchema: sessionSynthesisSchema,
      addDir: runDir,
      cwd: runDir,
      model: config.model,
      maxBudgetUsd: config.maxBudgetUsd,
    });
    synthesis = result.structured_output;
  } catch (err) {
    console.error("[ai] cross-page synthesis failed:", err.message);
    synthesis.overallSummary = `AI synthesis failed: ${err.message}`;
  }

  const aiFindingsDir = path.join(runDir, "ai-findings");
  fs.mkdirSync(aiFindingsDir, { recursive: true });
  fs.writeFileSync(path.join(aiFindingsDir, "per-page.json"), JSON.stringify(perPageFindings, null, 2));
  fs.writeFileSync(path.join(aiFindingsDir, "synthesis.json"), JSON.stringify(synthesis, null, 2));

  return { perPageFindings, synthesis };
}
