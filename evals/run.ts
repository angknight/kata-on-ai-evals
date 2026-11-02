import { mkdir, readFile, writeFile } from "node:fs/promises";
import { generateBanner } from "../src/generateBanner";
import { renderBanner } from "../src/render";
import type { BannerCase } from "../src/types";
import { buildScorers, type Criteria } from "./scorers";

// Usage: npm run eval [-- --runs 3] [-- --min 0.9]
//   --runs  how many times Claude writes the Banner from scratch (default 3)
//   --min   exit with code 1 if the overall score is below this (e.g. 0.9)
function flag(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  const value = i === -1 ? fallback : Number(process.argv[i + 1]);
  if (Number.isNaN(value)) throw new Error(`--${name} needs a number`);
  return value;
}

const RUNS = flag("runs", 3);
const MIN = flag("min", 0);
const CONCURRENCY = 3;

const readJson = async (name: string) =>
  JSON.parse(await readFile(new URL(name, import.meta.url), "utf8"));
const cases: BannerCase[] = await readJson("./cases.json");
let scorers: ReturnType<typeof buildScorers>;
try {
  scorers = buildScorers((await readJson("./criteria.json")) as Criteria);
} catch (e) {
  console.error(`\n${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
}

interface RunResult {
  caseId: string;
  failures: string[];
  failedScorers: string[];
}

const results: RunResult[] = [];
const off = new Set<string>(); // scorers that returned null, i.e. turned off

async function evaluateRun(run: number) {
  let source: string;
  try {
    source = await generateBanner(run);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    for (const c of cases) {
      results.push({ caseId: c.id, failures: [`generate: ${message.slice(0, 120)}`], failedScorers: ["generate"] });
    }
    return;
  }
  for (const c of cases) {
    const { id, expectEmpty, ...props } = c;
    let html: string;
    try {
      html = await renderBanner(source, props);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({ caseId: id, failures: [`render: ${message.slice(0, 120)}`], failedScorers: ["render"] });
      continue;
    }
    const failures: string[] = [];
    const failedScorers: string[] = [];
    for (const scorer of scorers) {
      const result = scorer.score(c, html);
      if (!result) off.add(scorer.name);
      if (result && !result.pass) {
        failures.push(`${scorer.name}: ${result.reason}`);
        failedScorers.push(scorer.name);
      }
    }
    results.push({ caseId: id, failures, failedScorers });
  }
}

const queue = Array.from({ length: RUNS }, (_, i) => i);
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let run = queue.shift(); run !== undefined; run = queue.shift()) await evaluateRun(run);
  }),
);

const active = scorers.filter((s) => !off.has(s.name));
const skipped = scorers.filter((s) => off.has(s.name));

console.log(`\nEval: ${cases.length} inputs x ${RUNS} runs (each run = Claude writes a fresh Banner)\n`);
for (const c of cases) {
  const runs = results.filter((r) => r.caseId === c.id);
  const passed = runs.filter((r) => r.failures.length === 0).length;
  const firstFailure = runs.find((r) => r.failures.length > 0)?.failures[0] ?? "";
  console.log(`${c.id.padEnd(14)} ${`${passed}/${runs.length}`.padEnd(5)} ${firstFailure}`);
}

const total = results.length;
const passedTotal = results.filter((r) => r.failures.length === 0).length;
const score = passedTotal / total;
console.log(`\nScore: ${passedTotal}/${total} (${Math.round(score * 100)}%)`);
console.log(`\nBy criterion (checks that passed):`);
for (const s of active) {
  const failed = results.filter((r) => r.failedScorers.includes(s.name)).length;
  console.log(`  ${s.name.padEnd(24)} ${total - failed}/${total}`);
}
for (const name of ["generate", "render"]) {
  const failed = results.filter((r) => r.failedScorers.includes(name)).length;
  if (failed) console.log(`  ${name.padEnd(24)} ${failed} failed (the Banner didn't get that far)`);
}
if (skipped.length) {
  console.log(`Criteria turned off in evals/criteria.json: ${skipped.map((s) => s.name).join(", ")}`);
}

// Compare each input's pass rate with the previous run, and save this one for next time.
// Rates, not counts, so a 3-run eval and a 5-run eval can be compared.
const SAVED = new URL("../.eval-results/last.json", import.meta.url);
interface Saved {
  runs: number;
  rates: Record<string, number>;
}
const rates = Object.fromEntries(
  cases.map((c) => {
    const runs = results.filter((r) => r.caseId === c.id);
    return [c.id, runs.filter((r) => r.failures.length === 0).length / runs.length];
  }),
);
const before: Saved | null = await readFile(SAVED, "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => null);
const percent = (rate: number) => `${Math.round(rate * 100)}%`;
if (!before?.rates) {
  console.log("\nFirst run saved. Run it again and this will list what changed.");
} else {
  const changed = cases.filter(
    (c) => before.rates[c.id] !== undefined && Math.abs(before.rates[c.id] - rates[c.id]) > 0.001,
  );
  console.log(`\nChanged since the last run (${before.runs} runs before, ${RUNS} now):`);
  if (changed.length === 0) console.log("  no input changed");
  for (const c of changed) {
    console.log(`  ${c.id.padEnd(14)} ${percent(before.rates[c.id])} -> ${percent(rates[c.id])}`);
  }
}
await mkdir(new URL("../.eval-results/", import.meta.url), { recursive: true });
await writeFile(SAVED, JSON.stringify({ runs: RUNS, rates } satisfies Saved, null, 2) + "\n");

if (score < MIN) {
  console.log(`\nBelow the --min threshold of ${MIN}. Exiting 1.`);
  process.exit(1);
}
