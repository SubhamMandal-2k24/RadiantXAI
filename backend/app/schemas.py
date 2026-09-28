"""
Pydantic schemas defining the API's request/response shapes.
"""

from typing import List

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import UserRole


class Prediction(BaseModel):
    label: str
    probability: float


class PredictResponse(BaseModel):
    predictions: List[Prediction]
    heatmap_url: str
    original_url: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    email: EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: UserRole