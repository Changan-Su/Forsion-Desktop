/**
 * Color extraction service — extracts dominant colors from images via Canvas API.
 * No external dependencies.
 */

import type { Theme } from '../types';

// ── Types ──────────────────────────────────────────────

export interface ExtractedPalette {
  dominant: [number, number, number];
  vibrant: [number, number, number];
  muted: [number, number, number];
  darkMuted: [number, number, number];
  lightVibrant: [number, number, number];
  isDark: boolean;
}

type RGB = [number, number, number];

// ── Color helpers ──────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function adjustLightness(rgb: RGB, targetL: number): string {
  const [h, s] = rgbToHsl(...rgb);
  const out = hslToRgb(h, s, targetL);
  return rgbToHex(...out);
}

function hexToRgba(rgb: RGB, alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// Ensure minimum contrast ratio between fg text and bg surface
function ensureContrast(textRgb: RGB, surfaceRgb: RGB, surfaceAlpha: number): string {
  const bgLum = luminance(...surfaceRgb) * surfaceAlpha + 255 * (1 - surfaceAlpha);
  const fgLum = luminance(...textRgb);
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  if (ratio >= 4.5) return rgbToHex(...textRgb);
  // Not enough contrast — push text further dark or light
  const [h, s] = rgbToHsl(...textRgb);
  const targetL = fgLum > bgLum ? Math.min(1, 0.95) : Math.max(0, 0.1);
  const out = hslToRgb(h, s, targetL);
  return rgbToHex(...out);
}

// ── Median-cut quantization ────────────────────────────

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length === 0) {
    if (pixels.length === 0) return [[0, 0, 0]];
    const avg: RGB = [0, 0, 0];
    for (const p of pixels) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; }
    return [[
      Math.round(avg[0] / pixels.length),
      Math.round(avg[1] / pixels.length),
      Math.round(avg[2] / pixels.length),
    ]];
  }

  // Find channel with widest range
  let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
  for (const [r, g, b] of pixels) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (g < minG) minG = g; if (g > maxG) maxG = g;
    if (b < minB) minB = b; if (b > maxB) maxB = b;
  }
  const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
  const ch = rangeR >= rangeG && rangeR >= rangeB ? 0 : rangeG >= rangeB ? 1 : 2;

  pixels.sort((a, b) => a[ch] - b[ch]);
  const mid = Math.floor(pixels.length / 2);
  return [
    ...medianCut(pixels.slice(0, mid), depth - 1),
    ...medianCut(pixels.slice(mid), depth - 1),
  ];
}

// ── Public API ─────────────────────────────────────────

/**
 * Extract a 5-color palette from an image source (URL or data-URL).
 */
export async function extractColorsFromImage(src: string): Promise<ExtractedPalette> {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Sample every 4th pixel
  const pixels: RGB[] = [];
  let totalLum = 0;
  for (let i = 0; i < data.length; i += 16) { // step 16 = 4 channels * skip 4
    const r = data[i], g = data[i + 1], b = data[i + 2];
    pixels.push([r, g, b]);
    totalLum += luminance(r, g, b);
  }

  const isDark = totalLum / pixels.length < 128;

  // Quantize to 16 buckets then pick top 5 clusters
  const clusters = medianCut([...pixels], 4); // 2^4 = 16 clusters

  // Classify clusters by HSL properties
  const classified = clusters.map(c => {
    const [h, s, l] = rgbToHsl(...c);
    return { rgb: c, h, s, l };
  });

  // Sort by occurrence relevance
  const dominant = classified[0].rgb; // largest bucket from median cut
  const vibrant = [...classified].sort((a, b) => {
    const aScore = a.s * (1 - Math.abs(a.l - 0.5));
    const bScore = b.s * (1 - Math.abs(b.l - 0.5));
    return bScore - aScore;
  })[0].rgb;
  const muted = [...classified].sort((a, b) => a.s - b.s)[0].rgb;
  const darkMuted = [...classified].filter(c => c.l < 0.4).sort((a, b) => a.l - b.l)[0]?.rgb || classified[classified.length - 1].rgb;
  const lightVibrant = [...classified].filter(c => c.l > 0.5 && c.s > 0.2).sort((a, b) => b.l - a.l)[0]?.rgb || classified[0].rgb;

  return { dominant, vibrant, muted, darkMuted, lightVibrant, isDark };
}

/**
 * Convert an extracted palette into a Theme object suitable for Forsion Desktop.
 */
export function paletteToTheme(palette: ExtractedPalette, wallpaperUrl: string): Theme {
  const { dominant, vibrant, muted, darkMuted, lightVibrant, isDark } = palette;

  const primary = rgbToHex(...vibrant);
  const secondary = rgbToHex(...muted);
  const surfaceAlpha = isDark ? 0.4 : 0.35;
  const surface = isDark
    ? hexToRgba(dominant, surfaceAlpha)
    : `rgba(255, 255, 255, ${surfaceAlpha})`;

  // Text: ensure readability over the glass surface
  const textBase: RGB = isDark ? lightVibrant : darkMuted;
  const textTargetL = isDark ? 0.9 : 0.15;
  let text = adjustLightness(textBase, textTargetL);

  // Contrast check
  const surfaceBgRgb: RGB = isDark ? dominant : [255, 255, 255];
  text = ensureContrast(
    hslToRgb(...rgbToHsl(...textBase).map((v, i) => i === 2 ? textTargetL : v) as [number, number, number]),
    surfaceBgRgb,
    surfaceAlpha,
  );

  return {
    id: 'wallpaper-generated',
    name: 'Wallpaper Theme',
    background: `url(${wallpaperUrl})`,
    primary,
    secondary,
    surface,
    text,
    isDark,
    wallpaper: wallpaperUrl,
  };
}

/**
 * One-call convenience: extract colors then build a theme.
 */
export async function generateThemeFromWallpaper(imageSource: string): Promise<Theme> {
  const palette = await extractColorsFromImage(imageSource);
  return paletteToTheme(palette, imageSource);
}

// ── Internals ──────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
    img.src = src;
  });
}
