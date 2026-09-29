import type { PathologyScore } from "../types/prediction";
import { confidenceWord, PLAIN_DESCRIPTION, plainLabel, reliabilityCaveat } from "../data/plainLanguage";

interface GeneralSummaryProps {
  predictions: PathologyScore[];
}

const NOTABLE_THRESHOLD = 0.15;
const MAX_FINDINGS = 3;

export function GeneralSummary({ predictions }: GeneralSummaryProps) {
  const notable = [...predictions]
    .filter((p) => p.probability >= NOTABLE_THRESHOLD)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, MAX_FINDINGS);

  return (
    <div className="rounded-md border border-border bg-panel p-5">
      <h2 className="text-sm font-medium text-text">What the scan shows</h2>

      {notable.length === 0 ? (
        <p className="mt-3 text-sm text-text-dim">
          No strong signs of the 14 conditions this tool screens for were detected. This isn't a
          guarantee the scan is normal — it only reflects what this specific model looked for.
        </p>
      ) : (
        <div className="mt-3 space-y-4">
          {notable.map((p) => {
            const confidence = confidenceWord(p.probability);
            const caveat = reliabilityCaveat(p.label);
            return (
              <div key={p.label} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <p className="text-sm text-text">
                  <span className="font-medium">{plainLabel(p.label)}</span> — {PLAIN_DESCRIPTION[p.label]}.
                </p>
                <p className="mt-1 text-xs text-text-dim">
                  The model's confidence in this finding is <span className="text-text">{confidence}</span>{" "}
                  ({Math.round(p.probability * 100)}%).
                </p>
                {caveat && <p className="mt-1 text-xs text-text-dim">{caveat}</p>}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 border-t border-border pt-3 text-xs text-text-dim">
        This tool doesn't diagnose anything. Please share these results with a doctor, who can
        interpret them alongside your symptoms and history.
      </p>
    </div>
  );
}