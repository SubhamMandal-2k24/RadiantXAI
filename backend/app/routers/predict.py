from fastapi import APIRouter, File, HTTPException, Request, Response, UploadFile

from ..inference.predictor import InvalidImageError
from ..settings import ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES, use_mock

router = APIRouter()

MOCK_LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", "Nodule", "Pneumonia",
    "Pneumothorax", "Consolidation", "Edema", "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
]


def _mock_response() -> dict:
    n = len(MOCK_LABELS)
    return {
        "predictions": [
            {"label": lbl, "probability": round(0.9 - i * (0.8 / n), 4)} for i, lbl in enumerate(MOCK_LABELS)
        ],
        "original_url": "/mock/original.png",
        "heatmap_url": "/mock/heatmap.png",
    }


@router.post("/predict")
def predict(request: Request, response: Response, file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Only PNG and JPEG images are supported")

    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 15 MB)")

    predictor = getattr(request.app.state, "predictor", None)

    if predictor is None:
        if use_mock():
            response.headers["X-RadiantXAI-Mode"] = "mock"
            return _mock_response()
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        return predictor.predict(data)
    except InvalidImageError as exc:
        raise HTTPException(status_code=400, detail=str(exc))