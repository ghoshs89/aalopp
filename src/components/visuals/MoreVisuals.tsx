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
  return (
    <div className="visual-card flex justify-center">
      <svg viewBox={`0 0 ${width} 150`} className="h-auto w-full max-w-2xl" role="img" aria-label={`A ${visual.object} above a ruler`}>
        <rect x={x(visual.start)} y={28} width={x(visual.end) - x(visual.start)} height={34} rx={10} fill={object.fill} stroke={INK} strokeWidth={2} />
        <text x={(x(visual.start) + x(visual.end)) / 2} y={46} textAnchor="middle" dominantBaseline="central" fontSize={24}>
          {object.emoji}
        </text>
        <line x1={x(visual.start)} x2={x(visual.start)} y1={62} y2={86} stroke={INK} strokeDasharray="3 3" />
        <line x1={x(visual.end)} x2={x(visual.end)} y1={62} y2={86} stroke={INK} strokeDasharray="3 3" />
        <rect x={left - 12} y={86} width={width - 2 * (left - 12)} height={50} fill="#ffe08a" stroke="#9a7b1f" />
        {Array.from({ length: visual.length + 1 }, (_, n) => (
          <g key={n}>
            <line x1={x(n)} x2={x(n)} y1={86} y2={108} stroke={INK} strokeWidth={2} />
            <text x={x(n)} y={126} textAnchor="middle" fontSize={15} fontWeight={700} fill={INK}>
              {n}
            </text>
          </g>
        ))}
        {visual.unit === "in" &&
          Array.from({ length: visual.length }, (_, n) => <line key={n} x1={x(n + 0.5)} x2={x(n + 0.5)} y1={86} y2={98} stroke={INK} />)}
        <text x={width - left} y={20} textAnchor="end" fontSize={14} fontWeight={700} fill={INK}>
          {visual.unit === "in" ? "inches" : "centimeters"}
        </text>
      </svg>
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
