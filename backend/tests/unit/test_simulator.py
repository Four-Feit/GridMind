"""
Unit Tests for Grid Simulator & Environment (Owned by P2)
"""
import pytest
from backend.grid.constraints import (
    check_all_constraints,
    check_battery_limits,
    check_critical_loads,
    check_transmission_limits,
)
from backend.grid.events import ChaosEvent, ChaosEventType
from backend.grid.power_balance import (
    calculate_demand_summary,
    calculate_generation_summary,
    calculate_net_margin,
    calculate_power_deficit,
    estimate_reroute_attempt,
    solve_network_flows,
)
from backend.grid.simulator import GridSimulator


@pytest.fixture
def sim():
    simulator = GridSimulator()
    simulator.reset()
    return simulator


def test_initial_baseline_state(sim):
    state = sim.get_state()

    # Verify baseline metrics per docs/contracts.md & docs/demo-scenario.md
    assert state["generation_mw"] == 180.0
    assert state["demand_mw"] == 150.0
    assert len(state["generators"]) == 2
    assert len(state["substations"]) == 3
    assert len(state["transmission_lines"]) == 2
    assert len(state["loads"]) == 5
    assert state["battery"]["remaining_mwh"] == 80.0
    assert state["battery"]["capacity_mwh"] == 100.0
    assert state["battery"]["max_output_mw"] == 40.0
    assert state["failures"] == []

    # Check transmission line alias serialization
    tl1 = next(l for l in state["transmission_lines"] if l["id"] == "TL1")
    assert "from" in tl1
    assert tl1["from"] == "S1"
    assert tl1["to"] == "S2"

    # Check load IDs
    load_ids = [l["id"] for l in state["loads"]]
    assert "HOSPITAL" in load_ids
    assert "WATER_PLANT" in load_ids
    assert "EMERGENCY_SERVICES" in load_ids
    assert "RESIDENTIAL_ZONE" in load_ids
    assert "FACTORY" in load_ids


def test_substation_failure_chaos_event(sim):
    res = sim.inject_event(
        ChaosEvent(event_type=ChaosEventType.SUBSTATION_FAILURE, target="S2")
    )
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    s2 = next(s for s in state["substations"] if s["id"] == "S2")
    assert s2["online"] is False

    # Verify hospital disconnection
    hospital = next(l for l in state["loads"] if l["id"] == "HOSPITAL")
    assert hospital["connected"] is False
    assert hospital["supplied_mw"] == 0.0

    # Verify failure recorded
    assert any("S2" in f for f in state["failures"])


def test_transmission_failure_chaos_event(sim):
    res = sim.inject_event(
        {"event_type": "TRANSMISSION_FAILURE", "target": "TL4"}
    )
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    tl4 = next(l for l in state["transmission_lines"] if l["id"] == "TL4")
    assert tl4["online"] is False
    assert tl4["load_mw"] == 0.0
    assert any("TL4" in f for f in state["failures"])


def test_generator_failure_chaos_event(sim):
    res = sim.inject_event(
        {"event_type": "GENERATOR_FAILURE", "target": "G1"}
    )
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    g1 = next(g for g in state["generators"] if g["id"] == "G1")
    assert g1["online"] is False
    assert g1["available_mw"] == 0.0
    # Available generation drops to 40 MW (G2_SOLAR only)
    assert state["generation_mw"] == 40.0


def test_weather_deterioration_event(sim):
    # Solar generation drops by 30 MW (from 40 MW to 10 MW)
    res = sim.inject_event({
        "event_type": "WEATHER_DETERIORATION",
        "target": "G2_SOLAR",
        "params": {"drop_mw": 30.0}
    })
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    solar = next(g for g in state["generators"] if g["id"] == "G2_SOLAR")
    assert solar["available_mw"] == 10.0
    # 140 (G1) + 10 (G2_SOLAR) = 150 MW
    assert state["generation_mw"] == 150.0
    assert any("reduced to 10" in f or "weather" in f.lower() for f in state["failures"])


