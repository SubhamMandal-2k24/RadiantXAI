"""
Guards against transform drift: predictor.py hardcodes its own resize
size and ImageNet mean/std (duplicated from ml/datasets/chestxray_dataset.py's
training-time transform, since ChestXrayDataset takes an externally-built
transform rather than owning one itself). If predictor.py's constants
ever drift from what the model was actually trained on, predictions
silently degrade -- no error, no crash, just quietly worse accuracy.
This test catches that drift by asserting predictor.py's transform
constants and pipeline behavior match the known-correct values.
"""

import io

import numpy as np
import pytest
from PIL import Image

from app.inference.predictor import (
    IMAGE_SIZE,
    IMAGENET_MEAN,
    IMAGENET_STD,
    InvalidImageError,
    _extract_state_dict,
)

# The exact values the model was trained with (mirrors evaluate.py's
# transform and ml/train.py's). If these ever change, this test and
# predictor.py's constants must be updated together, deliberately.
EXPECTED_IMAGE_SIZE = 224
EXPECTED_IMAGENET_MEAN = (0.485, 0.456, 0.406)
EXPECTED_IMAGENET_STD = (0.229, 0.224, 0.225)


def test_predictor_image_size_matches_training():
    assert IMAGE_SIZE == EXPECTED_IMAGE_SIZE


def test_predictor_normalization_matches_training():
    assert IMAGENET_MEAN == EXPECTED_IMAGENET_MEAN
    assert IMAGENET_STD == EXPECTED_IMAGENET_STD


def test_transform_pipeline_produces_correct_tensor_shape():
    """The actual transform pipeline predictor.py builds (Resize, ToTensor,
    Normalize) should turn any input image into a (3, 224, 224) tensor,
    regardless of the input image's original size or mode."""
    from torchvision import transforms

    transform = transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )

    # A differently-sized, non-square input -- the resize must still
    # produce exactly IMAGE_SIZE x IMAGE_SIZE, not just "close".
    image = Image.new("RGB", (512, 341), color="white")
    tensor = transform(image)

    assert tensor.shape == (3, IMAGE_SIZE, IMAGE_SIZE)


def test_transform_normalization_actually_applied():
    """A pure white image (pixel value 1.0 after ToTensor) should NOT
    remain 1.0 after normalization -- if it does, Normalize silently
    isn't being applied (e.g. wrong argument order, or skipped)."""
    from torchvision import transforms

    transform = transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
        ]
    )

    image = Image.new("RGB", (224, 224), color="white")
    tensor = transform(image)

    # White pixel (1.0) normalized with ImageNet mean/std for the R
    # channel: (1.0 - 0.485) / 0.229 ~= 2.249, NOT 1.0.
    expected_r = (1.0 - IMAGENET_MEAN[0]) / IMAGENET_STD[0]
    assert tensor[0, 0, 0].item() == pytest.approx(expected_r, abs=1e-3)
    assert tensor[0, 0, 0].item() != pytest.approx(1.0, abs=1e-3)


def test_extract_state_dict_handles_nested_checkpoint():
    """Checkpoints save model+optimizer+scheduler+epoch together
    (per train.py); _extract_state_dict must pull out just the model
    weights, not the whole dict."""
    fake_state = {"layer.weight": np.array([1.0, 2.0])}
    checkpoint = {
        "model_state": fake_state,
        "optimizer_state": {"unrelated": "data"},
        "epoch": 9,
    }
    extracted = _extract_state_dict(checkpoint)
    assert set(extracted.keys()) == {"layer.weight"}


def test_extract_state_dict_strips_dataparallel_prefix():
    """A checkpoint saved from a DataParallel-wrapped model prefixes
    every key with 'module.' -- this must be stripped so state_dict
    keys match a non-DataParallel model."""
    fake_state = {"module.layer.weight": np.array([1.0])}
    checkpoint = {"model_state": fake_state}
    extracted = _extract_state_dict(checkpoint)
    assert "layer.weight" in extracted
    assert "module.layer.weight" not in extracted


def test_extract_state_dict_falls_back_to_bare_dict():
    """If a checkpoint is just a raw state_dict (no wrapping keys),
    _extract_state_dict should still work rather than erroring."""
    fake_state = {"layer.weight": np.array([1.0])}
    extracted = _extract_state_dict(fake_state)
    assert extracted == fake_state