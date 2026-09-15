import type { PathologyScore } from "../types/prediction";

const HIGH_CONFIDENCE_THRESHOLD = 0.5;

export function PredictionBar({ label, probability }: PathologyScore) {
  const pct = Math.round(probability * 100);
  const isHigh = probability >= HIGH_CONFIDENCE_THRESHOLD;

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-36 shrink-0 truncate text-sm text-text" title={label}>
        {label.replace(/_/g, " ")}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: isHigh ? "var(--color-finding)" : "var(--color-accent)",
          }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-text-dim">
        {pct}%
      </span>
    </div>
  );
}
