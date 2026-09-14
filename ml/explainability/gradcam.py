"""
Grad-CAM implementation for ChestXrayResNet.

How it works: backprop the gradient of the target class's score
w.r.t. the last convolutional layer's feature maps, global-average-pool
those gradients into per-channel importance weights, then take a
weighted sum of the feature maps + ReLU to get a localization heatmap.
"""

import torch
import torch.nn.functional as F
import numpy as np
import cv2


class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        # Hooks capture the forward activations and backward gradients
        # of the target layer without modifying the model's code.
        target_layer.register_forward_hook(self._save_activations)
        target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx):
        self.model.eval()
        output = self.model(input_tensor)  # shape: (1, num_classes)

        # Backprop only the target class's logit
        self.model.zero_grad()
        score = output[0, class_idx]
        score.backward()

        # Global-average-pool gradients -> per-channel weights
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)

        # Weighted sum of activation maps, then ReLU
        cam = (weights * self.activations).sum(dim=1, keepdim=True)  # (1, 1, H, W)
        cam = F.relu(cam)

        # Normalize to 0-1 for visualization
        cam = cam.squeeze().cpu().numpy()
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        return cam


def overlay_heatmap(original_image: np.ndarray, cam: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    """
    original_image: HxWx3 RGB uint8 array
    cam: HxW float array in [0,1] (from GradCAM.generate)
    Returns the heatmap resized to match the original image and blended on top.
    """
    cam_resized = cv2.resize(cam, (original_image.shape[1], original_image.shape[0]))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    overlay = (alpha * heatmap + (1 - alpha) * original_image).astype(np.uint8)
    return overlay