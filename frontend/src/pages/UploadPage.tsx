import { UploadCard } from "../components/UploadCard";
import { usePrediction } from "../hooks/usePrediction";
import { ApiError } from "../api/client";
import type { PredictionResponse } from "../types/prediction";

interface UploadPageProps {
  onResult: (result: PredictionResponse) => void;
}

function errorMessage(error: Error): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return "The analysis model isn't ready yet on the server. Try again in a moment.";
    }
    if (error.status === 413) {
      return "That file is too large for the server to accept.";
    }
    if (error.status === 415) {
      return "The server couldn't process that file type. Try a PNG or JPEG.";
    }
    if (error.status === 0) {
      return error.message; // network/connection failure, ApiError message is already specific
    }
  }
  return error.message;
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
          {errorMessage(error)}
        </p>
      )}
    </div>
  );
}