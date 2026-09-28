import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";

const FEATURES = [
  {
    title: "14 pathologies, one scan",
    body: "A deep-learning model scores a frontal chest X-ray for Atelectasis, Cardiomegaly, Effusion, and 11 more findings in a single pass.",
  },
  {
    title: "See what the model saw",
    body: "Grad-CAM heatmaps highlight the regions that most influenced the top finding, so the result isn't a black box.",
  },
  {
    title: "Two ways to read results",
    body: "Technicians get per-class reliability and localization detail. Everyone else gets a plain-language summary.",
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold text-text sm:text-4xl">
        See why the model flagged your chest X-ray
      </h1>
      <p className="mt-4 max-w-2xl text-base text-text-dim">
        Upload a frontal chest X-ray and get probabilities for 14 common pathologies, together with a
        heatmap showing the regions behind the top finding.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {isAuthenticated ? (
          <Link to="/dashboard" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90">
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link to="/signup" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-black hover:opacity-90">
              Get started
            </Link>
            <Link to="/login" className="rounded-md border border-border-strong px-4 py-2 text-sm text-text-dim hover:border-accent hover:text-text">
              Log in
            </Link>
          </>
        )}
        <Link to="/about" className="rounded-md px-4 py-2 text-sm text-text-dim hover:text-text">
          How it works →
        </Link>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-md border border-border bg-panel p-5">
            <h2 className="text-sm font-medium text-text">{f.title}</h2>
            <p className="mt-2 text-sm text-text-dim">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}