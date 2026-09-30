import type { PathologyScore } from "../types/prediction";
import { aucTier, AUC_BY_LABEL } from "../data/classMetrics";
import { isFlagged, OPTIMAL_THRESHOLD } from "../data/thresholds";

const TIER_COLOR: Record<string, string> = {
  strong: "var(--color-tier-strong)",     // teal: reliable
  moderate: "var(--color-tier-moderate)", // slate blue: use with context
  weak: "var(--color-tier-weak)",         // amber: verify manually
};

export function PredictionBar({ label, probability }: PathologyScore) {
  const pct = Math.round(probability * 100);
  const tier = aucTier(label);
  const auc = AUC_BY_LABEL[label];
  const threshold = OPTIMAL_THRESHOLD[label] ?? 0.5;
  const flagged = isFlagged(label, probability);

  return (
    <div
      className="flex items-center gap-3 py-1.5"
      title={`AUC-ROC: ${auc.toFixed(3)}  ·  flag threshold: ${threshold.toFixed(2)}`}
    >
      <span className="w-36 shrink-0 truncate text-sm text-text" title={label}>
        {label.replace(/_/g, " ")}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: TIER_COLOR[tier] }}
        />
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-text-dim">
        {pct}%
      </span>
      <span
        className={`w-20 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] uppercase ${
          flagged ? "bg-finding/20 text-finding" : "text-text-dim"
        }`}
      >
        {flagged ? "Flagged" : "—"}
      </span>
    </div>
  );
}