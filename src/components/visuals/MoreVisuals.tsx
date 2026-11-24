import type { Visual } from "@/content/schema";

type Of<K extends Visual["kind"]> = Extract<Visual, { kind: K }>;

const INK = "#1d2f4b";

// Relative sizes follow the real coins so size is a clue, the way it is in a wallet.
const COIN_STYLE: Record<string, { diameter: number; fill: string; rim: string; label: string }> = {
  penny: { diameter: 38, fill: "#c77b4a", rim: "#8a4f2b", label: "penny" },
  nickel: { diameter: 42, fill: "#c9ced3", rim: "#7d858d", label: "nickel" },
  dime: { diameter: 36, fill: "#d8dde1", rim: "#7d858d", label: "dime" },
  quarter: { diameter: 48, fill: "#d3d8dc", rim: "#6f7780", label: "quarter" },
  loonie: { diameter: 53, fill: "#e0b64a", rim: "#9c7a1f", label: "loonie" },
  toonie: { diameter: 56, fill: "#d3d8dc", rim: "#9c7a1f", label: "toonie" },
};

export function CoinsVisual({ visual }: { visual: Of<"coins"> }) {
  return (
    <div className="visual-card">
      <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-4">
        {visual.coins.map((coin, i) => {
          const s = COIN_STYLE[coin];
          const size = s.diameter * 1.6;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
                {coin === "toonie" && <circle cx={50} cy={50} r={47} fill="#e0b64a" stroke={s.rim} strokeWidth={3} />}
                <circle cx={50} cy={50} r={coin === "toonie" ? 30 : 47} fill={s.fill} stroke={s.rim} strokeWidth={coin === "toonie" ? 2 : 4} />
                {coin === "loonie" && (
                  <polygon
                    points={Array.from({ length: 11 }, (_, k) => {
                      const a = (k / 11) * 2 * Math.PI;
                      return `${50 + 42 * Math.sin(a)},${50 - 42 * Math.cos(a)}`;
                    }).join(" ")}
                    fill="none"
                    stroke={s.rim}
                    strokeWidth={2}
                  />
                )}
                <circle cx={50} cy={50} r={coin === "toonie" ? 22 : 36} fill="none" stroke={s.rim} strokeOpacity={0.35} strokeWidth={2} />
              </svg>
              <span className="text-sm font-bold text-ink">{s.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-sm font-bold text-ink/70">{visual.currency === "USD" ? "US coins" : "Canadian coins"}</p>
    </div>
  );
}

const RULER_OBJECT: Record<string, { emoji: string; fill: string }> = {
  car: { emoji: "🚗", fill: "#d84957" },
  pencil: { emoji: "✏️", fill: "#f2c94c" },
  crayon: { emoji: "🖍️", fill: "#8a5cd6" },
  truck: { emoji: "🚚", fill: "#2878e3" },
  key: { emoji: "🔑", fill: "#e8a33b" },
  bus: { emoji: "🚌", fill: "#2cb470" },
};

export function RulerVisual({ visual }: { visual: Of<"ruler"> }) {
  const perUnit = visual.unit === "in" ? 48 : 26;
  const left = 22;
  const width = left * 2 + visual.length * perUnit;
  const x = (n: number) => left + n * perUnit;
  const object = RULER_OBJECT[visual.object];
  const compare = visual.compare ? RULER_OBJECT[visual.compare.object] : null;
  const rulerY = compare ? 132 : 86;
  const height = compare ? 196 : 150;
  const primaryY = compare ? 74 : 28;
  return (
    <div className="visual-card flex justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full max-w-2xl"
        role="img"
        aria-label={visual.compare ? `A ${visual.object} and a ${visual.compare.object} above a ruler` : `A ${visual.object} above a ruler`}
      >
        {visual.compare && compare && (
          <>
            <rect x={x(visual.compare.start)} y={26} width={x(visual.compare.end) - x(visual.compare.start)} height={34} rx={10} fill={compare.fill} stroke={INK} strokeWidth={2} />
            <text x={(x(visual.compare.start) + x(visual.compare.end)) / 2} y={44} textAnchor="middle" dominantBaseline="central" fontSize={22}>
              {compare.emoji}
            </text>
            <line x1={x(visual.compare.start)} x2={x(visual.compare.start)} y1={60} y2={rulerY} stroke={INK} strokeOpacity={0.55} strokeDasharray="3 3" />
            <line x1={x(visual.compare.end)} x2={x(visual.compare.end)} y1={60} y2={rulerY} stroke={INK} strokeOpacity={0.55} strokeDasharray="3 3" />
          </>
        )}
        <rect x={x(visual.start)} y={primaryY} width={x(visual.end) - x(visual.start)} height={34} rx={10} fill={object.fill} stroke={INK} strokeWidth={2} />
        <text x={(x(visual.start) + x(visual.end)) / 2} y={primaryY + 18} textAnchor="middle" dominantBaseline="central" fontSize={22}>
          {object.emoji}
        </text>
        <line x1={x(visual.start)} x2={x(visual.start)} y1={primaryY + 34} y2={rulerY} stroke={INK} strokeDasharray="3 3" />
        <line x1={x(visual.end)} x2={x(visual.end)} y1={primaryY + 34} y2={rulerY} stroke={INK} strokeDasharray="3 3" />
        <rect x={left - 12} y={rulerY} width={width - 2 * (left - 12)} height={50} fill="#ffe08a" stroke="#9a7b1f" />
        {Array.from({ length: visual.length + 1 }, (_, n) => (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={rulerY} y2={rulerY + 22} stroke={INK} strokeWidth={2} />
            <text x={x(n)} y={rulerY + 40} textAnchor="middle" fontSize={15} fontWeight={700} fill={INK}>
              {n}
            </text>
          </g>
        ))}
        {visual.unit === "in" &&
          Array.from({ length: visual.length }, (_, n) => <line key={n} x1={x(n + 0.5)} x2={x(n + 0.5)} y1={rulerY} y2={rulerY + 12} stroke={INK} />)}
        <text x={width - left} y={18} textAnchor="end" fontSize={14} fontWeight={700} fill={INK}>
          {visual.unit === "in" ? "inches" : "centimeters"}
        </text>
      </svg>
    </div>
  );
}

export function NumberLineVisual({ visual }: { visual: Of<"numberLine"> }) {
  const width = 360;
  const height = 112;
  const left = 28;
  const right = width - 28;
  const span = visual.max - visual.min;
  const x = (v: number) => left + ((v - visual.min) / span) * (right - left);
  const ticks: number[] = [];
  for (let v = visual.min; v <= visual.max; v += visual.step) ticks.push(v);
  const mx = x(visual.mark);
  return (
    <div className="visual-card flex justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-2xl" role="img" aria-label={`Number line from ${visual.min} to ${visual.max} with a marker at ${visual.mark}`}>
        <line x1={left} x2={right} y1={66} y2={66} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        {ticks.map((t, i) => {
          const major = i === 0 || i === ticks.length - 1 || t === (visual.min + visual.max) / 2;
          return (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={major ? 52 : 58} y2={major ? 80 : 74} stroke={INK} strokeWidth={major ? 3 : 1.8} />
              {(ticks.length <= 11 ? i % 2 === 0 || major : major) && (
                <text x={x(t)} y={98} textAnchor="middle" fontSize={major ? 14 : 11} fontWeight={major ? 800 : 600} fill={INK}>
                  {t}
                </text>
              )}
            </g>
          );
        })}
        <circle cx={mx} cy={66} r={8} fill="#d84957" stroke="#ffffff" strokeWidth={2.5} />
        <rect x={Math.max(8, Math.min(width - 78, mx - 35))} y={10} width={70} height={28} rx={10} fill="#d84957" />
        <text x={Math.max(43, Math.min(width - 43, mx))} y={25} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={800} fill="#ffffff">
          {visual.label ?? String(visual.mark)}
        </text>
        <line x1={mx} x2={mx} y1={38} y2={58} stroke="#d84957" strokeWidth={2.5} />
      </svg>
    </div>
  );
}

const STRIP_COLORS = ["#2878e3", "#2cb470", "#e8a33b", "#8a5cd6"];

export function FractionStripVisual({ visual }: { visual: Of<"fractionStrip"> }) {
  const barW = 280;
  const barH = 38;
  const gap = 14;
  const left = 16;
  const labelW = 54;
  const width = left + barW + labelW + 12;
  const height = 20 + visual.strips.length * (barH + gap);
  return (
    <div className="visual-card flex justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full max-w-xl" role="img" aria-label="Fraction strips comparing equal parts of the same whole">
        {visual.strips.map((strip, row) => {
          const y = 12 + row * (barH + gap);
          const cellW = barW / strip.parts;
          const fill = STRIP_COLORS[row % STRIP_COLORS.length];
          return (
            <g key={row}>
              {Array.from({ length: strip.parts }, (_, i) => (
                <rect
                  key={i}
                  x={left + i * cellW}
                  y={y}
                  width={cellW}
                  height={barH}
                  fill={i < strip.shaded ? fill : "#ffffff"}
                  stroke={INK}
                  strokeWidth={2.5}
                />
              ))}
              {strip.label && (
                <text x={left + barW + 12} y={y + barH / 2} dominantBaseline="central" fontSize={16} fontWeight={800} fill={INK}>
                  {strip.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BalanceVisual({ visual }: { visual: Of<"balance"> }) {
  return (
    <div className="visual-card grid gap-4">
      {visual.scales.map((scale, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="flex min-h-14 flex-wrap items-center justify-center gap-1.5 rounded-2xl border-2 border-ink/25 bg-white px-3 py-2 text-2xl font-extrabold text-ink shadow-sm">
              {scale.left.map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
            <span className="pb-3 text-2xl font-extrabold text-ink" aria-label="equals">
              =
            </span>
            <div className="flex min-h-14 flex-wrap items-center justify-center gap-1.5 rounded-2xl border-2 border-ink/25 bg-white px-3 py-2 text-2xl font-extrabold text-ink shadow-sm">
              {scale.right.map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </div>
          <div className="mt-1 h-2 w-full max-w-md rounded-full bg-ink/80" />
          <div className="h-0 w-0 border-x-[12px] border-b-[14px] border-x-transparent border-b-ink/80" />
        </div>
      ))}
    </div>
  );
}

export function PictureGraphVisual({ visual }: { visual: Of<"pictureGraph"> }) {
  return (
    <figure className="visual-card text-ink">
      <figcaption className="mb-2 text-center text-lg font-extrabold">{visual.title}</figcaption>
      <div className="mx-auto grid max-w-xl grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        {visual.rows.map((row) => (
          <div key={row.label} className="contents">
            <div className="border-r-2 border-ink/30 pr-3 text-right font-extrabold">{row.label}</div>
            <div className="text-2xl leading-tight tracking-wide">{row.count === 0 ? " " : visual.icon.repeat(row.count / visual.perIcon)}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center font-bold">
        Key: each {visual.icon} = {visual.perIcon}
      </p>
    </figure>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarVisual({ visual }: { visual: Of<"calendar"> }) {
  const marks = new Map(visual.marks.map((m) => [m.day, m.emoji]));
  const cells = [...Array(visual.firstWeekday).fill(null), ...Array.from({ length: visual.days }, (_, i) => i + 1)];
  return (
    <figure className="visual-card text-ink">
      <figcaption className="mb-2 text-center text-xl font-extrabold">{visual.month}</figcaption>
      <div className="mx-auto grid max-w-xl grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-xs font-extrabold text-ink/70 sm:text-sm">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`flex aspect-square flex-col items-center justify-start rounded-md pt-0.5 ${day ? "border border-ink/20 bg-white" : ""}`}>
            {day && <span className="text-sm font-bold sm:text-base">{day}</span>}
            {day && marks.has(day) && <span className="text-base leading-none sm:text-xl">{marks.get(day)}</span>}
          </div>
        ))}
      </div>
    </figure>
  );
}

export function NetworkVisual({ visual }: { visual: Of<"network"> }) {
  const px = (x: number) => 30 + x * 2.8;
  const py = (y: number) => 30 + y * 1.8;
  const byId = new Map(visual.nodes.map((n) => [n.id, n]));
  return (
    <div className="visual-card flex justify-center">
      <svg viewBox="0 0 340 240" className="h-auto w-full max-w-xl" role="img" aria-label="A map of places joined by roads, each road marked with its length">
        {visual.edges.map((e) => {
          const a = byId.get(e.from)!;
          const b = byId.get(e.to)!;
          const mx = (px(a.x) + px(b.x)) / 2;
          const my = (py(a.y) + py(b.y)) / 2;
          return (
            <g key={`${e.from}-${e.to}`}>
              <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="#9a7b5a" strokeWidth={7} strokeLinecap="round" />
              <circle cx={mx} cy={my} r={12} fill="#fff" stroke={INK} strokeWidth={1.5} />
              <text x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={800} fill={INK}>
                {e.weight}
              </text>
            </g>
          );
        })}
        {visual.nodes.map((n) => (
          <g key={n.id}>
            <circle cx={px(n.x)} cy={py(n.y)} r={20} fill="#f6f1e4" stroke={INK} strokeWidth={2.5} />
            <text x={px(n.x)} y={py(n.y)} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={800} fill={INK}>
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
