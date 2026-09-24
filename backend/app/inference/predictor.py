"""Model loading + inference for the API.

Torch/ml imports are lazy (inside Predictor.__init__) so mock mode and CI
don't need the ML stack installed.
"""
from __future__ import annotations

import inspect
import io
import logging
import threading
import uuid
from pathlib import Path

import numpy as np
from PIL import Image

logger = logging.getLogger("radiantxai.inference")

IMAGE_SIZE = 224
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)


class InvalidImageError(ValueError):
    pass


def _extract_state_dict(ckpt: dict) -> dict:
    """Checkpoint holds model+optimizer+scheduler+epoch; pull out the model weights."""
    for key in ("model_state_dict", "model", "state_dict"):
        if isinstance(ckpt, dict) and key in ckpt:
            state = ckpt[key]
            break
    else:
        state = ckpt
    # Strip a DataParallel "module." prefix if present.
    return {k.removeprefix("module."): v for k, v in state.items()}


def _colorize(cam: np.ndarray, size: tuple[int, int]) -> Image.Image:
    """Pure JET heatmap at the original image size (frontend blends it over the X-ray)."""
    import cv2

    cam = np.clip(cv2.resize(cam.astype(np.float32), size, interpolation=cv2.INTER_CUBIC), 0.0, 1.0)
    heat_bgr = cv2.applyColorMap((cam * 255).astype(np.uint8), cv2.COLORMAP_JET)
    return Image.fromarray(cv2.cvtColor(heat_bgr, cv2.COLOR_BGR2RGB))


class Predictor:
    def __init__(self, checkpoint_path: Path, output_dir: Path, device: str = "cpu"):
        import torch
        from torchvision import transforms

        from ml.explainability.gradcam import GradCAM
        from ml.labels import LABELS
        from ml.models.resnet_multilabel import ChestXrayResNet

        self._torch = torch
        self.device = device
        self.output_dir = output_dir
        self.labels = list(LABELS)
        assert len(self.labels) == 14, f"expected 14 labels, got {len(self.labels)}"

        # Avoid re-downloading ImageNet weights if the constructor supports it.
        kwargs = {}
        if "pretrained" in inspect.signature(ChestXrayResNet.__init__).parameters:
            kwargs["pretrained"] = False
        model = ChestXrayResNet(**kwargs)

        # Our own trusted checkpoint (contains optimizer/scheduler state), hence weights_only=False.
        ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        model.load_state_dict(_extract_state_dict(ckpt))  # strict: fail loudly on mismatch
        self.model = model.to(device).eval()
        self.epoch = ckpt.get("epoch") if isinstance(ckpt, dict) else None

        # MUST match the eval transform used in ml/datasets/chestxray_dataset.py.
        self.transform = transforms.Compose(
            [
                transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
            ]
        )

        self.cam = GradCAM(self.model, self.model.backbone.layer4[-1])
        # Grad-CAM hooks keep per-call state on shared objects: one inference at a time.
        self._lock = threading.Lock()
        logger.info("Loaded checkpoint %s (epoch=%s) on %s", checkpoint_path, self.epoch, device)

    def predict(self, image_bytes: bytes) -> dict:
        torch = self._torch
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
            image = image.convert("RGB")
        except Exception as exc:
            raise InvalidImageError("Could not decode image") from exc

        x = self.transform(image).unsqueeze(0).to(self.device)

        with self._lock:
            with torch.no_grad():
                probs = torch.sigmoid(self.model(x))[0].cpu().numpy()
            top = int(probs.argmax())
            cam = self.cam.generate(x, top)  # needs grad enabled, so outside no_grad

        if hasattr(cam, "detach"):
            cam = cam.detach().cpu().numpy()

        request_id = uuid.uuid4().hex
        original_name, heatmap_name = f"{request_id}_original.png", f"{request_id}_heatmap.png"
        image.save(self.output_dir / original_name)
        _colorize(np.asarray(cam), image.size).save(self.output_dir / heatmap_name)

        predictions = sorted(
            ({"label": lbl, "probability": float(p)} for lbl, p in zip(self.labels, probs)),
            key=lambda d: d["probability"],
            reverse=True,
        )
        return {
            "predictions": predictions,
            "original_url": f"/outputs/{original_name}",
            "heatmap_url": f"/outputs/{heatmap_name}",
        }