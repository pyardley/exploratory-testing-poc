/**
 * Pure evidence capture — no detection logic. Extracts visible text, with extra
 * emphasis on claim-prone regions (hero, badges, footer, headings), so the AI
 * review phase has raw material for Claims/Explainability/User-Expectations/
 * Purpose judgement calls that no scanner can make on its own.
 */
export async function extractContent(page) {
  return page.evaluate(() => {
    const bodyText = document.body.innerText.trim();
    const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((h) => h.textContent.trim());
    const badgeLike = Array.from(document.querySelectorAll('.badge, [class*="badge" i], [class*="claim" i]')).map((el) =>
      el.textContent.trim()
    );
    const footerText = document.querySelector("footer")?.textContent.trim() || null;
    return { bodyText, headings, badgeLike, footerText, title: document.title };
  });
}
