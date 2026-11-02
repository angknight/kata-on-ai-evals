import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { renderBanner } from "./render";
import type { BannerCase } from "./types";

// Renders src/Banner.jsx for each eval input into preview.html, like eyeballing a page.
const source = await readFile(new URL("./Banner.jsx", import.meta.url), "utf8");
const cases: BannerCase[] = JSON.parse(
  await readFile(new URL("../evals/cases.json", import.meta.url), "utf8"),
);

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const rows = await Promise.all(
  cases.map(async ({ id, expectEmpty, ...props }) => {
    const html = await renderBanner(source, props);
    const shown = html || "<em>(nothing rendered)</em>";
    const label = escape(`text=${JSON.stringify(props.text)} backgroundColor=${JSON.stringify(props.backgroundColor)}`);
    return `<section><h3>Test input: ${escape(id)}</h3><code>Props passed in: ${label}</code><div class="slot">${shown}</div></section>`;
  }),
);

const page = `<!doctype html><meta charset="utf-8"><title>Banner preview</title>
<style>
  body { font: 14px system-ui; margin: 2rem; max-width: 720px; background: #f4f4f4 }
  section { margin-bottom: 1.5rem } h3 { margin: 0 0 .25rem } code { color: #555 }
  .intro { background: #fff; border: 1px solid #ddd; padding: .5rem 1rem; margin-bottom: 2rem }
  .slot { margin-top: .5rem; min-height: 2rem; background: repeating-linear-gradient(45deg,#fff,#fff 8px,#eee 8px,#eee 16px) }
</style>
<h1>Banner preview</h1>
<div class="intro">
  <p><strong>Why are there so many different banners?</strong> They are all the <em>same</em> component,
  the <code>Banner</code> Claude just wrote into <code>src/Banner.jsx</code>. Each one is that Banner
  shown with a different <strong>test input</strong>: a different <code>text</code> and
  <code>backgroundColor</code>, listed under each heading. The looks differ because the inputs differ.</p>
  <p>These are the same ${cases.length} inputs the eval uses (<code>evals/cases.json</code>). A real page
  could be given any color, so the Banner has to cope with all of them.</p>
  <p><strong>What to look for:</strong> can you read the text on each one?</p>
</div>${rows.join("")}`;

const out = fileURLToPath(new URL("../preview.html", import.meta.url));
await writeFile(out, page);
console.log(`Wrote ${out}`);

const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open";
execFile(opener, [out], (err) => {
  if (err) console.log("Open that file in your browser to see the banners.");
});
