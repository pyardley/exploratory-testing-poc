import fs from "node:fs";
import path from "node:path";

const HEURISTICS = [
  "Familiarity",
  "Explainability",
  "World",
  "History",
  "Image",
  "Comparable Products",
  "Claims",
  "User Expectations",
  "Purpose",
  "Statutes/Standards",
];

const CRUD_HEURISTICS = ["CRUD-Create", "CRUD-Read", "CRUD-Update", "CRUD-Delete"];

function severityBadge(sev) {
  return { high: "🔴 high", medium: "🟠 medium", low: "🟡 low" }[sev] || sev || "";
}

function renderFinding(f, pageUrl) {
  const lines = [];
  const sourceTag = f.source ? ` _(source: ${f.source})_` : "";
  lines.push(`- **[${severityBadge(f.severity)}${f.confidence ? `, confidence: ${f.confidence}` : ""}]** ${f.observation}${sourceTag}`);
  if (pageUrl) lines.push(`  - Page: ${pageUrl}`);
  if (f.pagesInvolved) lines.push(`  - Pages: ${f.pagesInvolved.join(", ")}`);
  if (f.evidenceRefs && f.evidenceRefs.length) lines.push(`  - Evidence: ${f.evidenceRefs.join(", ")}`);
  if (f.questionOrRisk) lines.push(`  - Open question/risk: ${f.questionOrRisk}`);
  return lines.join("\n");
}

