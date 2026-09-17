"""
Integration Tests for P4 (FastAPI routes & Chaos injection)
"""
import pytest
pytest.importorskip("fastapi")

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_start_mission_endpoint():
    payload = {"goal": "Protect hospital and water plant"}
    response = client.post("/mission/start", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "started"


def test_inject_chaos_endpoint():
    payload = {
        "event_type": "SUBSTATION_FAILURE",
        "target": "S2"
    }
    response = client.post("/chaos/event", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "injected"


def test_grid_state_endpoint():
    response = client.get("/grid/state")
    assert response.status_code == 200
    assert "state" in response.json()
