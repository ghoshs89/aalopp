"use client";

import { useRef, useState } from "react";

/**
 * Hover and keyboard tooltip for any mark inside it that has data-tip="value|label|detail".
 * The first part is the value (shown strong), the rest are secondary lines. Text is set as text, never HTML.
 */
export function ChartTooltip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ lines: string[]; x: number; y: number } | null>(null);

  const show = (target: EventTarget | null, clientX?: number, clientY?: number) => {
    const el = (target as Element | null)?.closest?.("[data-tip]");
    const box = wrap.current?.getBoundingClientRect();
    if (!el || !box) return setTip(null);
    const rect = el.getBoundingClientRect();
    const x = (clientX ?? rect.left + rect.width / 2) - box.left;
    const y = (clientY ?? rect.top) - box.top;
    // Keep the tooltip inside the chart's edges.
    const clampedX = Math.max(60, Math.min(x, box.width - 60));
    setTip({ lines: (el.getAttribute("data-tip") ?? "").split("|"), x: clampedX, y });
  };

  return (
    <div
      ref={wrap}
      className={`relative ${className}`}
      onPointerMove={(e) => show(e.target, e.clientX, e.clientY)}
      onPointerLeave={() => setTip(null)}
      onFocus={(e) => show(e.target)}
      onBlur={() => setTip(null)}
    >
      {children}
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-xs text-[#52514e] shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          <div className="text-sm font-bold text-[#0b0b0b]">{tip.lines[0]}</div>
          {tip.lines.slice(1).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
