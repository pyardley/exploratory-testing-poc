import AxeBuilder from "@axe-core/playwright";

export async function runAccessibilityScan(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      description: v.description,
      tags: v.tags,
      nodes: v.nodes.map((n) => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })),
    })),
    passes: results.passes.length,
  };
}
