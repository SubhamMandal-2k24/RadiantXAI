import { aucTier } from "./classMetrics";
/** One-line, jargon-free description of what each finding means. */
export const PLAIN_DESCRIPTION = {
    Atelectasis: "part of the lung isn't fully inflated",
    Cardiomegaly: "the heart appears larger than usual",
    Effusion: "fluid has built up around the lungs",
    Infiltration: "an unusual substance, like fluid, is present in the lung tissue",
    Mass: "an abnormal growth is visible in the lung",
    Nodule: "a small spot is visible on the lung",
    Pneumonia: "signs of a lung infection",
    Pneumothorax: "air has leaked into the space around the lung, causing it to partially collapse",
    Consolidation: "part of the lung is filled with liquid instead of air",
    Edema: "fluid has built up inside the lungs",
    Emphysema: "the tiny air sacs in the lungs appear damaged",
    Fibrosis: "scarring is visible in the lung tissue",
    Pleural_Thickening: "the lining around the lung appears thickened",
    Hernia: "an organ appears to be pushing through the diaphragm",
};
export function plainLabel(label) {
    return label.replace(/_/g, " ");
}
export function confidenceWord(probability) {
    if (probability >= 0.7)
        return "high";
    if (probability >= 0.4)
        return "moderate";
    return "mild";
}
/** Plain-language caveat about how much to trust this specific class's prediction. */
export function reliabilityCaveat(label) {
    const tier = aucTier(label);
    if (tier === "strong")
        return null; // no caveat needed, model is generally accurate here
    if (tier === "moderate") {
        return "The model is moderately accurate for this condition, so it's worth confirming with a doctor.";
    }
    return "The model is historically less accurate for this specific condition, so treat this as a possible flag rather than a confirmed finding.";
}
