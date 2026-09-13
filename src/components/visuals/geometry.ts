/** Hand angles in degrees clockwise from 12. The hour hand creeps forward with the minutes, like a real clock. */
export function clockHandAngles(hour: number, minute: number) {
  return { hour: ((hour % 12) + minute / 60) * 30, minute: minute * 6 };
}

export function pointOnDial(cx: number, cy: number, length: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return { x: cx + length * Math.sin(radians), y: cy - length * Math.cos(radians) };
}

/** Axis ticks for a bar chart: every 1 up to 10, then every 2, always ending at or above the tallest bar. */
export function barChartTicks(values: number[]): number[] {
  const max = Math.max(1, ...values);
  const step = max <= 10 ? 1 : 2;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: top / step + 1 }, (_, i) => i * step);
}

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });

/** Rough rendered width of a line in em: an emoji is about 1.15em wide, a letter or space about 0.55em. */
export function lineWidthEm(line: string): number {
  let em = 0;
  for (const { segment } of graphemes.segment(line)) em += /\p{Extended_Pictographic}/u.test(segment) ? 1.15 : 0.55;
  return em;
}

/**
 * Font size that fits the widest line inside the card, so picture rows never scroll sideways or get cut off.
 * Capped at 3rem on big screens and 1rem on tiny ones.
 */
export function emojiFontSize(lines: string[]): string {
  const widest = Math.max(1, ...lines.map(lineWidthEm));
  // Card content width: the page column (max 48rem) minus page, card and picture padding (about 6rem).
  return `clamp(1rem, calc((min(100vw, 48rem) - 6rem) / ${widest.toFixed(2)}), 3rem)`;
}
