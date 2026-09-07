"""
Class-imbalance-aware loss for multi-label chest X-ray classification.

Why this matters: some conditions (e.g. Hernia) appear in <1% of images,
while others (e.g. Infiltration) appear far more often. A plain BCE loss
would let the model get away with almost always predicting "no disease"
for rare classes and still score well on average. Weighting each class's
loss by how rare it is forces the model to actually try on rare classes too.
"""

import torch
import torch.nn as nn


def compute_pos_weights(label_counts: torch.Tensor, total_samples: int) -> torch.Tensor:
    """
    label_counts: tensor of shape (num_classes,) — how many positive
                  examples exist for each class in the training set.
    total_samples: total number of training images.

    Returns a per-class weight: higher weight for rarer classes.
    Formula: (negatives / positives) for each class — this is the
    standard pos_weight formulation used by BCEWithLogitsLoss.
    """
    positives = label_counts.clamp(min=1)  # avoid divide-by-zero
    negatives = total_samples - label_counts
    return negatives / positives


class WeightedBCELoss(nn.Module):
    def __init__(self, pos_weight: torch.Tensor):
        super().__init__()
        # BCEWithLogitsLoss expects raw logits (matches our model's output,
        # which has no sigmoid applied — see resnet_multilabel.py)
        self.loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    def forward(self, logits, targets):
        return self.loss_fn(logits, targets)