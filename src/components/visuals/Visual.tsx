import type { Visual as VisualData } from "@/content/schema";
import { barChartTicks, clockHandAngles, emojiFontSize, pointOnDial } from "./geometry";

export function Visual({ visual }: { visual: VisualData }) {
  switch (visual.kind) {
    case "emoji":
      return (
        <div className="visual-card text-center leading-snug whitespace-pre" style={{ fontSize: emojiFontSize(visual.lines) }}>
          {visual.lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      );
    case "grid":
      return <GridVisual rows={visual.rows} highlight={visual.highlight} />;
    case "clock":
      return <ClockVisual hour={visual.hour} minute={visual.minute} />;
    case "barChart":
      return <BarChartVisual title={visual.title} unit={visual.unit} bars={visual.bars} />;
    case "svg":
      // Trusted: SVG comes only from repository content files that pass review, never from user input.
      return (
        <div
          role="img"
          aria-label={visual.alt}
          className="visual-card flex justify-center [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-xl"
          dangerouslySetInnerHTML={{ __html: visual.svg }}
        />
      );
  }
}

function GridVisual({ rows, highlight }: { rows: string[][]; highlight?: { row: number; col: number } }) {
  const cols = Math.max(...rows.map((r) => r.length));
  return (
    <div className="visual-card flex justify-center">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 4.5rem))` }}>
        {rows.flatMap((row, r) =>
          row.map((cell, c) => {
            const lit = highlight?.row === r && highlight.col === c;
            return (
              <div
                key={`${r}-${c}`}
                className={`grid aspect-square place-items-center rounded-xl border-2 text-3xl font-extrabold ${
                  lit ? "border-gold bg-gold text-ink" : "border-ink/15 bg-white text-ink"
                }`}
              >
                {cell}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function ClockVisual({ hour, minute }: { hour: number; minute: number }) {
  const c = 100;
  const angles = clockHandAngles(hour, minute);
  const hourTip = pointOnDial(c, c, 36, angles.hour);
  // Hands stop short of the numbers so the number being pointed at stays readable.
  const minuteTip = pointOnDial(c, c, 54, angles.minute);
  return (
    <div className="visual-card flex justify-center">
      <svg viewBox="0 0 200 200" className="h-auto w-56 max-w-full" role="img" aria-label="An analog clock">
        <circle cx={c} cy={c} r={94} fill="#fffdf6" stroke="#1d2f4b" strokeWidth={6} />
        {Array.from({ length: 60 }, (_, i) => {
          const outer = pointOnDial(c, c, 88, i * 6);
          const inner = pointOnDial(c, c, i % 5 === 0 ? 80 : 84, i * 6);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#1d2f4b" strokeWidth={i % 5 === 0 ? 3 : 1} />
          );
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const p = pointOnDial(c, c, 66, n * 30);
          return (
            <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill="#1d2f4b">
              {n}
            </text>
          );
        })}
        <line x1={c} y1={c} x2={hourTip.x} y2={hourTip.y} stroke="#1d2f4b" strokeWidth={9} strokeLinecap="round" />
        <line x1={c} y1={c} x2={minuteTip.x} y2={minuteTip.y} stroke="#d84957" strokeWidth={5} strokeLinecap="round" />
        <circle cx={c} cy={c} r={6} fill="#1d2f4b" />
      </svg>
    </div>
  );
}

const BAR_COLORS = ["#d84957", "#2878e3", "#2cb470", "#e8a33b", "#8a5cd6"];

// A bar labeled "White" must look white: a mismatched color would teach the wrong thing.
const NAMED_COLORS: Record<string, string> = {
  red: "#d84957",
  blue: "#2878e3",
  green: "#2cb470",
  yellow: "#f2c94c",
  orange: "#e8873b",
  purple: "#8a5cd6",
  pink: "#e87bb4",
  white: "#ffffff",
  black: "#26282b",
  gray: "#9aa1a9",
  grey: "#9aa1a9",
  silver: "#c4cad0",
  brown: "#8a5a36",
};

export function barColor(label: string, index: number): string {
  return NAMED_COLORS[label.trim().toLowerCase()] ?? BAR_COLORS[index % BAR_COLORS.length];
}

function BarChartVisual({ title, unit, bars }: { title: string; unit: string; bars: { label: string; value: number }[] }) {
  const ticks = barChartTicks(bars.map((b) => b.value));
  const top = ticks[ticks.length - 1];
  const width = 340;
  const height = 250;
  const left = 36;
  const bottom = 36;
  const plotTop = 12;
  const plotHeight = height - bottom - plotTop;
  const slot = (width - left - 8) / bars.length;
  const y = (v: number) => plotTop + plotHeight - (v / top) * plotHeight;

  // Values are not printed on the bars: reading them off the scale is the skill being practiced.
  return (
    <figure className="visual-card">
      <figcaption className="mb-1 text-center text-lg font-extrabold text-ink">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Bar graph: ${title}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={width - 8} y1={y(t)} y2={y(t)} stroke="#1d2f4b" strokeOpacity={t === 0 ? 0.8 : 0.15} />
            <text x={left - 8} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={13} fontWeight={700} fill="#1d2f4b">
              {t}
            </text>
          </g>
        ))}
        {bars.map((bar, i) => {
          const x = left + i * slot + slot * 0.2;
          return (
            <g key={bar.label}>
              <rect x={x} y={y(bar.value)} width={slot * 0.6} height={y(0) - y(bar.value)} rx={4} fill={barColor(bar.label, i)} stroke="#1d2f4b" strokeWidth={1.5} />
              <text x={x + slot * 0.3} y={height - bottom + 20} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1d2f4b">
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-center text-sm font-bold text-ink/70">Number of {unit}</p>
    </figure>
  );
}
