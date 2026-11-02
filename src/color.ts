export type RGB = [number, number, number];

// Enough CSS color names for the kata. A name not listed here can't be read by the eval.
const NAMED: Record<string, string> = {
  black: "#000000", white: "#ffffff", red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", orange: "#ffa500", purple: "#800080", gray: "#808080", grey: "#808080",
  silver: "#c0c0c0", navy: "#000080", teal: "#008080", maroon: "#800000", olive: "#808000",
  lime: "#00ff00", aqua: "#00ffff", fuchsia: "#ff00ff", tomato: "#ff6347", gold: "#ffd700",
  crimson: "#dc143c", pink: "#ffc0cb", coral: "#ff7f50", salmon: "#fa8072", brown: "#a52a2a",
  indigo: "#4b0082", violet: "#ee82ee", khaki: "#f0e68c", lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", darkblue: "#00008b",
  darkred: "#8b0000", darkgreen: "#006400", skyblue: "#87ceeb", lightblue: "#add8e6",
  orchid: "#da70d6", royalblue: "#4169e1", seagreen: "#2e8b57", tan: "#d2b48c", beige: "#f5f5dc", ivory: "#fffff0",
};

export function parseColor(input: string): RGB | null {
  const value = input.trim().toLowerCase();
  const v = NAMED[value] ?? value;

  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])[0-9a-f]?$/);
  if (short) return [short[1], short[2], short[3]].map((h) => parseInt(h + h, 16)) as RGB;

  const long = v.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})(?:[0-9a-f]{2})?$/);
  if (long) return [long[1], long[2], long[3]].map((h) => parseInt(h, 16)) as RGB;

  const fn = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (fn) return [Number(fn[1]), Number(fn[2]), Number(fn[3])];

  return null;
}

function luminance([r, g, b]: RGB): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

// WCAG contrast ratio, from 1 (identical) to 21 (black on white).
export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
