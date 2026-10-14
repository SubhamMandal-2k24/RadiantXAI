import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Reveal } from "../components/Reveal";
import { Hero } from "../components/Hero";
import { ScrollStory } from "../components/ScrollStory";
import { SpotlightCard } from "../components/SpotlightCard";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { PRIMARY_BTN } from "../components/buttonStyles";

function SectionTitle({ eyebrow, title, accent }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">{eyebrow}</p>
      <h2 className="font-display mt-3 text-2xl tracking-tight text-text sm:text-3xl">
        {title} {accent && <span className="text-gradient">{accent}</span>}
      </h2>
    </div>
  );
}

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

      {/* Metrics */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <SectionTitle eyebrow="Measured results" title="Numbers you can" accent="check" />
        </Reveal>
        <Reveal delay={0.05}>
          <div className="glass rounded-2xl px-8 py-10">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label}>
                  <p className="font-display text-gradient text-3xl tabular-nums sm:text-4xl">
                    <AnimatedCounter to={m.to} decimals={m.decimals} suffix={m.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-text-dim">{m.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-border pt-5 text-center text-sm text-text-dim">
              Measured on the NIH ChestX-ray14 validation split with the current checkpoint.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <SectionTitle eyebrow="What it does" title="Built to show its" accent="work" />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <SpotlightCard className="h-full p-7 text-center">
                <span className="font-mono text-xs text-accent">{f.n}</span>
                <h3 className="font-display mt-3 text-xl tracking-tight text-text">{f.title}</h3>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-text-dim">
                  {f.body}
                </p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal>
          <div className="glass glow-accent rounded-2xl px-8 py-14 text-center">
            <h2 className="font-display text-2xl tracking-tight text-text sm:text-3xl">
              Try it on a <span className="text-shimmer">chest X-ray</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-text-dim">
              Create a free account, upload a scan, and see the heatmap behind the result.
            </p>
            <div className="mt-8 flex justify-center">
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