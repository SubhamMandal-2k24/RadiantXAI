"""Runtime settings, read from environment variables."""
import os
import tempfile
from pathlib import Path

CHECKPOINT_PATH = Path(os.environ.get("RADIANTXAI_CHECKPOINT", "/checkpoints/checkpoint.pth"))
OUTPUT_DIR = Path(
    os.environ.get(
        "RADIANTXAI_OUTPUT_DIR",
        str(Path(tempfile.gettempdir()) / "radiantxai_outputs"),
    )
)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg"}


def use_mock() -> bool:
    """Mock mode is opt-in only. Never serve fake medical predictions by accident."""
    return os.environ.get("RADIANTXAI_USE_MOCK", "").lower() in {"1", "true", "yes"}