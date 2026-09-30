import os

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import f1_score

from ml.labels import LABELS
from calibration import compute_ece

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
PREDICTIONS_PATH = os.path.join(REPO_ROOT, "val_predictions.npz")

EPS = 1e-7


def probs_to_logits(probs: np.ndarray) -> np.ndarray:
    p = np.clip(probs, EPS, 1 - EPS)
    return np.log(p / (1 - p))


def fit_temperature(logits: np.ndarray, labels: np.ndarray, lr: float = 0.01, max_iter: int = 200) -> float:
    logits_t = torch.tensor(logits, dtype=torch.float32)
    labels_t = torch.tensor(labels, dtype=torch.float32)

    log_temperature = torch.zeros(1, requires_grad=True)
    optimizer = torch.optim.LBFGS([log_temperature], lr=lr, max_iter=max_iter)
    criterion = torch.nn.BCEWithLogitsLoss()

    def closure():
        optimizer.zero_grad()
        temperature = torch.exp(log_temperature)
        loss = criterion(logits_t / temperature, labels_t)
        loss.backward()
        return loss

    optimizer.step(closure)
    return float(torch.exp(log_temperature).item())


def optimize_thresholds(probs: np.ndarray, labels: np.ndarray):
    results = []
    candidate_thresholds = np.linspace(0.05, 0.95, 19)

    for i, label_name in enumerate(LABELS):
        y_true = labels[:, i]
        y_prob = probs[:, i]

        pos_count = int(y_true.sum())
        if pos_count == 0 or pos_count == len(y_true):
            results.append({
                "label": label_name, "best_threshold": None,
                "f1_at_0.5": None, "f1_at_best": None, "note": "skipped -- only one class present",
            })
            continue

        f1_at_default = f1_score(y_true, (y_prob >= 0.5).astype(int), zero_division=0)

        best_t, best_f1 = 0.5, f1_at_default
        for t in candidate_thresholds:
            f1 = f1_score(y_true, (y_prob >= t).astype(int), zero_division=0)
            if f1 > best_f1:
                best_t, best_f1 = t, f1

        results.append({
            "label": label_name, "best_threshold": round(float(best_t), 2),
            "f1_at_0.5": round(float(f1_at_default), 4),
            "f1_at_best": round(float(best_f1), 4), "note": "",
        })

    return pd.DataFrame(results)


def main():
    if not os.path.exists(PREDICTIONS_PATH):
        raise FileNotFoundError(
            f"{PREDICTIONS_PATH} not found. Run evaluate.py first -- "
            f"it saves the raw predictions this script reuses."
        )

    data = np.load(PREDICTIONS_PATH)
    probs = data["probs"]
    labels = data["labels"]

    print("Fitting temperature scaling...")
    logits = probs_to_logits(probs)
    temperature = fit_temperature(logits, labels)
    print(f"Fitted temperature: T = {temperature:.4f}")
    print("(T > 1 means the model was overconfident; T < 1 means underconfident.)")

    calibrated_logits = logits / temperature
    calibrated_probs = 1 / (1 + np.exp(-calibrated_logits))

    print("\nComputing ECE before vs. after temperature scaling...")
    ece_rows = []
    for i, label_name in enumerate(LABELS):
        y_true = labels[:, i]
        pos_count = int(y_true.sum())
        if pos_count == 0 or pos_count == len(y_true):
            ece_rows.append({"label": label_name, "ece_before": None, "ece_after": None})
            continue

        ece_before, *_ = compute_ece(y_true, probs[:, i])
        ece_after, *_ = compute_ece(y_true, calibrated_probs[:, i])
        ece_rows.append({
            "label": label_name,
            "ece_before": round(float(ece_before), 4),
            "ece_after": round(float(ece_after), 4),
        })

    ece_df = pd.DataFrame(ece_rows)
    valid = ece_df.dropna()
    print(f"\nMean ECE before: {valid['ece_before'].mean():.4f}")
    print(f"Mean ECE after:  {valid['ece_after'].mean():.4f}")
    print("\nPer-class ECE before vs. after:")
    for _, row in ece_df.iterrows():
        if row["ece_before"] is not None:
            print(f"  {row['label']:<20} before: {row['ece_before']:.4f}   after: {row['ece_after']:.4f}")

    ece_df.to_csv(os.path.join(REPO_ROOT, "temperature_scaling_results.csv"), index=False)

    with open(os.path.join(REPO_ROOT, "temperature_value.txt"), "w") as f:
        f.write(str(temperature))
    print(f"\nFitted temperature saved to temperature_value.txt (T = {temperature:.4f})")
    print("Full before/after ECE saved to temperature_scaling_results.csv")

    print("\n" + "=" * 60)
    print("Optimizing per-class decision thresholds...")
    threshold_df = optimize_thresholds(probs, labels)
    threshold_df.to_csv(os.path.join(REPO_ROOT, "threshold_optimization_results.csv"), index=False)

    print("\nPer-class thresholds (sorted by F1 improvement, best to worst):")
    display_df = threshold_df.dropna(subset=["f1_at_best"]).copy()
    display_df["f1_gain"] = display_df["f1_at_best"] - display_df["f1_at_0.5"]
    display_df = display_df.sort_values("f1_gain", ascending=False)
    for _, row in display_df.iterrows():
        print(f"  {row['label']:<20} threshold: {row['best_threshold']:.2f}  "
              f"F1@0.5: {row['f1_at_0.5']:.4f}  F1@best: {row['f1_at_best']:.4f}  "
              f"gain: {row['f1_gain']:+.4f}")

    print(f"\nFull results saved to threshold_optimization_results.csv")


if __name__ == "__main__":
    main()
