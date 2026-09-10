"""
FastAPI entrypoint for RadiantXAI backend.
"""

from fastapi import FastAPI
from app.routers import predict

app = FastAPI(title="RadiantXAI API")

app.include_router(predict.router)


@app.get("/")
def health_check():
    return {"status": "ok"}