"""
Runner script for ml/explainability/localization_eval.py.

Loads the trained checkpoint, builds the model + GradCAM target layer,
loads the local bbox-annotated image subset (data/bbox_eval/), and
computes real IoU + pointing-game accuracy numbers.

Usage (from the repo root):
    python run_localization_eval.py
"""

import os
import sys
from PIL import Image
import torch

# Make sure the repo root is on sys.path so `ml.` imports resolve,
# regardless of where this script is invoked from.
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, REPO_ROOT)

from ml.models.resnet_multilabel import ChestXrayResNet
from ml.datasets.chestxray_dataset import LABELS
from ml.explainability.localization_eval import (
    load_bbox_data,
    evaluate_localization,
)

# ---- Paths (adjust here if your local layout differs) ----
CHECKPOINT_PATH = os.path.join(REPO_ROOT, "checkpoint.pth")
BBOX_CSV_PATH = os.path.join(REPO_ROOT, "data", "bbox_eval", "BBox_List_2017.csv")
IMAGES_DIR = os.path.join(REPO_ROOT, "data", "bbox_eval", "bbox_images")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def build_flat_path_lookup(images_dir: str) -> dict:
    """
    Unlike training (where images are nested in images_XXX/images/
    subfolders), our downloaded bbox subset is a single flat folder.
    """
    lookup = {}
    for fname in os.listdir(images_dir):
        if fname.lower().endswith(".png"):
            lookup[fname] = os.path.join(images_dir, fname)
    return lookup


def build_original_size_lookup(path_lookup: dict) -> dict:
    """
    Reads each image's actual pixel dimensions (needed to rescale the
    ground-truth bbox coordinates into the model's 224x224 input space).
    NIH images are usually 1024x1024, but this reads the real size
    per-file rather than assuming, in case of any exceptions.
    """
    sizes = {}
    for fname, path in path_lookup.items():
        with Image.open(path) as img:
            sizes[fname] = img.size  # (width, height)
    return sizes


def main():
    print(f"Device: {DEVICE}")

    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(
            f"Checkpoint not found at {CHECKPOINT_PATH}. "
            f"Place checkpoint.pth at the repo root, or edit CHECKPOINT_PATH above."
        )
    if not os.path.exists(BBOX_CSV_PATH):
        raise FileNotFoundError(f"BBox CSV not found at {BBOX_CSV_PATH}.")
    if not os.path.exists(IMAGES_DIR):
        raise FileNotFoundError(f"Images dir not found at {IMAGES_DIR}.")

    print("Loading model + checkpoint...")
    model = ChestXrayResNet(pretrained=False).to(DEVICE)
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    print(f"Loaded checkpoint from epoch {checkpoint.get('epoch', '?')}")

    # Last conv block of ResNet-50 -- standard Grad-CAM target layer.
    target_layer = model.backbone.layer4[-1]

    print("Loading bbox annotations...")
    bbox_df = load_bbox_data(BBOX_CSV_PATH)
    print(f"{len(bbox_df)} bbox annotations loaded, "
          f"{bbox_df['Image Index'].nunique()} unique images.")

    print("Building local image path lookup...")
    path_lookup = build_flat_path_lookup(IMAGES_DIR)
    print(f"{len(path_lookup)} images found locally.")

    print("Reading original image sizes (needed to rescale bboxes)...")
    size_lookup = build_original_size_lookup(path_lookup)

    print("Running Grad-CAM localization evaluation "
          "(this evaluates every bbox-annotated image, may take a few minutes on CPU)...")
    results_df, summary = evaluate_localization(
        model=model,
        bbox_df=bbox_df,
        image_path_lookup=path_lookup,
        original_size_lookup=size_lookup,
        target_layer=target_layer,
        iou_threshold=0.2,
        device=DEVICE,
    )

    print("\n" + "=" * 50)
    print("LOCALIZATION EVALUATION RESULTS")
    print("=" * 50)
    print(f"Images evaluated:        {summary['num_images_evaluated']}")
    print(f"Mean IoU:                {summary['mean_iou']:.4f}")
    print(f"Pointing Game accuracy:  {summary['pointing_game_accuracy']:.4f}")
    print("\nPer-class mean IoU:")
    for label, iou in sorted(summary["per_class_mean_iou"].items(), key=lambda x: -x[1]):
        print(f"  {label:<20} {iou:.4f}")

    out_csv = os.path.join(REPO_ROOT, "localization_eval_results.csv")
    results_df.to_csv(out_csv, index=False)
    print(f"\nPer-image results saved to {out_csv}")


if __name__ == "__main__":
    main()