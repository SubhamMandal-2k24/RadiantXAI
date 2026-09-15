export const PATHOLOGY_LABELS = [
  "Atelectasis",
  "Cardiomegaly",
  "Effusion",
  "Infiltration",
  "Mass",
  "Nodule",
  "Pneumonia",
  "Pneumothorax",
  "Consolidation",
  "Edema",
  "Emphysema",
  "Fibrosis",
  "Pleural_Thickening",
  "Hernia",
] as const;

export type PathologyLabel = (typeof PATHOLOGY_LABELS)[number];

export interface PathologyScore {
  label: PathologyLabel;
  probability: number;
}

export interface PredictionResponse {
  predictions: PathologyScore[];
  original_url: string;
  heatmap_url: string;
  model_version?: string;
}

export interface PredictionError {
  detail: string;
}
