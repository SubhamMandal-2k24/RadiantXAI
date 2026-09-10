"""
Pydantic schemas defining the API's request/response shapes.
"""

from pydantic import BaseModel
from typing import List


class Prediction(BaseModel):
    label: str
    probability: float


class PredictResponse(BaseModel):
    predictions: List[Prediction]
    heatmap_url: str
    original_url: str