export async function extractNav(page) {
  return page.evaluate(() => {
    const nav = document.querySelector(".main-nav") || document.querySelector("nav");
    if (!nav) return null;
    return Array.from(nav.querySelectorAll("a")).map((a) => ({
      label: a.textContent.trim(),
      href: a.getAttribute("href"),
    }));
  });
}

export function compareNavToGolden(pageNav, goldenNav) {
  const deviations = [];
  if (!pageNav || !goldenNav) return deviations;

  const pageLabels = pageNav.map((i) => i.label);
  const goldenLabels = goldenNav.map((i) => i.label);

  if (JSON.stringify(pageLabels) !== JSON.stringify(goldenLabels)) {
    deviations.push({
      type: "nav-mismatch",
      description: `Navigation items/order (${JSON.stringify(pageLabels)}) differ from the golden reference (${JSON.stringify(goldenLabels)}).`,
    });
  }

  return deviations;
}
