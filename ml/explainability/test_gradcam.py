"""
Quick local sanity check for Grad-CAM, using the plain pretrained
(ImageNet) ResNet-50 — no fine-tuned checkpoint needed for this test.
Confirms the heatmap mechanism itself works before wiring in real weights.
"""

import torch
import numpy as np
from PIL import Image
from torchvision import transforms

from ml.models.resnet_multilabel import ChestXrayResNet
from ml.explainability.gradcam import GradCAM, overlay_heatmap

# Any image works for this sanity check — even a non-medical photo,
# since we're just confirming the mechanism produces a sensible heatmap.
IMAGE_PATH = "ml/explainability/sample.jpg"  # <-- put any .jpg here
OUTPUT_PATH = "ml/explainability/gradcam_output.jpg"

def main():
    model = ChestXrayResNet(pretrained=True)
    model.eval()

    # Grad-CAM taps into the last conv block of ResNet-50
    target_layer = model.backbone.layer4
    cam_generator = GradCAM(model, target_layer)

    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                              std=[0.229, 0.224, 0.225]),
    ])

    original = Image.open(IMAGE_PATH).convert("RGB").resize((224, 224))
    original_np = np.array(original)

    input_tensor = transform(original).unsqueeze(0)  # add batch dim

    # Use class index 0 for this sanity check (doesn't matter which,
    # since the model isn't fine-tuned yet — we're only checking the
    # mechanism produces *a* heatmap, not that it's medically meaningful)
    cam = cam_generator.generate(input_tensor, class_idx=0)

    result = overlay_heatmap(original_np, cam)
    Image.fromarray(result).save(OUTPUT_PATH)
    print(f"Grad-CAM heatmap saved to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()