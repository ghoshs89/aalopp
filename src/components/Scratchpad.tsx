"use client";

import { useEffect, useRef, useState } from "react";

type Point = { x: number; y: number; pressure: number };
type Stroke = { color: string; points: Point[] };

const INKS = [
  { color: "#1d2f4b", label: "Blue pen" },
  { color: "#d84957", label: "Red pen" },
];

/** Stroke width in CSS pixels: pens follow pressure, fingers and mice get a steady line. */
export function strokeWidth(pressure: number, pointerType: string): number {
  if (pointerType !== "pen") return 4;
  return 2 + Math.max(0, Math.min(1, pressure)) * 5;
}

/**
 * A drawing area for working things out. Works with a finger, a stylus or a mouse. When a stylus is in use,
 * touches are ignored so a resting palm does not draw. Nothing drawn here is saved or uploaded.
 */
export function Scratchpad({ onStrokesChange }: { onStrokesChange: (count: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokes = useRef<(Stroke & { pointerType: string })[]>([]);
  const active = useRef<{ id: number; stroke: Stroke & { pointerType: string } } | null>(null);
  const penSeen = useRef(false);
  const [ink, setInk] = useState(INKS[0].color);
  const [count, setCount] = useState(0);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes.current) {
      ctx.strokeStyle = s.color;
      if (s.points.length === 1) {
        const p = s.points[0];
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, strokeWidth(p.pressure, s.pointerType) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 1; i < s.points.length; i++) {
        const a = s.points[i - 1];
        const b = s.points[i];
        ctx.lineWidth = strokeWidth(b.pressure, s.pointerType);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  };

  // Keep the canvas sharp and the right size when the screen rotates or the layout changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      redraw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const update = (next: number) => {
    setCount(next);
    onStrokesChange(next);
  };

  const pointFrom = (e: PointerEvent | React.PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure || 0.5 };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "pen") penSeen.current = true;
    if (e.pointerType === "touch" && penSeen.current) return;
    if (active.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const stroke = { color: ink, points: [pointFrom(e)], pointerType: e.pointerType };
    active.current = { id: e.pointerId, stroke };
    strokes.current.push(stroke);
    redraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.id !== e.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events) active.current.stroke.points.push(pointFrom(ev));
    redraw();
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (active.current?.id !== e.pointerId) return;
    active.current = null;
    update(strokes.current.length);
  };

  const undo = () => {
    strokes.current.pop();
    redraw();
    update(strokes.current.length);
  };

  const clear = () => {
    strokes.current = [];
    redraw();
    update(0);
  };

  return (
    <div className="mt-4 rounded-3xl bg-cream p-3 text-ink shadow-xl">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {INKS.map((i) => (
          <button
            key={i.color}
            onClick={() => setInk(i.color)}
            aria-label={i.label}
            aria-pressed={ink === i.color}
            className={`size-11 rounded-full border-4 ${ink === i.color ? "border-gold" : "border-transparent"}`}
            style={{ backgroundColor: i.color }}
          />
        ))}
        <span className="flex-1" />
        <button onClick={undo} disabled={count === 0} className="rounded-xl bg-ink px-4 py-2 text-lg font-bold text-cream disabled:opacity-40">
          ↩️ Undo
        </button>
        <button onClick={clear} disabled={count === 0} className="rounded-xl bg-ink px-4 py-2 text-lg font-bold text-cream disabled:opacity-40">
          🧽 Clear
        </button>
      </div>
      <div ref={wrapRef} className="relative h-52 w-full overflow-hidden rounded-2xl border-2 border-ink/15 bg-white sm:h-80">
        <canvas
          ref={canvasRef}
          aria-label="Scratchpad for working it out"
          className="absolute inset-0 touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        />
        {count === 0 && <p className="pointer-events-none absolute inset-0 grid place-items-center text-lg text-ink/40">Draw here to work it out</p>}
      </div>
    </div>
  );
}
