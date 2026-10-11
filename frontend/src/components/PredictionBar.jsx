import { motion } from "motion/react";
import { aucTier, AUC_BY_LABEL } from "../data/classMetrics";
import { isFlagged, OPTIMAL_THRESHOLD } from "../data/thresholds";
const TIER_COLOR = {
    strong: "var(--color-tier-strong)",
    moderate: "var(--color-tier-moderate)",
    weak: "var(--color-tier-weak)",
};
export function PredictionBar({ label, probability, index = 0, onHover }) {
    const pct = Math.round(probability * 100);
    const tier = aucTier(label);
    const auc = AUC_BY_LABEL[label];
    const threshold = OPTIMAL_THRESHOLD[label] ?? 0.5;
    const flagged = isFlagged(label, probability);
    return (<motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.3 }} onMouseEnter={() => onHover?.(true)} onMouseLeave={() => onHover?.(false)} className="flex items-center gap-3 rounded px-1 py-1.5 hover:bg-panel-raised" title={`AUC-ROC: ${auc.toFixed(3)}  ·  flag threshold: ${threshold.toFixed(2)}`}>
      <span className="w-36 shrink-0 truncate text-sm text-text" title={label}>
        {label.replace(/_/g, " ")}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: TIER_COLOR[tier] }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + index * 0.05, duration: 0.8, ease: "easeOut" }}/>
      </div>
      <span className="w-12 shrink-0 text-right font-mono text-xs text-text-dim">{pct}%</span>
      <span className={`w-20 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] uppercase ${flagged ? "bg-finding/20 text-finding" : "text-text-dim"}`}>
        {flagged ? "Flagged" : "—"}
      </span>
    </motion.div>);
}
