import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Brackets } from "./Brackets";
const STEPS = [
    "Preprocessing image",
    "Running ResNet-50 inference",
    "Computing Grad-CAM heatmap",
    "Preparing results",
];
export function AnalyzingStage({ previewUrl }) {
    const [step, setStep] = useState(0);
    // Timed progress indicator: the backend returns one response, not live stage events.
    useEffect(() => {
        const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
        return () => clearInterval(id);
    }, []);
    return (<div className="grid items-center gap-6 sm:grid-cols-2">
      <div className="glass relative aspect-square overflow-hidden rounded-xl bg-black">
        <img src={previewUrl} alt="Uploaded X-ray being analyzed" className="h-full w-full object-contain opacity-80"/>
        <motion.div className="pointer-events-none absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-accent/35 to-transparent" animate={{ top: ["-20%", "100%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}/>
        <Brackets active/>
      </div>
      <ul className="space-y-3">
        {STEPS.map((label, i) => (<motion.li key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3 font-mono text-sm">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${i < step
                ? "border-accent bg-accent text-black"
                : i === step
                    ? "animate-pulse border-accent text-accent"
                    : "border-border-strong text-text-dim"}`}>
              {i < step ? "✓" : ""}
            </span>
            <span className={i <= step ? "text-text" : "text-text-dim"}>{label}</span>
          </motion.li>))}
      </ul>
    </div>);
}
