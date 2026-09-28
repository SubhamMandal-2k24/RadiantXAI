import os

# CI and unit tests run without a checkpoint or torch: opt in to mock mode explicitly.
os.environ.setdefault("RADIANTXAI_USE_MOCK", "1")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (registers tables on Base)
from app.db import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    """TestClient wired to a fresh in-memory database for each test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture()
def auth_headers(client):
    """Sign up a technician and return ready-to-use Authorization headers."""
    res = client.post(
        "/auth/signup",
        json={"email": "tech@example.com", "password": "testpass123", "role": "technician"},
    )
    assert res.status_code == 201
    return {"Authorization": f"Bearer {res.json()['access_token']}"}