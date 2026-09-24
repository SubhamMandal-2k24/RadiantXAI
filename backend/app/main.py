import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import predict
from .settings import CHECKPOINT_PATH, OUTPUT_DIR, use_mock

logger = logging.getLogger("radiantxai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.predictor = None
    if use_mock():
        logger.warning("RADIANTXAI_USE_MOCK is set: serving FAKE predictions")
    else:
        if not CHECKPOINT_PATH.is_file():
            raise RuntimeError(
                f"Checkpoint not found at {CHECKPOINT_PATH}. "
                "Set RADIANTXAI_CHECKPOINT, or RADIANTXAI_USE_MOCK=1 for dev/CI."
            )
        from .inference.predictor import Predictor  # lazy: pulls in torch

        app.state.predictor = Predictor(CHECKPOINT_PATH, OUTPUT_DIR)
    yield


app = FastAPI(title="RadiantXAI", lifespan=lifespan)
app.state.predictor = None  # always defined, even if the lifespan doesn't run (TestClient without `with`)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.include_router(predict.router)


@app.get("/")
def health():
    return {"status": "ok", "model_loaded": app.state.predictor is not None}