function collectDeterministicFindings(pageSummaries) {
  const items = [];
  for (const page of pageSummaries) {
    if (page.navError) {
      items.push({ page: page.url, heuristics: ["Purpose"], severity: "high", confidence: "high", observation: `Page failed to load cleanly: ${page.navError}` });
    }
    for (const v of page.accessibilityViolations || []) {
      items.push({
        page: page.url,
        heuristics: ["Statutes/Standards"],
        severity: v.impact === "critical" || v.impact === "serious" ? "high" : "medium",
        confidence: "high",
        observation: `Accessibility: ${v.help} (${v.id}, impact: ${v.impact})`,
      });
    }
    for (const d of page.visualDeviationsFromGolden || []) {
      items.push({ page: page.url, heuristics: d.heuristics || ["Familiarity"], severity: "medium", confidence: "high", observation: d.description });
    }
    for (const d of page.navDeviationsFromGolden || []) {
      items.push({ page: page.url, heuristics: ["Familiarity"], severity: "medium", confidence: "high", observation: d.description });
    }
    if (page.consoleErrorCount > 0) {
      items.push({ page: page.url, heuristics: ["Explainability"], severity: "medium", confidence: "high", observation: `${page.consoleErrorCount} console error(s) logged during page load/interaction.` });
    }
    if (page.badResponseCount > 0) {
      items.push({ page: page.url, heuristics: ["Purpose"], severity: "medium", confidence: "high", observation: `${page.badResponseCount} network response(s) with a 4xx/5xx status.` });
    }
    const fv = page.formValidationFindings;
    if (fv && fv.forms) {
      for (const form of fv.forms) {
        if (form.networkRequestFiredOnEmptySubmit) {
          items.push({ page: page.url, heuristics: ["User Expectations", "Statutes/Standards", "CRUD-Create"], severity: "medium", confidence: "medium", observation: `Form "${form.formId}" fired a network request even when submitted empty — client-side validation may be missing or incomplete.` });
        }
        if (form.sameErrorTextAcrossScenarios) {
          items.push({
            page: page.url,
            heuristics: ["Explainability"],
            severity: "medium",
            confidence: "high",
            observation: `Form "${form.formId}" shows the identical error text ("${form.errorTextOnEmptySubmit}") whether submitted completely empty or submitted with a non-numeric value in "${form.numericFieldProbed}" — the message doesn't identify which field or which problem actually caused it.`,
          });
        }
      }
      for (const cb of fv.cancelButtonProbes || []) {
        if (cb.triggeredNetworkRequest) {
          items.push({ page: page.url, heuristics: ["User Expectations"], severity: "high", confidence: "medium", observation: `A button labeled "${cb.label}" triggered a network request when clicked — a Cancel-like control that appears to save/submit instead of discarding.` });
        }
      }
    }

    const ip = page.interactionProbeFindings;
    if (ip) {
      for (const control of ip.directionalControls || []) {
        if (control.directionClaimMismatch) {
          const m = control.directionClaimMismatch;
          items.push({
            page: page.url,
            heuristics: ["User Expectations"],
            severity: "high",
            confidence: "high",
            observation: `Selecting "${m.label}" (a "${m.claimedDirection === "asc" ? "low to high / ascending" : "high to low / descending"}" option) produced values that are NOT actually in that order: ${JSON.stringify(m.observedValues)}.`,
          });
        } else if (control.allSelectionsProducedIdenticalContent && (control.optionsProbed || []).length >= 2) {
          items.push({
            page: page.url,
            heuristics: ["Purpose"],
            severity: "medium",
            confidence: "medium",
            observation: `Control "${control.controlId}" has ${control.optionsProbed.length} options (${control.optionsProbed.join(", ")}) but selecting any of them produces identical page content — the control appears to do nothing.`,
          });
        } else if ((control.someSelectionsProducedNoChange || []).length > 0) {
          items.push({
            page: page.url,
            heuristics: ["Purpose"],
            severity: "medium",
            confidence: "medium",
            observation: `Control "${control.controlId}": selecting ${JSON.stringify(control.someSelectionsProducedNoChange)} produced no visible change, while other options on the same control did change the page.`,
          });
        }
      }
      for (const s of ip.searchProbes || []) {
        if (s.contentChangedAtAll === false) {
          items.push({ page: page.url, heuristics: ["Purpose"], severity: "high", confidence: "high", observation: `Typing a query into search input "${s.inputId}" and pressing Enter produced no change to the page — the search control appears to be wired to nothing.` });
        }
      }
      for (const p of ip.paginationProbes || []) {
        if (p.control === "next" && !p.contentChanged && !p.statusChanged) {
          items.push({ page: page.url, heuristics: ["Purpose", "CRUD-Read"], severity: "high", confidence: "high", observation: `Clicking "Next" (status showed "${p.statusBefore}", implying more than one page) produced no change to the page content or page-status text — pagination appears to be non-functional, making most of the list unreachable.` });
        }
      }
      for (const cb of ip.checkboxRoundTrip || []) {
        if (cb.persistedCorrectly === false) {
          items.push({
            page: page.url,
            heuristics: ["User Expectations", "CRUD-Update"],
            severity: "high",
            confidence: "high",
            observation: `Checkbox "${cb.checkboxId}" was set to ${cb.toggledTo} and the form saved, but after a fresh page load it reads back as ${cb.afterReload} — the saved value does not match what was submitted (possibly inverted or not persisted at all).`,
          });
        }
      }
    }
  }
  return items.map((item) => ({ ...item, source: "deterministic" }));
}

/**
 * The CRUD smoke flow's step data previously only appeared as a raw JSON dump
 * (see renderCrudSection below) — genuinely useful evidence, but never turned
 * into a tagged finding that "Findings by Heuristic" / "CRUD Findings" or the
 * comparison adjudicator would see as a first-class result. This extracts the
 * headline signals from each step type into the same finding shape everything
 * else uses.
 */
