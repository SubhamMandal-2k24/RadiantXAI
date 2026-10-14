import { Link } from "react-router-dom";
import { motion } from "motion/react";

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

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

const STEPS = [
  {
    n: "01",
    title: "Upload",
    body: "You upload a frontal chest X-ray (PNG or JPEG). It is resized and normalized exactly the way the model was trained.",
  },
  {
    n: "02",
    title: "Screen",
    body: "A ResNet-50 network scores the image against 14 thoracic pathologies at once, since one X-ray can show several findings.",
  },
  {
    n: "03",
    title: "Explain",
    body: "Grad-CAM draws a heatmap of the regions that drove the top prediction, so the result can be inspected instead of trusted blindly.",
  },
];

const METRICS = [
  { value: "0.776", label: "Macro AUC-ROC", note: "14 classes, 11,679 validation images" },
  { value: "0.068", label: "Mean ECE", note: "calibration error, lower is better" },
  { value: "0.184", label: "Mean IoU", note: "heatmap vs. radiologist boxes" },
  { value: "39.6%", label: "Pointing game", note: "heatmap peak lands inside the box" },
];

const ROLES = [
  {
    title: "Medical technician",
    body: "Sees the technical view: probabilities for all 14 pathologies, per-class AUC reliability tiers, per-class flag thresholds, the Grad-CAM overlay with blend and side-by-side modes, and a methodology note with the localization numbers.",
  },
  {
    title: "General user",
    body: "Sees a plain-language summary of the most likely findings in simple wording, with the same heatmap. The explanations are rule-based templates, not generated text, so they stay predictable.",
  },
];

const BUILD = [
  {
    title: "Data and splitting",
    body: "NIH ChestX-ray14 (112,120 images). Patients are split 80/10/10 so no patient appears in more than one split, which prevents the leakage that inflates many public results.",
  },
  {
    title: "Model and loss",
    body: "ImageNet-pretrained ResNet-50 with a 14-way multi-label head. Weighted binary cross-entropy compensates for rare pathologies.",
  },
  {
    title: "Explainability, measured",
    body: "Grad-CAM is validated against NIH's ground-truth bounding boxes (984 annotations) with IoU and a pointing-game test, rather than judged by eye.",
  },
  {
    title: "Calibration and thresholds",
    body: "Calibration is measured with ECE and reliability diagrams. Per-class decision thresholds are tuned on the validation set, so a flag does not rely on a flat 50% cutoff.",
  },
  {
    title: "Serving",
    body: "A FastAPI backend with JWT authentication loads the trained checkpoint and returns predictions plus the heatmap. It is containerized with Docker and covered by automated tests running in CI.",
  },
];

const STACK = [
  "PyTorch",
  "ResNet-50",
  "Grad-CAM",
  "FastAPI",
  "SQLite + SQLAlchemy",
  "JWT auth",
  "React + JavaScript",
  "Tailwind CSS",
  "TanStack Query",
  "Docker",
  "GitHub Actions",
  "pytest",
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-28 px-6 py-16">
      {/* Hero */}
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            About the project
          </p>
          <h1 className="font-display mt-4 text-3xl tracking-tight text-text sm:text-4xl">
            About <span className="text-gradient">RadiantXAI</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-dim">
            Most medical-imaging models give an answer and nothing else. RadiantXAI is a
            full-stack system that screens a chest X-ray for 14 pathologies, highlights the
            regions behind its top finding, and reports how reliable each prediction is:
            measured accuracy, calibration and localization quality, not just a confidence
            number.
          </p>
        </div>
      </Reveal>

      {/* How it works */}
      <section>
        <Reveal>
          <SectionTitle eyebrow="How it works"/>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="glass h-full rounded-xl p-6 text-center">
                <span className="font-mono text-xs text-accent">{s.n}</span>
                <h3 className="font-display mt-2 text-lg tracking-tight text-text">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-dim">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Metrics */}
      <section>
        <Reveal>
          <SectionTitle eyebrow="Measured results" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.06}>
              <div className="glass h-full rounded-xl p-6 text-center">
                <p className="font-display text-gradient text-3xl">{m.value}</p>
                <p className="mt-2 text-[15px] font-medium text-text">{m.label}</p>
                <p className="mt-1 text-sm leading-snug text-text-dim">{m.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-text-dim">
            Evaluated on held-out patients from the NIH ChestX-ray14 dataset.
          </p>
        </Reveal>
      </section>

      {/* Roles */}
      <section>
        <Reveal>
          <SectionTitle eyebrow="Two views"/>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          {ROLES.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.08}>
              <div className="glass h-full rounded-xl p-6 text-center">
                <h3 className="font-display text-lg tracking-tight text-text">{r.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-dim">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Build */}
      <section>
        <Reveal>
          <SectionTitle eyebrow="Under the hood" title="How it was" accent="built" />
        </Reveal>
        <div className="space-y-3">
          {BUILD.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.01}>
              <div className="glass flex gap-4 rounded-xl p-6">
                <span className="pt-0.5 font-mono text-xs text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-base tracking-tight text-text">{b.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-text-dim">{b.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {STACK.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border-strong px-3 py-1 font-mono text-xs text-text-dim"
              >
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal>
        <div className="glass glow-accent rounded-xl p-8 text-center">
          <h2 className="font-display text-2xl tracking-tight text-text sm:text-3xl">
            Try it on a <span className="text-gradient">chest X-ray</span>
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black"
            >
              Get started
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-text-dim">
            RadiantXAI is a research and educational project. It is not a medical device and is
            not intended for diagnosis or treatment decisions.
          </p>
        </div>
      </Reveal>
    </div>
  );
}