"""
Tests for the /predict endpoint.
Runs in mock mode (no checkpoint), so these confirm the API contract
(auth requirement + response shape), not model quality.
"""

from io import BytesIO

from PIL import Image


def _png_file():
    buf = BytesIO()
    Image.new("RGB", (224, 224), color="white").save(buf, format="PNG")
    buf.seek(0)
    return {"file": ("test.png", buf, "image/png")}


def test_health_check(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is False  # tests run in mock mode, no checkpoint loaded


def test_predict_requires_auth(client):
    response = client.post("/predict", files=_png_file())
    assert response.status_code == 401


def test_predict_rejects_invalid_token(client):
    response = client.post(
        "/predict", files=_png_file(), headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_predict_returns_200(client, auth_headers):
    response = client.post("/predict", files=_png_file(), headers=auth_headers)
    assert response.status_code == 200


def test_predict_response_shape(client, auth_headers):
    data = client.post("/predict", files=_png_file(), headers=auth_headers).json()

    assert "predictions" in data
    assert "heatmap_url" in data
    assert "original_url" in data
    assert len(data["predictions"]) == 14  # all 14 pathology labels

    for pred in data["predictions"]:
        assert "label" in pred
        assert "probability" in pred
        assert 0.0 <= pred["probability"] <= 1.0


def test_predict_rejects_wrong_file_type(client, auth_headers):
    files = {"file": ("test.txt", BytesIO(b"not an image"), "text/plain")}
    response = client.post("/predict", files=files, headers=auth_headers)
    assert response.status_code == 415