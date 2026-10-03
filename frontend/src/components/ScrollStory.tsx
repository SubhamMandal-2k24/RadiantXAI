import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { XRAYS } from "../data/xrays";

const FINDINGS = [
  { label: "Cardiomegaly", value: 0.94, color: "var(--color-tier-strong)" },
  { label: "Effusion", value: 0.41, color: "var(--color-tier-strong)" },
  { label: "Atelectasis", value: 0.22, color: "var(--color-tier-moderate)" },
  { label: "Infiltration", value: 0.14, color: "var(--color-tier-weak)" },
];

function Bar({ label, value, color, progress }: {
  label: string;
  value: number;
  color: string;
  progress: MotionValue<number>;
}) {
  const width = useTransform(progress, [0, 1], ["0%", `${value * 100}%`]);
  return (
    <div>
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-text">{label}</span>
        <span className="tabular-nums text-text-dim">{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <motion.div className="h-full rounded-full" style={{ width, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StepText({ n, title, body, progress, range }: {
  n: string;
  title: string;
  body: string;
  progress: MotionValue<number>;
  range: [number, number, number, number];
}) {
  const opacity = useTransform(progress, range, [0, 1, 1, 0]);
  const y = useTransform(progress, range, [28, 0, 0, -28]);
  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ opacity, y }}>
      <p className="font-mono text-xs uppercase tracking-wide text-accent">Step {n} / 03</p>
      <h3 className="mt-3 font-display text-5xl leading-tight text-text sm:text-6xl">{title}</h3>
      <p className="mt-4 max-w-md text-base leading-relaxed text-text-dim">{body}</p>
    </motion.div>
  );
}

export function ScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const xr = XRAYS.find((x) => x.label === "Cardiomegaly") ?? XRAYS[0];
  const cx = xr.box.x + xr.box.w / 2;
  const cy = xr.box.y + xr.box.h / 2;
  const glow = Math.max(20, Math.max(xr.box.w, xr.box.h) * 1.7);

  const imgScale = useTransform(p, [0, 1], [1.02, 1.12]);
  const scanY = useTransform(p, [0.12, 0.42], ["-100%", "0%"]);
  const scanOpacity = useTransform(p, [0.1, 0.14, 0.4, 0.46], [0, 1, 1, 0]);
  const heatClip = useTransform(p, [0.55, 0.85], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
  const barP = useTransform(p, [0.3, 0.55], [0, 1]);
  const stageOpacity = useTransform(p, [0, 0.05], [0.5, 1]);

  return (
    <section ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 lg:grid-cols-2 lg:gap-16">
          <div className="relative h-64 sm:h-72">
            <StepText n="01" title="Upload." progress={p} range={[0, 0.08, 0.26, 0.34]}
              body="Drop in a frontal chest X-ray. It's resized and normalized exactly the way the model was trained."
            />
            <StepText n="02" title="Analyze." progress={p} range={[0.3, 0.4, 0.56, 0.64]}
              body="ResNet-50 scores 14 pathologies in one pass while Grad-CAM traces what drove the top finding."
            />
            <StepText n="03" title="Understand." progress={p} range={[0.6, 0.7, 0.99, 1]}
              body="See the heatmap, the probabilities, and how reliable each class has actually been on held-out data."
            />
          </div>

          <motion.div className="glass glow-accent mx-auto w-full max-w-[18rem] rounded-2xl p-3 sm:max-w-[26rem] lg:max-w-[32rem]"
            style={{ opacity: stageOpacity }}
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
              <motion.div className="absolute inset-0" style={{ scale: imgScale }}>
                <img src={xr.src} alt="Chest X-ray used in the scroll demo" className="h-full w-full object-cover" />
                <motion.div className="absolute inset-0" style={{ clipPath: heatClip }}>
                  <div className="absolute rounded-full"
                    style={{
                      left: `${cx}%`,
                      top: `${cy}%`,
                      width: `${glow}%`,
                      height: `${glow}%`,
                      transform: "translate(-50%, -50%)",
                      mixBlendMode: "screen",
                      background:
                        "radial-gradient(circle, rgba(217,97,63,0.85) 0%, rgba(230,170,60,0.5) 38%, rgba(43,179,163,0.22) 62%, transparent 72%)",
                    }}
                  />
                  <div className="absolute border border-accent shadow-[0_0_22px_rgba(43,179,163,0.7)]"
                    style={{
                      left: `${xr.box.x}%`,
                      top: `${xr.box.y}%`,
                      width: `${xr.box.w}%`,
                      height: `${xr.box.h}%`,
                    }}
                  />
                </motion.div>
              </motion.div>
              <motion.div className="pointer-events-none absolute inset-0"
                style={{
                  y: scanY,
                  opacity: scanOpacity,
                  background:
                    "linear-gradient(to bottom, transparent 82%, rgba(43,179,163,0.35) 97%, #2bb3a3 100%)",
                }}
              />
            </div>
            <div className="mt-4 space-y-2.5 px-1">
              {FINDINGS.map((f) => (
                <Bar key={f.label} label={f.label} value={f.value} color={f.color} progress={barP} />
              ))}
            </div>
            <p className="mt-3 px-1 text-[10px] leading-relaxed text-text-dim">
              Illustrative values. The overlay sits on the NIH-annotated region; real model heatmaps
              appear in the dashboard.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}