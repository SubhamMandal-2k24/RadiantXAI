"""
Evaluation script: computes per-class AUC-ROC (and supporting metrics)
on the validation set for the trained multi-label chest X-ray classifier.

Why AUC-ROC specifically: unlike accuracy, AUC-ROC is threshold-independent
and robust to class imbalance (several of the 14 findings are rare), so
it's the standard metric for judging multi-label medical classifiers.
This gives a much more honest signal than the raw validation loss alone
for whether the model has learned real signal per class, or is only
doing well on a few common findings while failing on rare ones.

Usage (run from the repo root):
    python evaluate.py

Needs the full validation set images (not just the bbox subset), so
this is meant to be run on Kaggle where the dataset is attached, using
the same paths train.py uses. It also runs locally if ROOT_DIR is
pointed at a local copy of the dataset.
"""

import os
import sys

import numpy as np
import pandas as pd
import torch
from sklearn.metrics import roc_auc_score, average_precision_score
from torch.utils.data import DataLoader
from torchvision import transforms

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, REPO_ROOT)

from ml.models.resnet_multilabel import ChestXrayResNet
from ml.datasets.chestxray_dataset import ChestXrayDataset, LABELS

# ---- Paths (matches train.py's convention -- override via env vars if needed) ----
ROOT_DIR = os.environ.get("RADIANTXAI_ROOT_DIR", "/kaggle/input/datasets/nih-chest-xrays/data")
VAL_CSV = os.environ.get("RADIANTXAI_VAL_CSV", os.path.join(REPO_ROOT, "data", "splits", "val.csv"))
CHECKPOINT_PATH = os.environ.get("RADIANTXAI_CHECKPOINT", os.path.join(REPO_ROOT, "checkpoint.pth"))

BATCH_SIZE = 32
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def run_inference(model, loader, device):
    """
    Runs the model over the full loader and collects raw sigmoid
    probabilities + true labels for every image, needed to compute
    AUC-ROC (which needs continuous scores, not just hard predictions).
    """
    all_probs = []
    all_labels = []

    model.eval()
    with torch.no_grad():
        for batch_idx, (images, labels) in enumerate(loader):
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).cpu().numpy()

            all_probs.append(probs)
            all_labels.append(labels.numpy())

            if batch_idx % 50 == 0:
                print(f"Batch {batch_idx}/{len(loader)}")

    all_probs = np.concatenate(all_probs, axis=0)
    all_labels = np.concatenate(all_labels, axis=0)
    return all_probs, all_labels


def compute_per_class_metrics(probs: np.ndarray, labels: np.ndarray):
    """
    Computes AUC-ROC and Average Precision per class. Skips a class if
    it has only one label value present in the val set (AUC is undefined
    in that case -- this can happen for very rare findings).
    """
    results = []
    for i, label_name in enumerate(LABELS):
        y_true = labels[:, i]
        y_score = probs[:, i]

        pos_count = int(y_true.sum())
        neg_count = int(len(y_true) - pos_count)

        if pos_count == 0 or neg_count == 0:
            results.append({
                "label": label_name,
                "auc_roc": None,
                "avg_precision": None,
                "positive_count": pos_count,
                "note": "skipped -- only one class present in val set",
            })
            continue

        auc = roc_auc_score(y_true, y_score)
        ap = average_precision_score(y_true, y_score)

        results.append({
            "label": label_name,
            "auc_roc": auc,
            "avg_precision": ap,
            "positive_count": pos_count,
            "note": "",
        })

    return pd.DataFrame(results)


def main():
    print(f"Device: {DEVICE}")

    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Checkpoint not found at {CHECKPOINT_PATH}")
    if not os.path.exists(VAL_CSV):
        raise FileNotFoundError(f"Val split not found at {VAL_CSV}")
    if not os.path.exists(ROOT_DIR):
        raise FileNotFoundError(f"Dataset root not found at {ROOT_DIR}")

    print("Loading model + checkpoint...")
    model = ChestXrayResNet(pretrained=False).to(DEVICE)
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state"])
    print(f"Loaded checkpoint from epoch {checkpoint.get('epoch', '?')}")

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    print("Loading validation set...")
    val_dataset = ChestXrayDataset(VAL_CSV, ROOT_DIR, transform=transform)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)
    print(f"Validation set size: {len(val_dataset)}")

    print("Running inference over validation set...")
    probs, labels = run_inference(model, val_loader, DEVICE)

    print("Computing per-class AUC-ROC and Average Precision...")
    metrics_df = compute_per_class_metrics(probs, labels)

    # Macro-average AUC-ROC across classes that had valid scores.
    valid_aucs = metrics_df["auc_roc"].dropna()
    macro_auc = valid_aucs.mean() if len(valid_aucs) else float("nan")

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS (Validation Set)")
    print("=" * 60)
    print(f"Validation images evaluated: {len(val_dataset)}")
    print(f"Macro-average AUC-ROC:       {macro_auc:.4f}")
    print("\nPer-class results (sorted by AUC-ROC, best to worst):")
    display_df = metrics_df.sort_values("auc_roc", ascending=False, na_position="last")
    for _, row in display_df.iterrows():
        if row["auc_roc"] is not None:
            print(f"  {row['label']:<20} AUC: {row['auc_roc']:.4f}  "
                  f"AP: {row['avg_precision']:.4f}  (n_pos={row['positive_count']})")
        else:
            print(f"  {row['label']:<20} {row['note']} (n_pos={row['positive_count']})")

    out_csv = os.path.join(REPO_ROOT, "evaluation_results.csv")
    metrics_df.to_csv(out_csv, index=False)
    print(f"\nFull per-class results saved to {out_csv}")

    # Also save raw probabilities + labels, useful for calibration.py
    # without needing to re-run inference.
    np.savez(
        os.path.join(REPO_ROOT, "val_predictions.npz"),
        probs=probs,
        labels=labels,
    )
    print(f"Raw predictions saved to {os.path.join(REPO_ROOT, 'val_predictions.npz')} (used by calibration.py)")


if __name__ == "__main__":
    main()