function collectCrudSmokeFindings(crudSmoke, listPageUrl) {
  if (!crudSmoke) return [];
  const items = [];
  const byStep = (name) => crudSmoke.steps.find((s) => s.step === name);

  const readAfterCreate = byStep("read-after-create");
  if (readAfterCreate && readAfterCreate.foundOnListPage === false) {
    items.push({
      page: listPageUrl,
      heuristics: ["CRUD-Create", "Claims"],
      severity: "high",
      confidence: "high",
      observation: `Creating a new record via the UI completed without any visible error, but the new record never actually appears on the list page afterward — the create action silently does not persist.`,
    });
  }

  for (const step of crudSmoke.steps.filter((s) => s.step.startsWith("update-") && !s.step.includes("race"))) {
    if (step.skipped) continue;
    if (step.intendedItemReflectsUpdate === false) {
      items.push({
        page: step.itemUrl,
        heuristics: ["CRUD-Update"],
        severity: "medium",
        confidence: "medium",
        observation: `Editing and saving this record does not result in the change being visible afterward — the update does not appear to persist for this record.`,
      });
    }
    if (step.otherRecordsThatChangedUnexpectedly?.length) {
      items.push({
        page: step.itemUrl,
        heuristics: ["CRUD-Update"],
        severity: "high",
        confidence: "high",
        observation: `Editing this record changed a DIFFERENT record instead/as well: ${JSON.stringify(step.otherRecordsThatChangedUnexpectedly)}. This is a strong signal of an index-vs-id mismatch in how updates are applied.`,
      });
    }
  }

  const raceStep = byStep("update-double-submit-race");
  if (raceStep && raceStep.saveButtonDisabledAfterFirstClick === false && (raceStep.mutatingRequestsFiredFromTwoRapidClicks || 0) >= 2) {
    items.push({
      page: raceStep.editUrl,
      heuristics: ["CRUD-Update"],
      severity: "medium",
      confidence: "high",
      observation: `The Save button is not disabled while a save is in flight — two rapid clicks fired ${raceStep.mutatingRequestsFiredFromTwoRapidClicks} separate mutating requests, risking a lost update on a slow network or an impatient double-click.`,
    });
  }

  const deleteStep = byStep("delete");
  if (deleteStep && deleteStep.stillVisibleInSameSessionAfterDelete === true) {
    items.push({
      page: listPageUrl,
      heuristics: ["CRUD-Delete"],
      severity: "medium",
      confidence: "high",
      observation: `After deleting a record, it still appears on the list page within the same browser session until a hard refresh — the list view is using stale cached data that isn't invalidated on delete.`,
    });
  }
  if (deleteStep && deleteStep.confirmDialogMessage) {
    items.push({
      page: deleteStep.deleteEditUrl,
      heuristics: ["CRUD-Delete", "Claims"],
      severity: "low",
      confidence: "low",
      observation: `Delete confirmation dialog text: "${deleteStep.confirmDialogMessage}" — worth checking this claim (e.g. about recoverability) against what deletion actually does server-side.`,
    });
  }

  const page2Step = byStep("read-beyond-page-1");
  if (page2Step?.attempted && !page2Step.reached) {
    items.push({
      page: listPageUrl,
      heuristics: ["CRUD-Read", "Purpose"],
      severity: "high",
      confidence: "high",
      observation: `A "Next"-like pagination control exists but clicking it produced no change to the page — content beyond the first page is unreachable through the UI, and could not be explored this session as a result.`,
    });
  }

  return items.map((item) => ({ ...item, source: "deterministic" }));
}