def test_demand_spike_event(sim):
    # Factory demand spikes by 25 MW (from 40 MW to 65 MW)
    res = sim.inject_event({
        "event_type": "DEMAND_SPIKE",
        "target": "FACTORY",
        "params": {"spike_mw": 25.0}
    })
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    factory = next(l for l in state["loads"] if l["id"] == "FACTORY")
    assert factory["demand_mw"] == 65.0
    # 150 + 25 = 175 MW total demand
    assert state["demand_mw"] == 175.0


def test_battery_depletion_event(sim):
    res = sim.inject_event({
        "event_type": "BATTERY_DEPLETION",
        "target": "B1",
        "params": {"remaining_mwh": 5.0}
    })
    assert res["status"] == "APPLIED"

    state = sim.get_state()
    assert state["battery"]["remaining_mwh"] == 5.0


def test_battery_discharge_operations(sim):
    # Valid discharge: 20 MW for 1 hour -> 20 MWh deducted
    success, msg = sim.discharge_battery(power_mw=20.0, duration_hours=1.0)
    assert success is True
    assert sim.battery.remaining_mwh == 60.0

    # Attempt discharge exceeding max output (40 MW)
    success, msg = sim.discharge_battery(power_mw=50.0, duration_hours=1.0)
    assert success is False
    assert "exceeds max output" in msg

    # Attempt discharge exceeding remaining energy
    success, msg = sim.discharge_battery(power_mw=40.0, duration_hours=2.0)  # 80 MWh needed, only 60 left
    assert success is False
    assert "Insufficient energy" in msg


def test_constraint_checkers(sim):
    state = sim.get_state()
    # Baseline has zero violations
    assert check_transmission_limits(state) == []
    assert check_critical_loads(state) == []
    assert check_battery_limits(state) == []

    # Induce transmission overload
    state["transmission_lines"][0]["load_mw"] = 95.0
    state["transmission_lines"][0]["capacity_mw"] = 80.0
    tx_violations = check_transmission_limits(state)
    assert len(tx_violations) == 1
    assert "overloaded" in tx_violations[0]

    # Induce critical load deficit
    state["loads"][0]["supplied_mw"] = 10.0  # Hospital demand is 30.0
    load_violations = check_critical_loads(state)
    assert len(load_violations) == 1
    assert "HOSPITAL" in load_violations[0]

    # Induce battery violation
    state["battery"]["remaining_mwh"] = -5.0
    bat_violations = check_battery_limits(state)
    assert len(bat_violations) == 1
    assert "negative" in bat_violations[0]

    all_v = check_all_constraints(state)
    assert len(all_v["transmission_violations"]) == 1
    assert len(all_v["critical_load_violations"]) == 1
    assert len(all_v["battery_violations"]) == 1


def test_power_balance_functions(sim):
    state = sim.get_state()
    # 180 gen - 150 dem = 30 surplus
    assert calculate_power_deficit(state) == 0.0
    assert calculate_net_margin(state) == 30.0

    gen_summary = calculate_generation_summary(state)
    assert gen_summary["total_available_mw"] == 180.0
    assert "G1" in gen_summary["generators"]

    demand_summary = calculate_demand_summary(state)
    assert demand_summary["critical_demand_mw"] == 70.0  # 30 + 25 + 15
    assert demand_summary["normal_demand_mw"] == 80.0    # 40 + 40
    assert demand_summary["critical_satisfied"] is True


def test_backward_compatibility_inject_failure(sim):
    sim.inject_failure("substation", "S2")
    state = sim.get_state()
    s2 = next(s for s in state["substations"] if s["id"] == "S2")
    assert s2["online"] is False
    assert any("S2" in f for f in state["failures"])

    # Test with params dictionary (used by P4)
    sim.inject_failure("weather", "G2_SOLAR", {"drop_mw": 20.0})
    state = sim.get_state()
    solar = next(g for g in state["generators"] if g["id"] == "G2_SOLAR")
    assert solar["available_mw"] == 20.0


