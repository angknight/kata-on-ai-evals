import { contrastRatio, parseColor, type RGB } from "../src/color";
import type { BannerCase } from "../src/types";

// Return { pass, reason } to score a rendered banner.
// Return null when a scorer is turned off: the runner skips it and says so.
export type ScoreResult = { pass: boolean; reason: string } | null;

export interface Scorer {
  name: string;
  score: (testCase: BannerCase, html: string) => ScoreResult;
}

export interface Criterion {
  enabled: boolean;
  minRatio?: number;
}
export type Criteria = Record<string, Criterion>;

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const NA: ScoreResult = { pass: true, reason: "not relevant to this case" };

// What a person would read: the HTML without its tags.
function visibleText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

// Every CSS declaration in the markup's inline styles, later ones winning.
function declarations(html: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, style] of html.matchAll(/style="([^"]*)"/g)) {
    for (const part of style.split(";")) {
      const i = part.indexOf(":");
      if (i > 0) found.set(part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim());
    }
  }
  return found;
}

function renderedBackground(html: string): string | undefined {
  const d = declarations(html);
  return d.get("background-color") ?? d.get("background");
}

function renderedTextColor(html: string): string | undefined {
  return declarations(html).get("color");
}

const rendersText: Scorer = {
  name: "rendersText",
  score: (c, html) => {
    if (c.expectEmpty || !c.text) return NA;
    return visibleText(html).includes(c.text)
      ? { pass: true, reason: "shows the text" }
      : { pass: false, reason: `text ${JSON.stringify(c.text)} is not shown` };
  },
};

const appliesBackground: Scorer = {
  name: "appliesBackground",
  score: (c, html) => {
    if (c.expectEmpty || !c.backgroundColor) return NA;
    const want = parseColor(c.backgroundColor);
    const got = renderedBackground(html);
    const gotRgb = got ? parseColor(got) : null;
    return want && gotRgb && want.join() === gotRgb.join()
      ? { pass: true, reason: "background applied" }
      : { pass: false, reason: `wanted background ${c.backgroundColor}, got ${got ?? "none"}` };
  },
};

const defaultsToWhite: Scorer = {
  name: "defaultsToWhite",
  score: (c, html) => {
    if (c.expectEmpty || c.backgroundColor) return NA;
    const got = renderedBackground(html);
    const rgb = got ? parseColor(got) : null;
    return rgb && rgb.join() === WHITE.join()
      ? { pass: true, reason: "white by default" }
      : { pass: false, reason: `expected a white default, got ${got ?? "no background"}` };
  },
};

const rendersNothingWhenEmpty: Scorer = {
  name: "rendersNothingWhenEmpty",
  score: (c, html) => {
    if (!c.expectEmpty) return NA;
    const shown = visibleText(html);
    return shown === ""
      ? { pass: true, reason: "nothing visible" }
      : { pass: false, reason: `rendered ${JSON.stringify(shown)} for empty text` };
  },
};

function readableText(minRatio: number): Scorer {
  return {
    name: "readableText",
    score: (c, html) => {
      if (c.expectEmpty) return NA;
      const bgCss = renderedBackground(html);
      const bg = bgCss ? parseColor(bgCss) : WHITE; // no background means the white page
      if (!bg) return { pass: false, reason: `can't read background ${bgCss}` };
      const fgCss = renderedTextColor(html);
      const fg = fgCss ? parseColor(fgCss) : BLACK; // no color means the browser's black
      if (!fg) return { pass: false, reason: `can't read text color ${fgCss}` };
      const ratio = contrastRatio(fg, bg);
      const detail = `text ${fgCss ?? "default black"} on ${bgCss ?? "white"} is ${ratio.toFixed(2)}:1`;
      return ratio >= minRatio
        ? { pass: true, reason: detail }
        : { pass: false, reason: `${detail}, needs ${minRatio}:1` };
    },
  };
}

export function buildScorers(criteria: Criteria): Scorer[] {
  const wrap = (scorer: Scorer): Scorer => {
    const setting = criteria[scorer.name];
    if (!setting || typeof setting.enabled !== "boolean") {
      throw new Error(`evals/criteria.json needs "${scorer.name}": { "enabled": true or false }`);
    }
    return setting.enabled ? scorer : { name: scorer.name, score: () => null };
  };

  const ratio = criteria.readableText?.minRatio;
  if (criteria.readableText?.enabled && (typeof ratio !== "number" || ratio < 1 || ratio > 21)) {
    throw new Error(
      'evals/criteria.json: replace the 0 in readableText "minRatio" with 3, 4.5 or 7 (any number from 1 to 21 works)',
    );
  }

  return [rendersText, appliesBackground, defaultsToWhite, rendersNothingWhenEmpty, readableText(ratio ?? 0)].map(wrap);
}
