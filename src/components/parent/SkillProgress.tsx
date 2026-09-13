import type { Skill } from "@/content/schema";
import { daysBetween, type LocalDate } from "@/lib/engine/dates";
import type { SkillState, SkillStatus } from "@/lib/engine/skill-state";

const STRANDS: { key: Skill["strand"]; label: string }[] = [
  { key: "MEASUREMENT_DATA", label: "Measurement and data" },
  { key: "OPERATIONS_ALGEBRA", label: "Operations and algebraic thinking" },
  { key: "NUMBER_BASE_TEN", label: "Numbers and place value" },
  { key: "GEOMETRY_SPATIAL", label: "Geometry and spatial reasoning" },
  { key: "LOGIC_CS", label: "Logic and computer science" },
  { key: "LANGUAGE", label: "Reading and languages" },
];

const STATUS: Record<SkillStatus, { label: string; className: string }> = {
  new: { label: "Not started", className: "bg-white/10 text-cream-dim" },
  learning: { label: "Learning", className: "bg-gold/25 text-gold" },
  mastered: { label: "Mastered", className: "bg-moss/25 text-moss-light" },
  "review-due": { label: "Review due", className: "bg-danger/25 text-cream" },
};

function reviewText(state: SkillState, today: LocalDate): string {
  if (!state.nextReview) return "";
  const days = daysBetween(today, state.nextReview);
  if (days <= 0) return "Review due now";
  return days === 1 ? "Review tomorrow" : `Review in ${days} days`;
}

export function SkillProgress({
  skills,
  states,
  workingBands,
  today,
}: {
  skills: Skill[];
  states: Map<string, SkillState>;
  workingBands: Record<string, number>;
  today: LocalDate;
}) {
  const counts = { mastered: 0, "review-due": 0, learning: 0, new: 0 } as Record<SkillStatus, number>;
  for (const s of states.values()) counts[s.status] += 1;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2 text-sm">
        {(["mastered", "review-due", "learning", "new"] as SkillStatus[]).map((status) => (
          <span key={status} className={`rounded-full px-3 py-1 font-bold ${STATUS[status].className}`}>
            {STATUS[status].label}: {counts[status]}
          </span>
        ))}
      </div>
      <p className="text-sm text-cream-dim">
        Mastered means at least 4 of the last 5 answers right, on at least 2 different days. Mastered skills come back after 1, 3, 7, then 14 days, and
        any wrong answer moves a skill back to learning.
      </p>
      {STRANDS.map(({ key, label }) => {
        // Skills with something to look at first: due reviews, then learning, then mastered, then not started.
        const order: Record<SkillStatus, number> = { "review-due": 0, learning: 1, mastered: 2, new: 3 };
        const strandSkills = skills.filter((s) => s.strand === key).sort((a, b) => order[states.get(a.code)!.status] - order[states.get(b.code)!.status]);
        if (strandSkills.length === 0) return null;
        return (
          <div key={key} className="overflow-hidden rounded-2xl bg-bg-mid">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-4 py-3">
              <h2 className="font-display text-xl font-extrabold">{label}</h2>
              <span className="text-sm text-cream-dim">Working level {workingBands[key] ?? 2} of 5</span>
            </div>
            <ul className="divide-y divide-white/10">
              {strandSkills.map((skill) => {
                const state = states.get(skill.code)!;
                return (
                  <li key={skill.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_7rem_8rem_9rem]">
                    <div>
                      <div className="font-bold">{skill.name}</div>
                      {skill.isConvention && <div className="text-xs text-cream-dim">Everyday skill</div>}
                    </div>
                    <span className={`justify-self-end rounded-full px-2.5 py-0.5 text-xs font-extrabold sm:justify-self-start ${STATUS[state.status].className}`}>
                      {STATUS[state.status].label}
                    </span>
                    <span className="text-sm tracking-wider" aria-label={`Last ${state.recent.length} answers: ${state.recent.filter(Boolean).length} right`}>
                      {state.recent.length === 0 ? <span className="text-cream-dim">No answers yet</span> : state.recent.map((r, i) => <span key={i}>{r ? "🟢" : "🔴"}</span>)}
                    </span>
                    <span className="justify-self-end text-sm text-cream-dim sm:justify-self-start">{reviewText(state, today)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
