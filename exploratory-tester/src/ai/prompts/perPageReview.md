## Your task

Review the page **{{PAGE_URL}}** against the checklist and charter above.

The deterministic scanners have already established the following facts about this page. Treat these as already-confirmed evidence — your job is to add heuristic tagging, narrative, severity/confidence judgement, and independent findings a scanner cannot make (Familiarity, Explainability, Claims, User Expectations, Purpose, Comparable Products, Image are largely judgement calls; do not just restate the automated findings verbatim, though you may reference and build on them):

```json
{{MANIFEST_JSON}}
```

You may also directly inspect these evidence files for yourself using the Read tool (paths are relative to your working directory):
- Screenshot: `{{SCREENSHOT_PATH}}`
- DOM snapshot: `{{DOM_SNAPSHOT_PATH}}`
- Extracted visible text: `{{TEXT_CONTENT_PATH}}`

For visual/brand comparisons, here are the extracted facts from the golden reference page ({{GOLDEN_URL}}) for comparison — deterministic scanners already flagged numeric deviations from these in the manifest above, but you can use your own judgement on the screenshot for anything numeric extraction can't capture (spacing, overall polish, whether it "feels" consistent):

```json
{{GOLDEN_FACTS_JSON}}
```

Respond with findings tagged to one or more of the FEW HICCUPSS + CRUD heuristics. For each finding, judge severity and your confidence honestly — a plausible-but-uncertain observation is still worth recording with lower confidence, but do not invent problems that aren't supported by the evidence. If this page looks clean, say so — an empty or near-empty findings list is a legitimate, useful result.