function renderCrudSection(crudSmoke) {
  if (!crudSmoke) return "_CRUD smoke flow was skipped for this session (--read-only)._\n";
  const lines = [];
  for (const step of crudSmoke.steps) {
    lines.push(`### ${step.step}`);
    if (step.skipped) {
      lines.push(`- Skipped: ${step.reason}`);
    } else {
      for (const [k, v] of Object.entries(step)) {
        if (k === "step") continue;
        lines.push(`- ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
      }
    }
    lines.push("");
  }
  if (crudSmoke.dialogMessages && crudSmoke.dialogMessages.length) {
    lines.push(`**Confirmation dialog text captured during the session:**`);
    for (const m of crudSmoke.dialogMessages) lines.push(`- "${m}"`);
  }
  return lines.join("\n");
}

export function writeSessionNotes(config, scanOutput, aiOutput) {
  const { pageSummaries, summary, crudSmokeResult, runDir } = scanOutput;
  const deterministicFindings = [
    ...collectDeterministicFindings(pageSummaries),
    ...collectCrudSmokeFindings(crudSmokeResult, summary.baseUrl),
  ];
  const perPageFindings = aiOutput?.perPageFindings || [];
  const synthesis = aiOutput?.synthesis || { overallSummary: "", crossPageFindings: [], prioritizedIssues: [] };

  const byHeuristic = new Map(HEURISTICS.map((h) => [h, []]));
  const byCrud = new Map(CRUD_HEURISTICS.map((h) => [h, []]));

  for (const item of deterministicFindings) {
    for (const h of item.heuristics) {
      if (byHeuristic.has(h)) byHeuristic.get(h).push(item);
      if (byCrud.has(h)) byCrud.get(h).push(item);
    }
  }
  for (const pageResult of perPageFindings) {
    for (const f of pageResult.findings || []) {
      for (const h of f.heuristics || []) {
        const tagged = { ...f, page: pageResult.page, source: "ai" };
        if (byHeuristic.has(h)) byHeuristic.get(h).push(tagged);
        if (byCrud.has(h)) byCrud.get(h).push(tagged);
      }
    }
  }

  let md = `# Exploratory Test Session Notes\n\n`;
  md += `**Charter:** [${path.basename(config.charterPath)}](${config.charterPath})  \n`;
  md += `**Tester:** exploratory-tester (deterministic scanners + \`claude -p\` static-artifact review, model: ${config.model})  \n`;
  md += `**Target:** ${config.baseUrl}  \n`;
  md += `**Golden reference:** ${summary.goldenUrl}  \n`;
  md += `**Session date/time:** ${summary.scannedAt}  \n`;
  md += `**Pages covered:** ${summary.pagesScanned}\n\n`;

  md += `## Session Summary\n\n${synthesis.overallSummary || "_No AI synthesis available for this run._"}\n\n`;

  if (synthesis.prioritizedIssues && synthesis.prioritizedIssues.length) {
    md += `### Prioritized issues\n\n`;
    for (const issue of synthesis.prioritizedIssues) md += `1. ${issue}\n`;
    md += "\n";
  }

  if (synthesis.crossPageFindings && synthesis.crossPageFindings.length) {
    md += `### Cross-page findings\n\n`;
    for (const f of synthesis.crossPageFindings) md += `${renderFinding({ ...f, source: "ai" })}\n`;
    md += "\n";
  }

  md += `## Findings by Heuristic\n\n`;
  for (const heuristic of HEURISTICS) {
    const items = byHeuristic.get(heuristic);
    md += `### ${heuristic}\n\n`;
    if (!items.length) {
      md += `_No findings recorded under this heuristic._\n\n`;
      continue;
    }
    for (const item of items) md += `${renderFinding(item, item.page)}\n`;
    md += "\n";
  }

  md += `## CRUD Findings\n\n`;
  for (const heuristic of CRUD_HEURISTICS) {
    const items = byCrud.get(heuristic);
    md += `### ${heuristic.replace("CRUD-", "")}\n\n`;
    if (!items.length) {
      md += `_No findings recorded under this heuristic._\n\n`;
      continue;
    }
    for (const item of items) md += `${renderFinding(item, item.page)}\n`;
    md += "\n";
  }
  md += `### CRUD smoke flow detail\n\n${renderCrudSection(crudSmokeResult)}\n\n`;

  md += `## Deterministic Scan Summary\n\n`;
  md += `- Pages scanned: ${summary.pagesScanned}\n`;
  md += `- Broken links: ${summary.totalBrokenLinks}\n`;
  md += `- Broken assets: ${summary.totalBrokenAssets}\n`;
  md += `- Console errors (total): ${summary.totalConsoleErrors}\n`;
  md += `- Accessibility violations (total): ${summary.totalAccessibilityViolations}\n`;
  md += `- Visual deviations from golden reference (total): ${summary.totalVisualDeviations}\n`;
  md += `- CRUD smoke flow ran: ${summary.crudSmokeRan}\n\n`;

  const allOpenQuestions = perPageFindings.flatMap((p) => (p.openQuestions || []).map((q) => `${p.page}: ${q}`));
  md += `## Open Questions\n\n`;
  if (allOpenQuestions.length) {
    for (const q of allOpenQuestions) md += `- ${q}\n`;
  } else {
    md += `_None recorded._\n`;
  }
  md += "\n";

  md += `## Session Metadata\n\n`;
  md += `- Run ID: ${config.runId}\n`;
  md += `- Evidence directory: ${runDir}\n`;
  md += `- AI findings: ${path.join(runDir, "ai-findings")}\n`;

  const notesPath = path.join(runDir, "session-notes.md");
  fs.writeFileSync(notesPath, md, "utf-8");
  return notesPath;
}
