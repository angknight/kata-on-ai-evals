import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function runOnce(prompt: string): Promise<string> {
  const cwd = await mkdtemp(join(tmpdir(), "kata-claude-"));
  try {
    return await new Promise<string>((resolve, reject) => {
      const child = spawn(
        "claude",
        [
          "-p",
          "--model", "haiku",
          "--no-session-persistence",
          "--tools", "",
          "--disable-slash-commands",
          "--strict-mcp-config",
          "--setting-sources", "project",
        ],
        { cwd, stdio: ["pipe", "pipe", "pipe"] },
      );
      let out = "";
      let err = "";
      child.stdout.on("data", (d) => (out += d));
      child.stderr.on("data", (d) => (err += d));
      child.on("error", (e) =>
        reject(new Error(`Could not start the "claude" CLI: ${e.message}`)),
      );
      child.on("close", (code) =>
        code === 0
          ? resolve(out.trim())
          : reject(
              new Error(`claude exited with ${code}: ${(err || out).trim().slice(0, 500)}`),
            ),
      );
      child.stdin.end(prompt);
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

// Runs one prompt through headless Claude Code and returns the text.
// It runs from an empty temp directory with tools off so this repo's CLAUDE.md
// (the kata coach) and your local settings can't leak into the feature's output.
// The prompt goes in on stdin, never on the command line.
// One retry, because a headless call occasionally fails transiently.
export async function runClaude(prompt: string): Promise<string> {
  try {
    return await runOnce(prompt);
  } catch {
    return runOnce(prompt);
  }
}
