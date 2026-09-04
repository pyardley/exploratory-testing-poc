import spawn from "cross-spawn";
import fs from "node:fs";

const WINDOWS_GIT_BASH_CANDIDATES = [
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  "C:\\Users\\" + (process.env.USERNAME || "") + "\\AppData\\Local\\Programs\\Git\\usr\\bin\\bash.exe",
];

function resolveGitBashPath() {
  if (process.env.CLAUDE_CODE_GIT_BASH_PATH) return process.env.CLAUDE_CODE_GIT_BASH_PATH;
  for (const candidate of WINDOWS_GIT_BASH_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Same restricted-Read-only pattern as exploratory-tester/src/ai/claudeClient.js,
 * duplicated (not imported) so comparison/ has zero code dependency on
 * exploratory-tester/ — the two packages' only relationship is that comparison
 * reads exploratory-tester's OUTPUT files, never its code or the answer key's path.
 *
 * The prompt is piped over stdin, not passed as a `-p <prompt>` argument — the
 * adjudication prompt embeds the full fault catalog plus a whole tester run's
 * findings, which reliably exceeds the Windows command-line length limit as an
 * argument ("The command line is too long"). Stdin has no such ceiling.
 */
export async function callClaude({ prompt, jsonSchema, addDirs = [], cwd, model = "opus", maxBudgetUsd = "1.00", tools = "" }) {
  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", JSON.stringify(jsonSchema),
    "--tools", tools,
    "--disallowedTools", "Bash,WebFetch,WebSearch,Write,Edit",
    "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
    "--no-session-persistence",
    "--model", model,
    "--max-budget-usd", String(maxBudgetUsd),
  ];
  for (const dir of addDirs) {
    args.push("--add-dir", dir);
  }

  const env = { ...process.env };
  if (process.platform === "win32") {
    const gitBash = resolveGitBashPath();
    if (gitBash) env.CLAUDE_CODE_GIT_BASH_PATH = gitBash;
  }

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude -p exited ${code}: ${stderr.slice(0, 2000)}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.is_error) {
          reject(new Error(`claude -p reported an error: ${JSON.stringify(parsed).slice(0, 2000)}`));
          return;
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse claude -p output as JSON: ${err.message}\nRaw: ${stdout.slice(0, 2000)}`));
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}
