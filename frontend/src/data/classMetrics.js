/** From evaluate.py — Macro AUC-ROC 0.7762 over 11,679 val images. */
export const AUC_BY_LABEL = {
    Emphysema: 0.8891,
    Cardiomegaly: 0.8684,
    Effusion: 0.8478,
    Hernia: 0.8414,
    Edema: 0.8360,
    Pneumothorax: 0.8230,
    Mass: 0.7663,
    Atelectasis: 0.7556,
    Fibrosis: 0.7532,
    Pleural_Thickening: 0.7351,
    Consolidation: 0.7293,
    Nodule: 0.7088,
    Infiltration: 0.6873,
    Pneumonia: 0.6257,
};
export function aucTier(label) {
    const auc = AUC_BY_LABEL[label];
    if (auc >= 0.8)
        return "strong";
    if (auc >= 0.7)
        return "moderate";
    return "weak";
}
