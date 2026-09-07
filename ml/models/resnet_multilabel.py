"""
ResNet-50 backbone adapted for multi-label chest X-ray classification.
Replaces the final ImageNet 1000-class layer with a 14-way sigmoid head
(one output per pathology, since an image can have multiple conditions).
"""

import torch.nn as nn
import torchvision.models as models

NUM_CLASSES = 14  # matches LABELS in chestxray_dataset.py


class ChestXrayResNet(nn.Module):
    def __init__(self, num_classes: int = NUM_CLASSES, pretrained: bool = True):
        super().__init__()

        # Load ResNet-50 pretrained on ImageNet (transfer learning)
        weights = models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
        self.backbone = models.resnet50(weights=weights)

        # Replace the original 1000-class ImageNet head with our 14-class head.
        # No sigmoid here — we output raw logits, and apply
        # BCEWithLogitsLoss during training (numerically more stable
        # than sigmoid + BCELoss separately).
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.backbone(x)