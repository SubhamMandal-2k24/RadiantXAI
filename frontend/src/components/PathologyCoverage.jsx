import { motion } from "motion/react";
import { AUC_BY_LABEL, aucTier } from "../data/classMetrics";
import { useAuth } from "../context/auth-context";
const TIER_COLOR = {
    strong: "var(--color-tier-strong)",
    moderate: "var(--color-tier-moderate)",
    weak: "var(--color-tier-weak)",
};
export function PathologyCoverage() {
    const { role } = useAuth();
    const isTechnician = role === "technician";
    const labels = Object.keys(AUC_BY_LABEL).sort((a, b) => isTechnician ? AUC_BY_LABEL[b] - AUC_BY_LABEL[a] : String(a).localeCompare(String(b)));
    return (<div className="glass rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-text">14 pathologies screened</h2>
        {isTechnician && (<p className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-text-dim">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR.strong }}/>
              AUC ≥ 0.80
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR.moderate }}/>
              ≥ 0.70
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR.weak }}/>
              &lt; 0.70
            </span>
          </p>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {labels.map((label, i) => (<motion.span key={String(label)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.03 }} title={isTechnician ? `AUC-ROC ${AUC_BY_LABEL[label].toFixed(3)}` : undefined} className="inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-1 text-xs text-text-dim">
            {isTechnician && (<span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TIER_COLOR[aucTier(String(label))] }}/>)}
            {String(label).replace(/_/g, " ")}
          </motion.span>))}
      </div>
    </div>);
}
