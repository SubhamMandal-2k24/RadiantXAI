import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Reveal } from "../components/Reveal";
import { Hero } from "../components/Hero";
import { ScrollStory } from "../components/ScrollStory";
import { SpotlightCard } from "../components/SpotlightCard";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { PRIMARY_BTN } from "../components/buttonStyles";

const METRICS = [
  { label: "Macro AUC-ROC", to: 0.776, decimals: 3, suffix: "" },
  { label: "Mean calibration error", to: 0.068, decimals: 3, suffix: "" },
  { label: "Localization IoU", to: 0.184, decimals: 3, suffix: "" },
  { label: "Pointing-game hit rate", to: 39.6, decimals: 1, suffix: "%" },
];

const FEATURES = [
  {
    n: "01",
    title: "14 pathologies, one scan",
    body: "Atelectasis, Cardiomegaly, Effusion and 11 more findings scored in a single forward pass.",
  },
  {
    n: "02",
    title: "See what the model saw",
    body: "Grad-CAM heatmaps highlight the regions behind the top finding, so the result isn't a black box.",
  },
  {
    n: "03",
    title: "Reliability, not just probability",
    body: "Every class carries its measured AUC and its own decision threshold, tuned on validation data.",
  },
  {
    n: "04",
    title: "Two ways to read results",
    body: "Technicians get localization and per-class detail. Everyone else gets a plain-language summary.",
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const ctaTo = isAuthenticated ? "/dashboard" : "/signup";

  return (
    <div>
      <Hero />

      <ScrollStory />

      <section className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="glass rounded-2xl px-8 py-9">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label}>
                  <p className="font-display text-3xl tabular-nums text-text">
                    <AnimatedCounter to={m.to} decimals={m.decimals} suffix={m.suffix} />
                  </p>
                  <p className="mt-2 text-xs text-text-dim">{m.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 border-t border-border pt-4 text-xs text-text-dim">
              Measured on the NIH ChestX-ray14 validation split with the current baseline checkpoint.
              Published as-is, including the weak spots.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">What it does</p>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <SpotlightCard className="h-full p-6">
                <span className="font-mono text-xs text-accent">{f.n}</span>
                <h3 className="mt-3 font-display text-xl text-text">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-dim">{f.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Reveal>
          <div className="glass glow-accent rounded-2xl px-8 py-12 text-center">
            <h2 className="font-display text-2xl text-text sm:text-3xl">
              Try it on a <span className="text-shimmer">chest X-ray</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-text-dim">
              Create a free account, upload a scan, and see the heatmap behind the result.
            </p>
            <div className="mt-7 flex justify-center">
              <Link to={ctaTo} className={PRIMARY_BTN}>
                {isAuthenticated ? "Go to dashboard" : "Get started"}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}