import { useMutation } from "@tanstack/react-query";
import { predictImage } from "../api/client";

export function usePrediction() {
  return useMutation({
    mutationFn: (file: File) => predictImage(file),
  });
}
