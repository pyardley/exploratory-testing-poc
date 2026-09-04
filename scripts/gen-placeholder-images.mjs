// One-off generator for placeholder product SVGs used by the seed catalog.
// Run once during setup: node scripts/gen-placeholder-images.mjs
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seedPath = path.join(root, "test-app/server/data/seed.json");
const outDir = path.join(root, "test-app/public/img/widgets");

const categoryColors = {
  Fasteners: "#8C6E4A",
  Seals: "#4A7C8C",
  Measuring: "#5A4A8C",
  Rigging: "#8C4A5E",
  Hardware: "#4A8C5C",
  Tools: "#8C7A4A",
};

const seed = JSON.parse(readFileSync(seedPath, "utf-8"));

for (const widget of seed.widgets) {
  if (!widget.imageUrl.startsWith("/img/widgets/")) continue; // skip the intentionally-missing one
  const color = categoryColors[widget.category] || "#6B7280";
  const initials = widget.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
  <rect width="300" height="200" fill="${color}"/>
  <text x="150" y="112" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF" text-anchor="middle">${initials}</text>
</svg>
`;
  const fileName = path.basename(widget.imageUrl);
  writeFileSync(path.join(outDir, fileName), svg, "utf-8");
}

console.log(`Generated ${seed.widgets.filter((w) => w.imageUrl.startsWith("/img/widgets/")).length} placeholder images in ${outDir}`);
