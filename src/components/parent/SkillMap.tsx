import type { Skill } from "@/content/schema";
import { daysBetween, type LocalDate } from "@/lib/engine/dates";
import { skillMapLayout } from "@/lib/engine/insights";
import type { SkillState, SkillStatus } from "@/lib/engine/skill-state";
import { ChartTooltip } from "./ChartTooltip";
import { VIZ } from "./Charts";

// Status is never color alone: every node pairs a colored stripe with an icon, and the legend names them.
const STATUS: Record<SkillStatus, { color: string; icon: string; label: string }> = {
  mastered: { color: VIZ.good, icon: "✓", label: "Mastered" },
  "review-due": { color: VIZ.warning, icon: "↻", label: "Review due" },
  learning: { color: VIZ.series, icon: "●", label: "Learning" },
  new: { color: VIZ.baseline, icon: "○", label: "Not started" },
};

const NODE_W = 232;
const NODE_H = 34;
const COL_GAP = 48;
const ROW_GAP = 10;

export function SkillMap({ skills, states, today }: { skills: Skill[]; states: Map<string, SkillState>; today: LocalDate }) {
  const { nodes, edges, layers, rows } = skillMapLayout(skills);
  const pos = new Map(nodes.map((n) => [n.code, { x: 12 + n.layer * (NODE_W + COL_GAP), y: 12 + n.row * (NODE_H + ROW_GAP) }]));
  const width = 24 + layers * NODE_W + (layers - 1) * COL_GAP;
  const height = 24 + rows * NODE_H + (rows - 1) * ROW_GAP;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs" style={{ color: VIZ.ink2 }}>
        {(Object.keys(STATUS) as SkillStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-1.5 rounded-sm" style={{ background: STATUS[s].color }} />
            <span aria-hidden>{STATUS[s].icon}</span> {STATUS[s].label}
          </span>
        ))}
        <span>Arrows point from a skill to the skills that build on it.</span>
      </div>
      <ChartTooltip className="overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Map of skills and the skills that build on them">
          {edges.map((e) => {
            const a = pos.get(e.from)!;
            const b = pos.get(e.to)!;
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const mid = (x1 + x2) / 2;
            return <path key={`${e.from}-${e.to}`} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2 - 4} ${y2}`} fill="none" stroke={VIZ.baseline} strokeOpacity={0.55} strokeWidth={1} />;
          })}
          {nodes.map((n) => {
            const p = pos.get(n.code)!;
            const state = states.get(n.code)!;
            const st = STATUS[state.status];
            const right = state.recent.filter(Boolean).length;
            const review = state.nextReview ? `Next review ${daysBetween(today, state.nextReview) <= 0 ? "now" : `in ${daysBetween(today, state.nextReview)} days`}` : "";
            const label = n.name.length > 36 ? `${n.name.slice(0, 34)}…` : n.name;
            return (
              <g
                key={n.code}
                tabIndex={0}
                data-tip={`${st.label}|${n.name}|${state.recent.length ? `${right} of last ${state.recent.length} right` : "No answers yet"}${review ? `|${review}` : ""}`}
                aria-label={`${n.name}: ${st.label}`}
              >
                <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} rx={8} fill={VIZ.surface} stroke={VIZ.grid} />
                <rect x={p.x} y={p.y} width={6} height={NODE_H} rx={3} fill={st.color} />
                <text x={p.x + 16} y={p.y + NODE_H / 2} dominantBaseline="central" fontSize={11} fill={VIZ.ink2}>
                  <tspan fontWeight={700} fill={VIZ.ink}>
                    {st.icon}
                  </tspan>{" "}
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </ChartTooltip>
    </div>
  );
}
