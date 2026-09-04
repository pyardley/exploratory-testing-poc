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
 * Headless `claude -p` call, restricted to Read-only, no MCP servers, scoped to
 * a single --add-dir. This is the mechanism that structurally enforces "static
 * artifact review, not live agentic browsing": the model can only Read files
 * already captured on disk, nothing else.
 *
 * The prompt is piped over stdin rather than passed as a `-p <prompt>` CLI
 * argument — a per-page prompt with an inlined manifest is small enough to work
 * either way, but the cross-page synthesis prompt embeds every per-page result
 * and reliably exceeded the Windows CreateProcess command-line length limit
 * when passed as an argument ("The command line is too long"). Stdin has no
 * such ceiling and works uniformly for prompts of any size.
 */
export async function callClaude({ prompt, jsonSchema, addDir, cwd, model = "sonnet", maxBudgetUsd = "0.50" }) {
  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", JSON.stringify(jsonSchema),
    "--tools", "Read",
    "--disallowedTools", "Bash,WebFetch,WebSearch,Write,Edit",
    "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}',
    "--add-dir", addDir,
    "--no-session-persistence",
    "--model", model,
    "--max-budget-usd", String(maxBudgetUsd),
  ];

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
