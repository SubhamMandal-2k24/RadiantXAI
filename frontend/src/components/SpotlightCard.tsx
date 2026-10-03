import type { PointerEvent, ReactNode } from "react";

export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  function onMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div onPointerMove={onMove}
      className={`group glass relative overflow-hidden rounded-2xl transition duration-300 hover:-translate-y-1 hover:border-accent/50 ${className}`}
    >
      <div aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(43,179,163,0.16), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}