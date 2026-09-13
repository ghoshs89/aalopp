"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-lg bg-[#2a78d6] px-4 py-2 font-bold text-white print:hidden">
      Print or save as PDF
    </button>
  );
}
