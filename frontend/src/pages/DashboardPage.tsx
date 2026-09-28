import { useState } from "react";
import type { PredictionResponse } from "../types/prediction";
import { ResultsPage } from "./ResultsPage";
import { UploadPage } from "./UploadPage";

export function DashboardPage() {
  const [result, setResult] = useState<PredictionResponse | null>(null);

  return result ? (
    <ResultsPage result={result} onReset={() => setResult(null)} />
  ) : (
    <UploadPage onResult={setResult} />
  );
}