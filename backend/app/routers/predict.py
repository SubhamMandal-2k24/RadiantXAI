"""
/predict endpoint. Currently returns mocked predictions since the
trained model checkpoint isn't ready yet (Kaggle training in progress).
Swap the mock block for real inference once ml/export/to_onnx.py
and a trained checkpoint exist.
"""

from fastapi import APIRouter, UploadFile, File
from app.schemas import PredictResponse, Prediction

router = APIRouter()

MOCK_LABELS = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass",
    "Nodule", "Pneumonia", "Pneumothorax", "Consolidation", "Edema",
    "Emphysema", "Fibrosis", "Pleural_Thickening", "Hernia",
]


@router.post("/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    # TODO: replace with real model inference once checkpoint is ready
    mock_predictions = [
        Prediction(label=label, probability=round(0.9 - i * 0.06, 2))
        for i, label in enumerate(MOCK_LABELS)
    ]

    return PredictResponse(
        predictions=mock_predictions,
        heatmap_url="/static/mock_heatmap.png",
        original_url="/static/mock_original.png",
    )