"""
Calibration analysis: computes Expected Calibration Error (ECE) and
generates reliability diagrams from the validation predictions saved
by evaluate.py.

Why this matters for a "GlassBox" interpretability-focused project:
a model can have decent AUC-ROC (good at ranking positive vs negative
cases) while still being badly *miscalibrated* (a "70% probability"
prediction doesn't actually mean the finding is present 70% of the
time). For a clinical decision-support framing, calibration is just
as important as raw discrimination -- a clinician needs the
confidence score itself to be meaningfully interpretable, not just
the ranking.

Usage (run from the repo root, AFTER evaluate.py has been run at
least once -- this reuses val_predictions.npz instead of re-running
inference):
    python calibration.py
"""

import os

import matplotlib
matplotlib.use("Agg")  # headless backend, no display needed
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
PREDICTIONS_PATH = os.path.join(REPO_ROOT, "val_predictions.npz")

LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass",
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
]

N_BINS = 10


def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = N_BINS):
    """
    Expected Calibration Error: bins predictions by confidence, and
    for each bin, measures |mean predicted probability - actual
    fraction positive|, weighted by how many predictions fall in
    that bin. A perfectly calibrated model has ECE = 0.

    Returns (ece, bin_confidences, bin_accuracies, bin_counts) so
    the caller can also draw a reliability diagram from the same bins.
    """
    bin_edges = np.linspace(0, 1, n_bins + 1)
    bin_confidences = []
    bin_accuracies = []
    bin_counts = []

    ece = 0.0
    n = len(y_true)

    for i in range(n_bins):
        lo, hi = bin_edges[i], bin_edges[i + 1]
        # Include the right edge only in the last bin.
        if i == n_bins - 1:
            mask = (y_prob >= lo) & (y_prob <= hi)
        else:
            mask = (y_prob >= lo) & (y_prob < hi)

        count = mask.sum()
        if count == 0:
            bin_confidences.append(np.nan)
            bin_accuracies.append(np.nan)
            bin_counts.append(0)
            continue

        avg_confidence = y_prob[mask].mean()
        avg_accuracy = y_true[mask].mean()

        bin_confidences.append(avg_confidence)
        bin_accuracies.append(avg_accuracy)
        bin_counts.append(int(count))

        ece += (count / n) * abs(avg_confidence - avg_accuracy)

    return ece, bin_confidences, bin_accuracies, bin_counts


def plot_reliability_diagram(bin_confidences, bin_accuracies, bin_counts,
                               label_name: str, ece: float, out_path: str):
    """
    Standard reliability diagram: predicted confidence (x) vs actual
    observed frequency (y), with the diagonal representing perfect
    calibration. Bars below the diagonal mean overconfidence; above
    means underconfidence.
    """
    bin_edges = np.linspace(0, 1, N_BINS + 1)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    fig, ax = plt.subplots(figsize=(5, 5))
    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Perfect calibration")

    valid = [i for i, c in enumerate(bin_counts) if c > 0]
    xs = [bin_centers[i] for i in valid]
    ys = [bin_accuracies[i] for i in valid]
    ax.bar(xs, ys, width=1.0 / N_BINS, alpha=0.7, edgecolor="black",
           label="Model")

    ax.set_xlabel("Predicted probability (confidence)")
    ax.set_ylabel("Observed frequency (actual positive rate)")
    ax.set_title(f"{label_name}\nECE = {ece:.4f}")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.legend(loc="upper left")
    fig.tight_layout()
    fig.savefig(out_path, dpi=120)
    plt.close(fig)


def main():
    if not os.path.exists(PREDICTIONS_PATH):
        raise FileNotFoundError(
            f"{PREDICTIONS_PATH} not found. Run evaluate.py first -- "
            f"it saves the raw predictions this script reuses."
        )

    data = np.load(PREDICTIONS_PATH)
    probs = data["probs"]
    labels = data["labels"]

    out_dir = os.path.join(REPO_ROOT, "calibration_plots")
    os.makedirs(out_dir, exist_ok=True)

    results = []
    print("Computing per-class calibration (ECE)...")
    for i, label_name in enumerate(LABELS):
        y_true = labels[:, i]
        y_prob = probs[:, i]

        pos_count = int(y_true.sum())
        if pos_count == 0 or pos_count == len(y_true):
            results.append({"label": label_name, "ece": None,
                             "note": "skipped -- only one class present"})
            continue

        ece, bin_conf, bin_acc, bin_counts = compute_ece(y_true, y_prob)
        results.append({"label": label_name, "ece": ece, "note": ""})

        plot_path = os.path.join(out_dir, f"{label_name}_reliability.png")
        plot_reliability_diagram(bin_conf, bin_acc, bin_counts, label_name, ece, plot_path)

    results_df = pd.DataFrame(results)

    valid_ece = results_df["ece"].dropna()
    mean_ece = valid_ece.mean() if len(valid_ece) else float("nan")

    print("\n" + "=" * 60)
    print("CALIBRATION RESULTS (Validation Set)")
    print("=" * 60)
    print(f"Mean ECE across classes: {mean_ece:.4f}")
    print("(Lower is better -- 0 = perfectly calibrated. As a rough")
    print(" guide, ECE < 0.05 is considered well-calibrated, 0.05-0.15")
    print(" is moderate miscalibration, > 0.15 is poorly calibrated.)")
    print("\nPer-class ECE (sorted, best to worst):")
    display_df = results_df.sort_values("ece", na_position="last")
    for _, row in display_df.iterrows():
        if row["ece"] is not None:
            print(f"  {row['label']:<20} ECE: {row['ece']:.4f}")
        else:
            print(f"  {row['label']:<20} {row['note']}")

    out_csv = os.path.join(REPO_ROOT, "calibration_results.csv")
    results_df.to_csv(out_csv, index=False)
    print(f"\nFull results saved to {out_csv}")
    print(f"Reliability diagrams saved to {out_dir}/")


if __name__ == "__main__":
    main()