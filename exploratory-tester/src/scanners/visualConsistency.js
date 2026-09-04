const COLOR_DISTANCE_THRESHOLD = 12;
const ASPECT_RATIO_TOLERANCE = 0.05;

function parseRgb(str) {
  const m = /rgba?\(([^)]+)\)/.exec(str || "");
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  return { r: parts[0], g: parts[1], b: parts[2] };
}

function colorDistance(a, b) {
  if (!a || !b) return null;
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export async function extractVisualFacts(page) {
  return page.evaluate(() => {
    function computedOf(selector, prop) {
      const el = document.querySelector(selector);
      if (!el) return null;
      return getComputedStyle(el)[prop];
    }

    const logoImg = document.querySelector("header img");
    let logo = null;
    if (logoImg) {
      const rect = logoImg.getBoundingClientRect();
      logo = {
        src: logoImg.getAttribute("src"),
        width: rect.width,
        height: rect.height,
        aspectRatio: rect.height > 0 ? rect.width / rect.height : null,
        hasLinkWrapper: logoImg.closest("a") !== null,
      };
    }

    const primaryBtn = document.querySelector(".btn-primary");
    const primaryButton = primaryBtn
      ? {
          text: primaryBtn.textContent.trim(),
          backgroundColor: getComputedStyle(primaryBtn).backgroundColor,
          borderRadius: getComputedStyle(primaryBtn).borderRadius,
        }
      : null;

    return {
      logo,
      primaryButton,
      bodyFontFamily: computedOf("body", "fontFamily"),
      // Deliberately a structural check (does the page declare the web font
      // dependency at all), not document.fonts.check() — that API also matches
      // against locally-installed system fonts and async load timing, which made
      // it an unreliable signal for "did this page forget to import the font."
      hasInterFontLink: !!document.querySelector('link[href*="fonts.googleapis.com"][href*="Inter" i]'),
      hasFaviconLink: !!document.querySelector('link[rel="icon"]'),
    };
  });
}

export function compareToGolden(pageFacts, goldenFacts) {
  const deviations = [];

  if (pageFacts.logo && goldenFacts.logo) {
    if (!pageFacts.logo.hasLinkWrapper && goldenFacts.logo.hasLinkWrapper) {
      deviations.push({
        type: "logo-not-linked",
        heuristics: ["Familiarity"],
        description: "Header logo is not wrapped in a link, unlike the golden reference page.",
      });
    }
    if (
      pageFacts.logo.aspectRatio &&
      goldenFacts.logo.aspectRatio &&
      Math.abs(pageFacts.logo.aspectRatio - goldenFacts.logo.aspectRatio) / goldenFacts.logo.aspectRatio >
        ASPECT_RATIO_TOLERANCE
    ) {
      deviations.push({
        type: "logo-aspect-ratio",
        heuristics: ["Image"],
        description: `Logo aspect ratio (${pageFacts.logo.aspectRatio.toFixed(2)}) deviates from the golden reference (${goldenFacts.logo.aspectRatio.toFixed(2)}) — likely stretched or squashed.`,
      });
    }
  }

  if (pageFacts.primaryButton && goldenFacts.primaryButton) {
    const dist = colorDistance(parseRgb(pageFacts.primaryButton.backgroundColor), parseRgb(goldenFacts.primaryButton.backgroundColor));
    if (dist !== null && dist > COLOR_DISTANCE_THRESHOLD) {
      deviations.push({
        type: "primary-button-color-drift",
        heuristics: ["Comparable Products"],
        description: `Primary button background (${pageFacts.primaryButton.backgroundColor}) differs from the golden reference's primary color (${goldenFacts.primaryButton.backgroundColor}), distance=${dist.toFixed(1)}.`,
      });
    }
    if (pageFacts.primaryButton.borderRadius !== goldenFacts.primaryButton.borderRadius) {
      deviations.push({
        type: "primary-button-radius-drift",
        heuristics: ["Comparable Products"],
        description: `Primary/submit button border-radius (${pageFacts.primaryButton.borderRadius}) differs from the golden reference (${goldenFacts.primaryButton.borderRadius}).`,
      });
    }
  }

  if (goldenFacts.hasInterFontLink === true && pageFacts.hasInterFontLink === false) {
    deviations.push({
      type: "webfont-not-imported",
      heuristics: ["Comparable Products"],
      description: "This page does not import the brand typeface (Inter) via the Google Fonts link the golden reference page uses — text is likely rendering in a fallback system font instead.",
    });
  }

  if (goldenFacts.hasFaviconLink === true && pageFacts.hasFaviconLink === false) {
    deviations.push({
      type: "missing-favicon",
      heuristics: ["Image"],
      description: "This page has no favicon link, unlike the golden reference page.",
    });
  }

  return deviations;
}
