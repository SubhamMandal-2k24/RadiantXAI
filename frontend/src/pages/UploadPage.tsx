import { UploadCard } from "../components/UploadCard";
import { usePrediction } from "../hooks/usePrediction";
import type { PredictionResponse } from "../types/prediction";

interface UploadPageProps {
  onResult: (result: PredictionResponse) => void;
}

export function UploadPage({ onResult }: UploadPageProps) {
  const { mutate, isPending, error } = usePrediction();

  function handleFile(file: File) {
    mutate(file, { onSuccess: onResult });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">RadiantXAI</p>
      <h1 className="mt-2 text-2xl font-semibold text-text">
        Chest X-ray pathology analysis
      </h1>
      <p className="mt-2 text-sm text-text-dim">
        Upload a frontal chest X-ray. The model screens for 14 pathologies and
        highlights the regions it based its findings on.
      </p>
      <div className="mt-8">
        <UploadCard onFileSelected={handleFile} disabled={isPending} />
      </div>
      {isPending && <p className="mt-4 text-sm text-text-dim">Analyzing image…</p>}
      {error && (
        <p role="alert" className="mt-4 text-sm text-finding">
          {error.message}
        </p>
      )}
    </div>
  );
}
