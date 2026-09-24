"""
Quantitative validation of Grad-CAM explanations against ground-truth
bounding boxes from BBox_List_2017.csv.

Why this matters: most explainability demos just show a heatmap and
call it "interpretable" without ever checking whether the heatmap
actually points at the real pathology. This script computes a
numeric score (IoU and a simpler "pointing game" hit rate) so the
claim "our explanations are accurate" is backed by a number, not
just a picture.

Two metrics are computed per image, since they answer slightly
different questions:

1. Pointing Game hit rate: does the single highest-activation pixel
   in the Grad-CAM heatmap fall inside the ground-truth box? This is
   the standard, widely-used metric in XAI literature (Zhang et al.,
   2018) because it's robust to how exactly you binarize the heatmap.

2. IoU (Intersection over Union): threshold the heatmap into a binary
   region (e.g. top 20% of activation), draw a bounding box around
   it, and compute overlap with the ground-truth box. This is a
   stricter, more informative metric but sensitive to the threshold
   chosen -- report the threshold used alongside the score.
"""

import cv2
import numpy as np
import pandas as pd
import torch
from PIL import Image
from torchvision import transforms

from ml.explainability.gradcam import GradCAM
from ml.labels import LABELS


MODEL_INPUT_SIZE = 224


def load_bbox_data(bbox_csv_path: str) -> pd.DataFrame:
    """
    Loads BBox_List_2017.csv and cleans up its column names.
    The raw header is: 'Image Index,Finding Label,Bbox [x,y,w,h],,,'
    which pandas parses into extra unnamed/empty columns -- drop those.
    """
    df = pd.read_csv(bbox_csv_path)
    df.columns = [c.strip() for c in df.columns]

    cols = list(df.columns)
    rename_map = {
        cols[0]: "Image Index",
        cols[1]: "Finding Label",
        cols[2]: "x",
        cols[3]: "y",
        cols[4]: "w",
        cols[5]: "h",
    }
    df = df.rename(columns=rename_map)
    df = df[["Image Index", "Finding Label", "x", "y", "w", "h"]]

    # BBox_List_2017.csv uses "Infiltrate" but Data_Entry_2017.csv (and
    # our LABELS list) uses "Infiltration" for the same finding -- without
    # this, every Infiltrate annotation gets silently dropped by the
    # `if label not in LABELS` check in evaluate_localization().
    df["Finding Label"] = df["Finding Label"].replace({"Infiltrate": "Infiltration"})

    return df


def rescale_bbox(x, y, w, h, orig_width, orig_height, target_size=MODEL_INPUT_SIZE):
    """
    Converts a bbox from the original image's pixel coordinates into
    the model's 224x224 input coordinate space, so it can be directly
    compared against the Grad-CAM heatmap (which is also 224x224).
    """
    scale_x = target_size / orig_width
    scale_y = target_size / orig_height

    return (
        x * scale_x,
        y * scale_y,
        w * scale_x,
        h * scale_y,
    )


def cam_to_bbox(cam: np.ndarray, threshold: float = 0.2):
    """
    Binarizes a Grad-CAM heatmap (values in [0,1]) at the given
    threshold, then returns the bounding box of the resulting region
    as (x, y, w, h). If nothing exceeds the threshold, returns None.
    """
    mask = cam >= threshold
    if not mask.any():
        return None

    ys, xs = np.where(mask)
    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    return (x_min, y_min, x_max - x_min, y_max - y_min)


def compute_iou(box_a, box_b):
    """
    box format: (x, y, w, h). Returns IoU in [0, 1].
    """
    ax1, ay1, aw, ah = box_a
    ax2, ay2 = ax1 + aw, ay1 + ah

    bx1, by1, bw, bh = box_b
    bx2, by2 = bx1 + bw, by1 + bh

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0, inter_x2 - inter_x1)
    inter_h = max(0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = aw * ah
    area_b = bw * bh
    union_area = area_a + area_b - inter_area

    if union_area == 0:
        return 0.0
    return inter_area / union_area


def pointing_game_hit(cam: np.ndarray, gt_box):
    """
    Returns True if the single highest-activation pixel in the CAM
    falls inside the ground-truth box.
    """
    gx, gy, gw, gh = gt_box
    max_idx = np.unravel_index(np.argmax(cam), cam.shape)
    max_y, max_x = max_idx  # numpy indexing is (row, col) = (y, x)

    return (gx <= max_x <= gx + gw) and (gy <= max_y <= gy + gh)


def evaluate_localization(model, bbox_df: pd.DataFrame, image_path_lookup: dict,
                            original_size_lookup: dict, target_layer,
                            iou_threshold: float = 0.2, device="cpu"):
    """
    Runs Grad-CAM on every image in bbox_df that has a ground-truth box,
    computes IoU and pointing-game hit for each, and returns a summary.

    image_path_lookup: {filename: full_path_on_disk}
    original_size_lookup: {filename: (orig_width, orig_height)}
    """
    cam_generator = GradCAM(model, target_layer)
    transform = transforms.Compose([
        transforms.Resize((MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                              std=[0.229, 0.224, 0.225]),
    ])

    results = []

    for _, row in bbox_df.iterrows():
        filename = row["Image Index"]
        label = row["Finding Label"]

        if label not in LABELS:
            continue
        if filename not in image_path_lookup:
            continue

        class_idx = LABELS.index(label)
        img_path = image_path_lookup[filename]
        orig_w, orig_h = original_size_lookup[filename]

        gt_box = rescale_bbox(row["x"], row["y"], row["w"], row["h"], orig_w, orig_h)

        image = Image.open(img_path).convert("RGB")
        input_tensor = transform(image).unsqueeze(0).to(device)

        cam = cam_generator.generate(input_tensor, class_idx=class_idx)
        # GradCAM.generate() returns the heatmap at the target layer's
        # native spatial resolution (e.g. 7x7 for ResNet-50 layer4), but
        # gt_box above was rescaled into MODEL_INPUT_SIZE (224x224)
        # coordinates. Resize the CAM to match before comparing.
        cam = cv2.resize(cam, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE))

        pred_box = cam_to_bbox(cam, threshold=iou_threshold)
        iou = compute_iou(pred_box, gt_box) if pred_box is not None else 0.0
        hit = pointing_game_hit(cam, gt_box)

        results.append({
            "filename": filename,
            "label": label,
            "iou": iou,
            "pointing_game_hit": hit,
        })

    results_df = pd.DataFrame(results)
    summary = {
        "num_images_evaluated": len(results_df),
        "mean_iou": results_df["iou"].mean() if len(results_df) else 0.0,
        "pointing_game_accuracy": results_df["pointing_game_hit"].mean() if len(results_df) else 0.0,
        "per_class_mean_iou": results_df.groupby("label")["iou"].mean().to_dict() if len(results_df) else {},
    }

    return results_df, summary


if __name__ == "__main__":
    print("This module is meant to be imported and called from a notebook")
    print("or script once a trained model checkpoint is available.")
    print("See ml/explainability/test_localization_eval.py for a usage example.")