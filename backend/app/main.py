"""
FastAPI entrypoint for RadiantXAI backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict

app = FastAPI(title="RadiantXAI API")

# Allow the frontend (running on a different port) to call this API.
# In production, replace "*" with the actual deployed frontend URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)


@app.get("/")
def health_check():
    return {"status": "ok"}