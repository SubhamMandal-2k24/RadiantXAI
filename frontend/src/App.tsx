import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadPage } from "./pages/UploadPage";
import { ResultsPage } from "./pages/ResultsPage";
import type { PredictionResponse } from "./types/prediction";

const queryClient = new QueryClient();

export default function App() {
  const [result, setResult] = useState<PredictionResponse | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-bg">
        {result ? (
          <ResultsPage result={result} onReset={() => setResult(null)} />
        ) : (
          <UploadPage onResult={setResult} />
        )}
      </div>
    </QueryClientProvider>
  );
}
