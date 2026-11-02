import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BannerProps } from "./types";

// Generated code is written here so it can import "react" from this repo's node_modules.
const DIR = new URL("../.eval-tmp/", import.meta.url);

const loaded = new Map<string, Promise<ComponentType<BannerProps>>>();

// Each distinct source is written and imported once. Concurrent callers share the same load,
// so one never reads the file while another is still writing it.
export function loadBanner(source: string): Promise<ComponentType<BannerProps>> {
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 12);
  let pending = loaded.get(hash);
  if (!pending) {
    pending = (async () => {
      await mkdir(DIR, { recursive: true });
      const file = new URL(`Banner-${hash}.jsx`, DIR);
      await writeFile(file, source);
      const mod = await import(file.href);
      const component = mod.default ?? mod.Banner;
      if (typeof component !== "function") {
        throw new Error("the file has no default export that is a component");
      }
      return component;
    })();
    loaded.set(hash, pending);
  }
  return pending;
}

// Renders a Banner's source with the given props to an HTML string.
export async function renderBanner(source: string, props: BannerProps): Promise<string> {
  const Banner = await loadBanner(source);
  return renderToStaticMarkup(createElement(Banner, props));
}
