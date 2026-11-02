import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { runClaude } from "./claude";

const PROMPT_URL = new URL("../prompts/banner.md", import.meta.url);
const BASELINE_URL = new URL("../fixtures/baseline.json", import.meta.url);

interface Baseline {
  promptHash: string;
  outputs: string[];
}

export function hashPrompt(template: string): string {
  return createHash("sha256").update(template).digest("hex");
}

// Pulls the file out of the model's reply: the first code block, or the whole reply.
export function extractCode(reply: string): string {
  const block = reply.match(/```[a-z]*\n([\s\S]*?)```/i);
  return (block ? block[1] : reply).trim() + "\n";
}

// Asks Claude Code to write Banner.jsx from prompts/banner.md and returns the source.
// `run` only matters in replay mode, where it picks which recorded output to return.
export async function generateBanner(run = 0): Promise<string> {
  const template = await readFile(PROMPT_URL, "utf8");

  if (process.env.EVAL_MODE === "replay") {
    const baseline: Baseline = JSON.parse(await readFile(BASELINE_URL, "utf8"));
    if (hashPrompt(template) !== baseline.promptHash) {
      throw new Error(
        "Replay mode only has recorded outputs for the original prompt. " +
          "You've changed prompts/banner.md, so this needs live Claude Code (unset EVAL_MODE).",
      );
    }
    return baseline.outputs[run % baseline.outputs.length];
  }

  return extractCode(await runClaude(template));
}
