import React from 'react';

const DEFAULT_BACKGROUND = '#ffffff';
const DARK_TEXT = '#000000';
const LIGHT_TEXT = '#ffffff';

// Parses #rgb, #rrggbb, rgb(), and rgba() colors into [r, g, b].
// Returns null for other formats (named colors, hsl(), etc.).
function parseColor(color) {
  if (typeof color !== 'string') return null;
  const value = color.trim().toLowerCase();

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) {
      digits = digits.split('').map((c) => c + c).join('');
    }
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
  }

  const rgb = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/);
  if (rgb) {
    return rgb.slice(1, 4).map(Number);
  }

  return null;
}

// WCAG relative luminance
function relativeLuminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// Picks black or white text, whichever has the higher contrast ratio.
// Unparseable colors fall back to dark text.
function getReadableTextColor(backgroundColor) {
  const rgb = parseColor(backgroundColor);
  if (!rgb) return DARK_TEXT;

  const luminance = relativeLuminance(rgb);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  return contrastWithBlack >= contrastWithWhite ? DARK_TEXT : LIGHT_TEXT;
}

export default function Banner({ text, backgroundColor }) {
  const message = typeof text === 'string' ? text.trim() : '';
  if (!message) return null;

  const background = backgroundColor || DEFAULT_BACKGROUND;

  const style = {
    backgroundColor: background,
    color: getReadableTextColor(background),
    padding: '12px 16px',
    textAlign: 'center',
    fontFamily: 'sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.4,
  };

  return <div style={style}>{text}</div>;
}
