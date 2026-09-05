// One-off helper: Sauce Demo requires login before there's anything to explore,
// and exploratory-tester doesn't do login flows itself (see --storage-state in
// README.md). Run this once to (re)generate storage-state.json, then point the
// tool at https://www.saucedemo.com/inventory.html with that file.
//
// Usage: node login.mjs [username]   (default: problem_user)
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const username = process.argv[2] || "problem_user";

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto("https://www.saucedemo.com/", { waitUntil: "networkidle" });
await page.fill("#user-name", username);
await page.fill("#password", "secret_sauce");
await page.click("#login-button");
await page.waitForURL("**/inventory.html", { timeout: 10000 });

const outPath = path.join(__dirname, "storage-state.json");
await context.storageState({ path: outPath });
console.log(`Logged in as ${username}, storage state saved to ${outPath}`);

await browser.close();
