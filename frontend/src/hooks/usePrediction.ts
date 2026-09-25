import { useMutation } from "@tanstack/react-query";
import { predictImage, ApiError } from "../api/client";
import type { PredictionResponse } from "../types/prediction";

export function usePrediction() {
  return useMutation<PredictionResponse, ApiError, File>({
    mutationFn: (file: File) => predictImage(file),
  });
}