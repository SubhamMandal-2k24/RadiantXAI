import { HeatmapOverlay } from "../components/HeatmapOverlay";
import { PredictionBar } from "../components/PredictionBar";
import { MethodologyNote } from "../components/MethodologyNote";
import type { PredictionResponse } from "../types/prediction";

interface ResultsPageProps {
  result: PredictionResponse;
  onReset: () => void;
}

export function ResultsPage({ result, onReset }: ResultsPageProps) {
  const sorted = [...result.predictions].sort((a, b) => b.probability - a.probability);
  const topFinding = sorted[0];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
          <h1 className="mt-1 text-xl font-semibold text-text">Analysis result</h1>
        </div>
        <button onClick={onReset} className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-dim hover:border-accent hover:text-text">
          Analyze another
        </button>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium text-text-dim">Original vs. Grad-CAM localization</h2>
          {topFinding && (
            <HeatmapOverlay
              originalUrl={result.original_url}
              heatmapUrl={result.heatmap_url}
              topLabel={topFinding.label}
            />
          )}
          <MethodologyNote />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium text-text-dim">Pathology probabilities</h2>
          <div className="rounded-md border border-border bg-panel p-4">
            {sorted.map((p) => (
              <PredictionBar key={p.label} label={p.label} probability={p.probability} />
            ))}
          </div>
          {topFinding && topFinding.probability >= 0.5 && (
            <p className="mt-3 text-xs text-text-dim">
              Highest-confidence finding: {topFinding.label.replace(/_/g, " ")} — the heatmap shows the regions the model weighted most.
            </p>
          )}
          {result.model_version && (
            <p className="mt-2 font-mono text-xs text-text-dim">model {result.model_version}</p>
          )}
        </div>
      </div>
    </div>
  );
}