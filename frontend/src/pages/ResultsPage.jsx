import { useEffect } from "react";
import { motion } from "motion/react";
import { HeatmapOverlay } from "../components/HeatmapOverlay";
import { PredictionBar } from "../components/PredictionBar";
import { MethodologyNote } from "../components/MethodologyNote";
import { GeneralSummary } from "../components/GeneralSummary";
import { useAuth } from "../context/auth-context";
import { AUC_BY_LABEL, aucTier } from "../data/classMetrics";
import { isFlagged, OPTIMAL_THRESHOLD } from "../data/thresholds";
function Reveal({ children, delay = 0 }) {
    return (<motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.45, delay }}>
      {children}
    </motion.div>);
}
function SectionTitle({ eyebrow, title }) {
    return (<div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">{eyebrow}</p>
      <h2 className="font-display mt-1 text-xl text-text">{title}</h2>
    </div>);
}
const TIER_COLOR = {
    strong: "var(--color-tier-strong)",
    moderate: "var(--color-tier-moderate)",
    weak: "var(--color-tier-weak)",
};
const TIERS = [
    {
        key: "strong",
        name: "Strong",
        range: "AUC ≥ 0.80",
        body: "The model separates this finding well. Treat the prediction as a dependable signal.",
    },
    {
        key: "moderate",
        name: "Moderate",
        range: "AUC 0.70 – 0.80",
        body: "Useful, but read it alongside the heatmap and the clinical context.",
    },
    {
        key: "weak",
        name: "Needs verification",
        range: "AUC < 0.70",
        body: "Treat this as a prompt for manual review rather than a conclusion.",
    },
];
const GENERAL_NEXT_STEPS = [
    "Share this result with a doctor or radiologist; they can interpret it with your history and symptoms.",
    "Do not make health decisions from this result alone.",
    "If you have symptoms or concerns, seek medical care regardless of what this tool shows.",
];
export function ResultsPage({ result, onReset }) {
    const { role } = useAuth();
    const isTechnician = role === "technician";
    // Land at the top of the result, not wherever the upload page was scrolled.
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, []);
    const sorted = [...result.predictions].sort((a, b) => b.probability - a.probability);
    const topFinding = sorted[0];
    const topName = topFinding ? topFinding.label.replace(/_/g, " ") : "";
    const flaggedCount = sorted.filter((p) => isFlagged(p.label, p.probability)).length;
    const summary = [
        { value: topName || "—", label: "top finding" },
        { value: topFinding ? `${Math.round(topFinding.probability * 100)}%` : "—", label: "model confidence" },
        isTechnician
            ? { value: String(flaggedCount), label: "findings flagged" }
            : { value: String(sorted.length), label: "pathologies screened" },
    ];
    return (<div className="mx-auto max-w-3xl space-y-14 px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border-strong px-3 py-1 font-mono text-xs text-accent">
              {isTechnician ? "Technician view" : "General view"}
            </span>
            <button onClick={onReset} className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-dim hover:border-accent hover:text-text">
              Analyze another
            </button>
          </div>
        </div>
        <h1 className="font-display mt-2 text-3xl text-text">Analysis result</h1>
        <p className="mt-2 text-sm text-text-dim">
          Here is what the model found in your chest X-ray, and where in the image it looked.
        </p>
      </motion.div>

      <Reveal>
        <div className="glass grid grid-cols-1 gap-4 rounded-xl p-5 sm:grid-cols-3">
          {summary.map((s) => (<div key={s.label} className="text-center">
              <p className="font-display text-gradient text-2xl">{s.value}</p>
              <p className="mt-1 text-xs text-text-dim">{s.label}</p>
            </div>))}
        </div>
      </Reveal>

      <section>
        <Reveal>
          <SectionTitle eyebrow="Localization" title="Where the model looked"/>
        </Reveal>
        <Reveal delay={0.05}>
          {topFinding && (<div className="glass rounded-xl p-4">
              <div className="mx-auto max-w-xl">
                <HeatmapOverlay originalUrl={result.original_url} heatmapUrl={result.heatmap_url} topLabel={topFinding.label}/>
              </div>
            </div>)}
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-sm text-text-dim">
            {isTechnician
            ? `The heatmap is generated with Grad-CAM for the top predicted finding (${topName}). Warmer regions had more influence on that prediction. Use the blend slider to compare it with the original image, or switch to side-by-side.`
            : `The colored overlay shows the parts of the X-ray the model paid most attention to when it reached its top result (${topName}). Warmer colors mean more attention.`}
          </p>
        </Reveal>
      </section>

      {isTechnician ? (<>
          <section>
            <Reveal>
              <SectionTitle eyebrow="Key findings" title="Top three predictions"/>
            </Reveal>
            <div className="space-y-3">
              {sorted.slice(0, 3).map((p, i) => {
                const pct = Math.round(p.probability * 100);
                const tier = aucTier(p.label);
                const auc = AUC_BY_LABEL[p.label];
                const threshold = OPTIMAL_THRESHOLD[p.label] ?? 0.5;
                const flagged = isFlagged(p.label, p.probability);
                return (<Reveal key={p.label} delay={i * 0.06}>
                    <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl p-5">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TIER_COLOR[tier] }}/>
                        <div>
                          <h3 className="font-display text-base text-text">
                            {p.label.replace(/_/g, " ")}
                          </h3>
                          <p className="mt-0.5 font-mono text-xs text-text-dim">
                            AUC {auc.toFixed(3)} · flag threshold {threshold.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-gradient text-2xl">{pct}%</span>
                        <span className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase ${flagged ? "bg-finding/20 text-finding" : "text-text-dim"}`}>
                          {flagged ? "Flagged" : "Not flagged"}
                        </span>
                      </div>
                    </div>
                  </Reveal>);
            })}
            </div>
          </section>

          <section>
            <Reveal>
              <SectionTitle eyebrow="Full breakdown" title="All 14 pathology probabilities"/>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="glass rounded-xl p-4">
                {sorted.map((p, i) => (<PredictionBar key={p.label} label={p.label} probability={p.probability} index={i}/>))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-3 text-xs text-text-dim">
                Each row's flag threshold is tuned per class (F1-optimized on the validation set),
                not a flat 50%. Hover a row to see its AUC and threshold.
              </p>
            </Reveal>
          </section>

          <section>
            <Reveal>
              <SectionTitle eyebrow="Reading the colors" title="Reliability tiers"/>
            </Reveal>
            <div className="space-y-3">
              {TIERS.map((t, i) => (<Reveal key={t.key} delay={i * 0.05}>
                  <div className="glass flex gap-4 rounded-xl p-5">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TIER_COLOR[t.key] }}/>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="font-display text-base text-text">{t.name}</h3>
                        <span className="font-mono text-xs text-text-dim">{t.range}</span>
                      </div>
                      <p className="mt-1 text-sm text-text-dim">{t.body}</p>
                    </div>
                  </div>
                </Reveal>))}
            </div>
            <Reveal delay={0.1}>
              <p className="mt-3 text-xs text-text-dim">
                The color of each probability bar reflects how reliably the model detects that
                pathology overall (its validation AUC-ROC), independent of this image.
              </p>
            </Reveal>
          </section>

          <section>
            <Reveal>
              <SectionTitle eyebrow="Methodology" title="How the heatmap was validated"/>
            </Reveal>
            <Reveal delay={0.05}>
              <MethodologyNote />
            </Reveal>
          </section>
        </>) : (<>
          <section>
            <Reveal>
              <SectionTitle eyebrow="Summary" title="What the model found"/>
            </Reveal>
            <Reveal delay={0.05}>
              <GeneralSummary predictions={sorted}/>
            </Reveal>
          </section>

          <section>
            <Reveal>
              <SectionTitle eyebrow="Next steps" title="What to do with this result"/>
            </Reveal>
            <Reveal delay={0.05}>
              <ul className="glass space-y-3 rounded-xl p-5">
                {GENERAL_NEXT_STEPS.map((t) => (<li key={t} className="flex gap-3 text-sm text-text-dim">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"/>
                    {t}
                  </li>))}
              </ul>
            </Reveal>
          </section>
        </>)}

      <Reveal>
        <div className="glass glow-accent rounded-xl p-8 text-center">
          <h2 className="font-display text-xl text-text">Analyze another X-ray</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-dim">
            Upload a new image to run the model again.
          </p>
          <button onClick={onReset} className="mt-5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-black">
            New analysis
          </button>
          {result.model_version && (<p className="mt-5 font-mono text-xs text-text-dim">model {result.model_version}</p>)}
        </div>
      </Reveal>

      <Reveal>
        <p className="text-center text-xs text-text-dim">
          RadiantXAI is a research and educational project. It is not a medical device and is not
          intended for diagnosis or treatment decisions.
        </p>
      </Reveal>
    </div>);
}
