import os

# CI and unit tests run without a checkpoint or torch: opt in to mock mode explicitly.
os.environ.setdefault("RADIANTXAI_USE_MOCK", "1")