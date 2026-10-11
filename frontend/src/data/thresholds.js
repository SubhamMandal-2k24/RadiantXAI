/** Per-class F1-optimal decision threshold, from threshold_optimization_results.csv
 * (temperature_scaling.py). Falls back to 0.5 for any class not listed. */
export const OPTIMAL_THRESHOLD = {
    Hernia: 0.90,
    Consolidation: 0.20,
    Pneumonia: 0.05,
    Pneumothorax: 0.25,
    Edema: 0.40,
    Effusion: 0.60,
    Pleural_Thickening: 0.35,
    Atelectasis: 0.35,
    Emphysema: 0.60,
    Fibrosis: 0.20,
    Nodule: 0.50,
    Mass: 0.50,
    Infiltration: 0.50,
    Cardiomegaly: 0.50,
};
export function isFlagged(label, probability) {
    return probability >= (OPTIMAL_THRESHOLD[label] ?? 0.5);
}
