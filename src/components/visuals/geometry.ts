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
