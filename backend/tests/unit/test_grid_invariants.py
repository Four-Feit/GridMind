"""
Property-Based Fuzzing & Invariant Tests for Grid Simulator (Owned by P2)
Verifies that no randomized combination of chaos events can corrupt state or violate schema.
"""
import math
import random
import pytest
from backend.grid.events import ChaosEventType
from backend.grid.models import GridState
from backend.grid.simulator import GridSimulator


@pytest.fixture
def sim():
    return GridSimulator()


def test_randomized_chaos_invariant_fuzzer(sim):
    """
    Bombards the simulator with 100 random chaos events in sequence,
    verifying physical and programmatic invariants after every single mutation.
    """
    event_types = list(ChaosEventType)
    targets = ["S1", "S2", "S3", "TL1", "TL4", "G1", "G2_SOLAR", "HOSPITAL", "FACTORY", "B1", "ALL", ""]

    sim.reset()
    random.seed(42)  # Deterministic seed for reproducible fuzz testing

    # Take initial checkpoint
    initial_snap = sim.create_snapshot(label="initial_clean_state")

    for iteration in range(100):
        ev_type = random.choice(event_types)
        target = random.choice(targets)
        params = {}

        if ev_type == ChaosEventType.WEATHER_DETERIORATION:
            params["drop_mw"] = random.uniform(5.0, 50.0)
        elif ev_type == ChaosEventType.DEMAND_SPIKE:
            params["spike_mw"] = random.uniform(10.0, 40.0)
        elif ev_type == ChaosEventType.BATTERY_DEPLETION:
            params["remaining_mwh"] = random.uniform(0.0, 20.0)

        # 1. Inject event - must never raise unhandled exception
        result = sim.inject_event({"event_type": ev_type.value, "target": target, "params": params})
        assert result["status"] == "APPLIED"

        # 2. Advance clock with step
        dt = random.choice([0.0, 60.0, 300.0])
        state = sim.step(dt_seconds=dt)

        # Invariant A: Pure dict matches GridState Pydantic model
        validated_model = GridState.model_validate(state)
        assert validated_model is not None

        # Invariant B: Numbers are finite (no NaN, no Inf)
        assert math.isfinite(state["generation_mw"])
        assert math.isfinite(state["demand_mw"])
        assert state["generation_mw"] >= 0.0
        assert state["demand_mw"] >= 0.0

        for gen in state["generators"]:
            assert math.isfinite(gen["available_mw"])
            assert gen["available_mw"] >= 0.0

        for line in state["transmission_lines"]:
            assert math.isfinite(line["load_mw"])
            assert line["load_mw"] >= 0.0

        for load in state["loads"]:
            assert math.isfinite(load["demand_mw"])
            assert math.isfinite(load["supplied_mw"])
            assert load["demand_mw"] >= 0.0

        if state["battery"]:
            assert math.isfinite(state["battery"]["remaining_mwh"])
            assert state["battery"]["remaining_mwh"] >= 0.0

    # Invariant C: Rollback to initial snapshot completely cleanses all 100 chaos events
    assert sim.restore_snapshot(initial_snap) is True
    clean_state = sim.get_state()
    assert clean_state["generation_mw"] == 180.0
    assert clean_state["demand_mw"] == 150.0
    assert clean_state["failures"] == []
    assert len(clean_state["substations"]) == 3
    assert all(s["online"] for s in clean_state["substations"])


def test_time_machine_multilevel_snapshots(sim):
    """Verifies that multiple historical checkpoints can be restored out of order."""
    sim.reset()

    # Checkpoint 0: Clean baseline
    snap0 = sim.create_snapshot("clean")

    # Checkpoint 1: S2 fails
    sim.inject_event({"event_type": "SUBSTATION_FAILURE", "target": "S2"})
    snap1 = sim.create_snapshot("s2_offline")

    # Checkpoint 2: G1 fails
    sim.inject_event({"event_type": "GENERATOR_FAILURE", "target": "G1"})
    snap2 = sim.create_snapshot("g1_offline")

    assert sim.get_state()["generation_mw"] == 40.0

    # Restore Checkpoint 1 (S2 offline, G1 online)
    assert sim.restore_snapshot(snap1) is True
    assert sim.get_state()["generation_mw"] == 180.0
    assert sim.get_state()["substations"][1]["online"] is False

    # Restore Checkpoint 2 (G1 offline)
    assert sim.restore_snapshot(snap2) is True
    assert sim.get_state()["generation_mw"] == 40.0

    # Restore Checkpoint 0 (Baseline)
    assert sim.restore_snapshot(snap0) is True
    assert sim.get_state()["generation_mw"] == 180.0
    assert sim.get_state()["substations"][1]["online"] is True


def test_all_scenarios_schema_invariants(sim):
    """Verifies that every pre-packaged scenario complies strictly with GridState schema and invariants."""
    scenarios = sim.list_scenarios()
    for sc in scenarios:
        assert sim.load_scenario(sc["id"]) is True
        state = sim.get_state()

        # Schema validation
        validated = GridState.model_validate(state)
        assert validated is not None

        # Value bounds
        assert state["generation_mw"] >= 0.0
        assert state["demand_mw"] >= 0.0
        assert math.isfinite(state["generation_mw"])
        assert math.isfinite(state["demand_mw"])
        assert len(state["generators"]) >= 2
        assert len(state["substations"]) >= 3
        assert len(state["transmission_lines"]) >= 2
        assert len(state["loads"]) >= 5
