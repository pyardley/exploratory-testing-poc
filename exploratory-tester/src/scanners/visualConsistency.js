const COLOR_DISTANCE_THRESHOLD = 12;
const ASPECT_RATIO_TOLERANCE = 0.05;
const SPACING_TOLERANCE_PX = 2;

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

function parsePx(str) {
  const n = parseFloat(str || "");
  return Number.isNaN(n) ? null : n;
}

function maxAbsDiffPx(a, b) {
  // Compares two CSS shorthand strings (e.g. padding "8px 16px") side by side,
  // token by token, and returns the largest single-side difference in px.
  if (!a || !b) return null;
  const av = a.split(/\s+/).map(parsePx);
  const bv = b.split(/\s+/).map(parsePx);
  if (av.some((v) => v === null) || bv.some((v) => v === null) || av.length !== bv.length) return null;
  return Math.max(...av.map((v, i) => Math.abs(v - bv[i])));
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
          padding: getComputedStyle(primaryBtn).padding,
        }
      : null;

    const container = document.querySelector(".container");
    const containerPadding = container ? getComputedStyle(container).paddingLeft : null;

    const formField = document.querySelector(".form-field");
    const formFieldSpacing = formField ? getComputedStyle(formField).marginBottom : null;

    return {
      logo,
      primaryButton,
      containerPadding,
      formFieldSpacing,
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
    const btnPaddingDiff = maxAbsDiffPx(pageFacts.primaryButton.padding, goldenFacts.primaryButton.padding);
    if (btnPaddingDiff !== null && btnPaddingDiff > SPACING_TOLERANCE_PX) {
      deviations.push({
        type: "primary-button-padding-drift",
        heuristics: ["Comparable Products"],
        description: `Primary/submit button padding (${pageFacts.primaryButton.padding}) differs from the golden reference (${goldenFacts.primaryButton.padding}) by up to ${btnPaddingDiff.toFixed(1)}px.`,
      });
    }
  }

  const containerDiff = Math.abs((parsePx(pageFacts.containerPadding) ?? NaN) - (parsePx(goldenFacts.containerPadding) ?? NaN));
  if (!Number.isNaN(containerDiff) && containerDiff > SPACING_TOLERANCE_PX) {
    deviations.push({
      type: "container-padding-drift",
      heuristics: ["Comparable Products", "Image"],
      description: `Page container horizontal padding (${pageFacts.containerPadding}) differs from the golden reference (${goldenFacts.containerPadding}) by ${containerDiff.toFixed(1)}px — layout rhythm doesn't match.`,
    });
  }

  const formFieldDiff = Math.abs((parsePx(pageFacts.formFieldSpacing) ?? NaN) - (parsePx(goldenFacts.formFieldSpacing) ?? NaN));
  if (!Number.isNaN(formFieldDiff) && formFieldDiff > SPACING_TOLERANCE_PX) {
    deviations.push({
      type: "form-field-spacing-drift",
      heuristics: ["Comparable Products"],
      description: `Spacing between form fields (${pageFacts.formFieldSpacing}) differs from the golden reference's form spacing (${goldenFacts.formFieldSpacing}) by ${formFieldDiff.toFixed(1)}px.`,
    });
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
