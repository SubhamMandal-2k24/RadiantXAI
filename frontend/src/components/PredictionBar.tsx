import type { PathologyScore } from "../types/prediction";
import { aucTier, AUC_BY_LABEL } from "../data/classMetrics";

const TIER_COLOR: Record<string, string> = {
  strong: "#3ba55d",   // green — high-AUC, trust this prediction
  moderate: "var(--color-accent)", // teal — same accent used elsewhere for neutral/informational
  weak: "#c2782e",     // amber — low-AUC, verify manually
};

export function PredictionBar({ label, probability }: PathologyScore) {
  const pct = Math.round(probability * 100);
  const tier = aucTier(label);
  const auc = AUC_BY_LABEL[label];

  return (
    <div className="flex items-center gap-3 py-1.5" title={`Model AUC-ROC for this class: ${auc.toFixed(3)}`}>
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
    </div>
  );
}