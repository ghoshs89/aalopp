import type { Tally } from "@/lib/engine/insights";
import { percent } from "@/lib/engine/insights";
import { ChartTooltip } from "./ChartTooltip";

// Chart roles from the dataviz reference palette, on a light card that sits on the app's dark page.
export const VIZ = {
  surface: "#fcfcfb",
  ink: "#0b0b0b",
  ink2: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  baseline: "#c3c2b7",
  series: "#2a78d6",
  seriesLight: "#b7d3f6",
  good: "#0ca30c",
  warning: "#fab219",
} as const;

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-4 shadow-sm" style={{ background: VIZ.surface, color: VIZ.ink, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <h3 className="text-base font-bold">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-sm" style={{ color: VIZ.ink2 }}>
          {subtitle}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: VIZ.surface, color: VIZ.ink, fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      <div className="text-sm" style={{ color: VIZ.ink2 }}>
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      {detail && (
        <div className="mt-1 text-xs" style={{ color: VIZ.muted }}>
          {detail}
        </div>
      )}
    </div>
  );
}

export function TableView({ caption, headers, rows }: { caption: string; headers: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm" style={{ color: VIZ.ink2 }}>
      <summary className="cursor-pointer select-none">Show as table</summary>
      <table className="mt-2 w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b py-1 pr-3 font-semibold" style={{ borderColor: VIZ.grid }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="border-b py-1 pr-3 tabular-nums" style={{ borderColor: VIZ.grid }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Horizontal bars of percent right, one hue, value at the tip. Rows with no answers say so instead of drawing a bar. */
export function PercentBars({ rows }: { rows: ({ label: string } & Tally)[] }) {
  return (
    <ChartTooltip>
      <ul className="space-y-2">
        {rows.map((r) => {
          const p = percent(r);
          return (
            <li key={r.label} className="grid grid-cols-[minmax(7rem,11rem)_1fr] items-center gap-3 text-sm">
              <span style={{ color: VIZ.ink2 }}>{r.label}</span>
              {p === null ? (
                <span style={{ color: VIZ.muted }}>No answers yet</span>
              ) : (
                <span
                  tabIndex={0}
                  data-tip={`${p}% right|${r.label}|${r.correct} of ${r.answered} answers`}
                  className="flex items-center gap-2 py-1 outline-offset-2"
                  aria-label={`${r.label}: ${p}% right, ${r.correct} of ${r.answered}`}
                >
                  <span className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(p, 1) * 0.8}%`, background: VIZ.series }} />
                  <span className="whitespace-nowrap font-semibold" style={{ color: VIZ.ink }}>
                    {p}%
                  </span>
                  <span className="whitespace-nowrap text-xs" style={{ color: VIZ.muted }}>
                    of {r.answered}
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </ChartTooltip>
  );
}

function niceMax(value: number): number {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  return Math.ceil(value / 10) * 10;
}

const shortDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Daily columns: right answers in the series blue, the rest of the day's answers stacked above in a lighter step. */
export function DailyColumns({ days }: { days: ({ date: string; minutes: number } & Tally)[] }) {
  // Drawn close to its on-screen size so text stays about 12px at desktop widths.
  const width = 900;
  const height = 220;
  const left = 32;
  const bottom = 26;
  const top = 10;
  const max = niceMax(Math.max(...days.map((d) => d.answered), 1));
  const plotH = height - bottom - top;
  const slot = (width - left) / days.length;
  const barW = Math.min(36, slot - 8);
  const y = (v: number) => top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  return (
    <ChartTooltip className="overflow-x-auto">
      {/* Keeps labels readable on phones by scrolling inside the card instead of shrinking. */}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[600px]" role="img" aria-label="Questions answered per day for the last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={width} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.baseline : VIZ.grid} strokeWidth={1} />
            <text x={left - 6} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={12} fill={VIZ.muted}>
              {t}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = left + i * slot + (slot - barW) / 2;
          const wrong = d.answered - d.correct;
          return (
            <g key={d.date}>
              {d.correct > 0 && <rect x={x} y={y(d.correct)} width={barW} height={y(0) - y(d.correct)} rx={d.correct === d.answered ? 4 : 0} fill={VIZ.series} />}
              {wrong > 0 && <rect x={x} y={y(d.answered)} width={barW} height={Math.max(0, y(d.correct) - y(d.answered) - 2)} rx={4} fill={VIZ.seriesLight} />}
              {i % 2 === days.length % 2 && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={12} fill={VIZ.muted}>
                  {shortDate(d.date)}
                </text>
              )}
              <rect
                x={left + i * slot}
                y={top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                data-tip={`${d.answered} answered|${shortDate(d.date)}|${d.correct} right, ${d.minutes} min`}
                aria-label={`${shortDate(d.date)}: ${d.answered} answered, ${d.correct} right`}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex gap-4 text-xs" style={{ color: VIZ.ink2 }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: VIZ.series }} /> Right
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: VIZ.seriesLight }} /> Not right
        </span>
      </div>
    </ChartTooltip>
  );
}

/** Weekly percent right as a single 2px line; weeks without answers leave a gap rather than dropping to zero. */
export function WeeklyLine({ weeks }: { weeks: ({ start: string; end: string } & Tally)[] }) {
  const width = 460;
  const height = 190;
  const left = 40;
  const right = 44;
  const top = 10;
  const bottom = 24;
  const plotH = height - top - bottom;
  const step = (width - left - right) / Math.max(1, weeks.length - 1);
  const x = (i: number) => left + i * step;
  const y = (p: number) => top + plotH - (p / 100) * plotH;
  const points = weeks.map((w, i) => ({ i, p: percent(w), w }));
  // Split the line wherever a week has no answers.
  const segments: { i: number; p: number }[][] = [[]];
  for (const pt of points) {
    if (pt.p === null) segments.push([]);
    else segments[segments.length - 1].push({ i: pt.i, p: pt.p });
  }
  const last = [...points].reverse().find((pt) => pt.p !== null);
  return (
    <ChartTooltip>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Percent right per week for the last 8 weeks">
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.baseline : VIZ.grid} />
            <text x={left - 6} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={12} fill={VIZ.muted}>
              {t}%
            </text>
          </g>
        ))}
        {segments
          .filter((s) => s.length > 1)
          .map((s, k) => (
            <polyline key={k} points={s.map((pt) => `${x(pt.i)},${y(pt.p)}`).join(" ")} fill="none" stroke={VIZ.series} strokeWidth={2} strokeLinejoin="round" />
          ))}
        {points.map((pt) =>
          pt.p === null ? null : <circle key={pt.i} cx={x(pt.i)} cy={y(pt.p)} r={4} fill={VIZ.series} stroke={VIZ.surface} strokeWidth={2} />,
        )}
        {last && last.p !== null && (
          <text x={x(last.i) + 8} y={y(last.p)} dominantBaseline="central" fontSize={13} fontWeight={700} fill={VIZ.ink}>
            {last.p}%
          </text>
        )}
        {points.map((pt) => (
          <g key={`hit-${pt.i}`}>
            {(pt.i === 0 || pt.i === points.length - 1) && (
              <text x={x(pt.i)} y={height - 6} textAnchor={pt.i === 0 ? "start" : "end"} fontSize={12} fill={VIZ.muted}>
                {shortDate(pt.w.end)}
              </text>
            )}
            <rect
              x={x(pt.i) - step / 2}
              y={top}
              width={step}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              data-tip={`${pt.p === null ? "No answers" : `${pt.p}% right`}|Week ending ${shortDate(pt.w.end)}|${pt.w.correct} of ${pt.w.answered} answers`}
              aria-label={`Week ending ${shortDate(pt.w.end)}: ${pt.p === null ? "no answers" : `${pt.p}% right`}`}
            />
          </g>
        ))}
      </svg>
    </ChartTooltip>
  );
}
