import { readFile, writeFile } from "node:fs/promises";
import { generateBanner, hashPrompt } from "../src/generateBanner";

// Facilitator tool: records live Claude output for the original prompt, for replay mode.
// Usage: npm run record [-- 6]
const count = Number(process.argv[2] ?? 6);
const prompt = await readFile(new URL("../prompts/banner.md", import.meta.url), "utf8");
const outputs = await Promise.all(Array.from({ length: count }, (_, i) => generateBanner(i)));
await writeFile(
  new URL("../fixtures/baseline.json", import.meta.url),
  JSON.stringify({ promptHash: hashPrompt(prompt), outputs }, null, 2) + "\n",
);
console.log(`Recorded ${count} outputs.`);