def test_scenario_profiles(sim):
    # Test listing scenarios
    scenarios = sim.list_scenarios()
    assert len(scenarios) >= 5
    ids = [s["id"] for s in scenarios]
    assert "baseline" in ids
    assert "heatwave_stress" in ids
    assert "islanded_grid" in ids

    # Load heatwave scenario
    assert sim.load_scenario("heatwave") is True
    st = sim.get_state()
    assert st["demand_mw"] == 180.0  # Increased load (40+40 normal -> 55+55)
    assert next(g for g in st["generators"] if g["id"] == "G2_SOLAR")["available_mw"] == 25.0

    # Load islanded grid scenario
    assert sim.load_scenario("islanded_grid") is True
    st = sim.get_state()
    tl1 = next(t for t in st["transmission_lines"] if t["id"] == "TL1")
    assert tl1["online"] is False

    # Unknown scenario returns False
    assert sim.load_scenario("unknown_scenario_xyz") is False

    # Reset restores baseline
    sim.reset()
    baseline_st = sim.get_state()
    assert baseline_st["generation_mw"] == 180.0
    assert baseline_st["demand_mw"] == 150.0


def test_power_flow_engine_and_reroute_estimation(sim):
    flows = sim.update_flows()
    assert "TL1" in flows
    assert "TL4" in flows
    assert flows["TL1"] > 0.0
    assert flows["TL4"] > 0.0

    # Estimate reroute to S2 (the demo overload scenario)
    estimate = estimate_reroute_attempt("S2")
    assert estimate["feasible"] is False
    assert estimate["error_code"] == "TRANSMISSION_OVERLOAD"
    assert estimate["bottleneck_line"] == "TL4"
    assert estimate["attempted_mw"] == 71.0
    assert "exceed TL4 capacity" in estimate["message"]

    # Reroute to S3 within limits
    estimate_s3 = estimate_reroute_attempt("S3")
    assert estimate_s3["feasible"] is True
    assert estimate_s3["error_code"] is None


def test_snapshot_and_rollback(sim):
    # Snapshot at baseline
    initial_state = sim.get_state()
    snap_id = sim.create_snapshot(label="pre_chaos")
    assert snap_id is not None
    assert len(sim.list_snapshots()) >= 1

    # Apply heavy chaos
    sim.inject_event({"event_type": "SUBSTATION_FAILURE", "target": "S2"})
    sim.inject_event({"event_type": "GENERATOR_FAILURE", "target": "G1"})
    mutated_state = sim.get_state()
    assert mutated_state["generation_mw"] != initial_state["generation_mw"]
    assert mutated_state["substations"][1]["online"] is False

    # Restore snapshot
    assert sim.restore_snapshot(snap_id) is True
    restored_state = sim.get_state()

    # Verify exact equality
    assert restored_state["generation_mw"] == initial_state["generation_mw"]
    assert restored_state["demand_mw"] == initial_state["demand_mw"]
    assert restored_state["substations"][1]["online"] is True
    assert restored_state["failures"] == initial_state["failures"]

    # Restoring non-existent snapshot returns False
    assert sim.restore_snapshot("invalid_snapshot_id") is False


def test_simulation_time_stepping(sim):
    # Set up battery discharge rate (10 MW continuous)
    sim.discharge_battery(power_mw=10.0, duration_hours=0.0)
    assert sim.battery_discharge_rate_mw == 10.0
    assert sim.battery.remaining_mwh == 80.0

    # Advance simulation by 3600 seconds (1 hour)
    # Energy consumed = 10 MW * 1h = 10 MWh -> remaining should be 70 MWh
    state = sim.step(dt_seconds=3600.0)
    assert state["battery"]["remaining_mwh"] == 70.0

    # Advance by 8 hours -> 80 MWh consumed -> battery should deplete and disconnect
    state = sim.step(dt_seconds=28800.0)
    assert state["battery"]["remaining_mwh"] == 0.0
    assert state["battery"]["online"] is False
    assert any("depleted" in f for f in state["failures"])




