"""
P4 Integration Tests:
Tests the FastAPI HTTP routes, WebSocket event streaming,
mission lifecycle, and chaos injection.
"""
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.api.service import service


@pytest.fixture(autouse=True)
def reset_service_fixture():
    """Ensure every test starts from a clean grid and mission state."""
    service.reset_all()
    yield
    service.reset_all()


def test_root_endpoint():
    client = TestClient(app)
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "running"
    assert data["name"] == "GridMind API"


def test_get_grid_state():
    client = TestClient(app)
    res = client.get("/grid/state")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    state = data["state"]
    assert "generators" in state
    assert "substations" in state
    assert "transmission_lines" in state
    assert "loads" in state
    assert "battery" in state
    assert len(state["generators"]) >= 2
    assert state["generation_mw"] >= 180


def test_get_agent_state():
    client = TestClient(app)
    res = client.get("/agent/state")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    agent = data["agent"]
    assert "mission" in agent
    assert agent["mission"]["status"] == "IDLE"
    assert "critical_loads" in agent["mission"]


def test_get_capabilities():
    client = TestClient(app)
    res = client.get("/capabilities")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    caps = data["capabilities"]
    names = [c["name"] for c in caps]
    assert "redistribution_engine" in names
    assert "priority_load_manager" in names
    assert "battery_engine" in names
    assert "grid_analyzer" in names


def test_chaos_event_injection_substation():
    client = TestClient(app)
    # Inject S2 failure
    req = {
        "event_type": "SUBSTATION_FAILURE",
        "target": "S2",
        "params": {}
    }
    res = client.post("/chaos/event", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    grid = data["grid_state"]

    # Verify S2 is offline and hospital is disconnected
    s2 = next((s for s in grid["substations"] if s["id"] == "S2"), None)
    assert s2 is not None and s2["online"] is False
    hospital = next((l for l in grid["loads"] if l["id"] == "HOSPITAL"), None)
    assert hospital is not None and hospital["connected"] is False

    # Verify event timeline has CHAOS_EVENT
    ev_res = client.get("/events")
    events = ev_res.json()["events"]
    assert any(e["type"] == "CHAOS_EVENT" for e in events)


def test_mission_lifecycle_step_and_replan():
    client = TestClient(app)

    # 1. Inject failure first so agent has a deficit to solve
    client.post("/chaos/event", json={"event_type": "SUBSTATION_FAILURE", "target": "S2"})

    # 2. Start mission in manual-step mode
    start_res = client.post("/mission/start", json={
        "goal": "Restore power to critical facilities",
        "auto_run": False
    })
    assert start_res.status_code == 200

    # 3. First step: Agent observes, tries redistribution_engine, fails on TL4 overload
    step1 = client.post("/mission/step")
    assert step1.status_code == 200

    ev1 = client.get("/events").json()["events"]
    event_types = [e["type"] for e in ev1]
    assert "OBSERVATION" in event_types
    assert "TOOL_FAILED" in event_types or "PLAN_INVALIDATED" in event_types

    # 4. Second step: Agent replans to priority_load_manager, restores hospital, validates outcome
    step2 = client.post("/mission/step")
    assert step2.status_code == 200

    ev2 = client.get("/events").json()["events"]
    replan_events = [e for e in ev2 if e["type"] in ("REPLAN_STARTED", "PLAN_CREATED")]
    assert len(replan_events) >= 2

    # Verify final validation passed and mission completed
    completed_event = any(e["type"] == "MISSION_COMPLETED" for e in ev2)
    assert completed_event is True


def test_mission_reset_and_stop():
    client = TestClient(app)
    client.post("/mission/start", json={"goal": "Test Stop", "auto_run": False})

    stop_res = client.post("/mission/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "ok"

    reset_res = client.post("/mission/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "ok"

    agent_state = client.get("/agent/state").json()["agent"]
    assert agent_state["mission"]["status"] == "IDLE"


def test_websocket_telemetry_stream():
    client = TestClient(app)
    with client.websocket_connect("/ws") as ws:
        # Handshake welcome message
        initial_msg = ws.receive_json()
        assert initial_msg["type"] == "CONNECTION_ESTABLISHED"
        assert "grid_state" in initial_msg
        assert "agent_state" in initial_msg

        # Client sends ping
        ws.send_json({"action": "ping", "timestamp": 12345})
        pong = ws.receive_json()
        assert pong["type"] == "PONG"
        assert pong["timestamp"] == 12345


def test_list_and_load_scenarios():
    client = TestClient(app)
    # 1. List scenarios
    res = client.get("/scenarios")
    assert res.status_code == 200
    scenarios = res.json()["scenarios"]
    assert len(scenarios) >= 5
    ids = [s["id"] for s in scenarios]
    assert "baseline" in ids
    assert "cascade_failure" in ids
    assert "heatwave_stress" in ids

    # 2. Load cascade failure scenario
    load_res = client.post("/scenarios/load", json={"scenario_id": "cascade_failure"})
    assert load_res.status_code == 200
    grid = load_res.json()["grid"]
    s2 = next(s for s in grid["substations"] if s["id"] == "S2")
    assert s2["online"] is False
    hospital = next(l for l in grid["loads"] if l["id"] == "HOSPITAL")
    assert hospital["connected"] is False

    # 3. Reset back to baseline
    reset_res = client.post("/scenarios/load", json={"scenario_id": "baseline"})
    assert reset_res.status_code == 200
    baseline_grid = reset_res.json()["grid"]
    assert next(s for s in baseline_grid["substations"] if s["id"] == "S2")["online"] is True


def test_grid_update_power_balance():
    client = TestClient(app)
    res = client.post("/grid/update", json={"generation_mw": 190.0, "demand_mw": 145.0})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["grid_state"]["generation_mw"] == 190.0
    assert data["grid_state"]["demand_mw"] == 145.0
    # Clean reset
    client.post("/mission/reset")

