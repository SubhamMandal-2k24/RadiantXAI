"""
Tests for the /predict endpoint.
Currently tests against the mocked response shape, since no trained
model is wired in yet. Once real inference replaces the mock, these
tests confirm the API contract (response shape) hasn't broken.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is False  # tests run in mock mode, no checkpoint loaded


def test_predict_returns_200():
    # Create a tiny fake image file in memory to upload
    from io import BytesIO
    from PIL import Image

    img = Image.new("RGB", (224, 224), color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/predict",
        files={"file": ("test.png", buf, "image/png")},
    )
    assert response.status_code == 200


def test_predict_response_shape():
    from io import BytesIO
    from PIL import Image

    img = Image.new("RGB", (224, 224), color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    response = client.post(
        "/predict",
        files={"file": ("test.png", buf, "image/png")},
    )
    data = response.json()

    assert "predictions" in data
    assert "heatmap_url" in data
    assert "original_url" in data
    assert len(data["predictions"]) == 14  # all 14 pathology labels

    for pred in data["predictions"]:
        assert "label" in pred
        assert "probability" in pred
        assert 0.0 <= pred["probability"] <= 1.0