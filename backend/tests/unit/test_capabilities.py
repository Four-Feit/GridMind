"""
Unit Tests for Person 3 Capabilities & Validator
Rule 8: P3 tests capabilities with mock states in complete isolation.
"""
import pytest
from backend.capabilities.analyzer import GridAnalyzer
from backend.capabilities.battery import BatteryEngine
from backend.capabilities.priority_manager import PriorityLoadManager
from backend.capabilities.redistribution import RedistributionEngine
from backend.capabilities.validator import GridOutcomeValidator


# --- Helper Fixtures ---

@pytest.fixture
def baseline_grid_state():
    """Returns a valid baseline GridState snapshot matching Contract 1."""
    return {
        "timestamp": 1720000000.0,
        "generation_mw": 180.0,
        "demand_mw": 150.0,
        "generators": [
            {"id": "G1", "type": "conventional", "capacity_mw": 150.0, "available_mw": 140.0, "online": True},
            {"id": "G2_SOLAR", "type": "solar", "capacity_mw": 50.0, "available_mw": 40.0, "online": True}
        ],
        "substations": [
            {"id": "S1", "online": True},
            {"id": "S2", "online": True},
            {"id": "S3", "online": True}
        ],
        "transmission_lines": [
            {"id": "TL1", "from": "S1", "to": "S2", "capacity_mw": 80.0, "load_mw": 50.0, "online": True},
            {"id": "TL4", "from": "S2", "to": "S3", "capacity_mw": 60.0, "load_mw": 40.0, "online": True}
        ],
        "loads": [
            {"id": "HOSPITAL", "type": "hospital", "demand_mw": 30.0, "supplied_mw": 30.0, "priority": "critical", "connected": True},
            {"id": "WATER_PLANT", "type": "water_plant", "demand_mw": 25.0, "supplied_mw": 25.0, "priority": "critical", "connected": True},
            {"id": "EMERGENCY_SERVICES", "type": "emergency", "demand_mw": 15.0, "supplied_mw": 15.0, "priority": "critical", "connected": True},
            {"id": "RESIDENTIAL_ZONE", "type": "residential", "demand_mw": 40.0, "supplied_mw": 40.0, "priority": "normal", "connected": True},
            {"id": "FACTORY", "type": "industrial", "demand_mw": 40.0, "supplied_mw": 40.0, "priority": "normal", "connected": True}
        ],
        "battery": {
            "id": "B1",
            "capacity_mwh": 100.0,
            "remaining_mwh": 80.0,
            "max_output_mw": 40.0,
            "online": True
        },
        "failures": []
    }


# --- 1. Base Capability Contract Tests ---

def test_capability_to_spec():
    engine = BatteryEngine()
    spec = engine.to_spec()
    assert spec["name"] == "battery_engine"
    assert "power_mw" in spec["input_schema"]["properties"]
    assert "power_mw" in spec["input_schema"]["required"]


# --- 2. GridAnalyzer Tests ---

def test_grid_analyzer_nominal(baseline_grid_state):
    analyzer = GridAnalyzer()
    res = analyzer.execute(baseline_grid_state, {})
    assert res.success is True
    assert res.data["generation_mw"] == 180.0
    assert res.data["demand_mw"] == 150.0
    assert res.data["net_margin_mw"] == 30.0
    assert res.data["failed_components"] == []
    assert res.data["critical_loads_affected"] == []
    assert res.data["overloaded_lines"] == []


def test_grid_analyzer_detects_outages_and_overloads(baseline_grid_state):
    # Simulate Substation S2 offline and hospital disconnected
    baseline_grid_state["substations"][1]["online"] = False
    baseline_grid_state["loads"][0]["connected"] = False
    baseline_grid_state["loads"][0]["supplied_mw"] = 0.0
    # Simulate overloaded TL1
    baseline_grid_state["transmission_lines"][0]["load_mw"] = 95.0

    analyzer = GridAnalyzer()
    res = analyzer.execute(baseline_grid_state, {})
    assert res.success is True
    assert "S2" in res.data["failed_components"]
    assert "HOSPITAL" in res.data["critical_loads_affected"]
    assert len(res.data["overloaded_lines"]) == 1
    assert res.data["overloaded_lines"][0]["line_id"] == "TL1"
    assert res.data["overloaded_lines"][0]["overload_mw"] == 15.0


# --- 3. RedistributionEngine Tests ---

def test_redistribution_overload_demo_failure(baseline_grid_state):
    """Verifies Contract 4B & Demo Scenario Step 3: TL4 Overload."""
    engine = RedistributionEngine()
    res = engine.execute(baseline_grid_state, {"target_substation": "S2"})
    assert res.success is False
    assert res.error is not None
    assert res.error.code == "TRANSMISSION_OVERLOAD"
    assert "TL4" in res.error.message
    assert res.error.details["line"] == "TL4"
    assert res.error.details["attempted_mw"] == 71.0
    assert res.error.details["capacity_mw"] == 60.0


def test_redistribution_substation_not_found(baseline_grid_state):
    engine = RedistributionEngine()
    res = engine.execute(baseline_grid_state, {"target_substation": "S999"})
    assert res.success is False
    assert res.error.code == "SUBSTATION_NOT_FOUND"


def test_redistribution_success_feasible_path(baseline_grid_state):
    engine = RedistributionEngine()
    res = engine.execute(baseline_grid_state, {"target_substation": "S1"})
    assert res.success is True
    assert res.data["target_substation"] == "S1"
    assert res.data["route_verified"] is True


# --- 4. PriorityLoadManager Tests ---

def test_priority_manager_protect_critical(baseline_grid_state):
    """Verifies Contract 4A & Demo Scenario Step 4: Shed Factory, power Hospital."""
    # Hospital disconnected initially
    baseline_grid_state["loads"][0]["connected"] = False
    baseline_grid_state["loads"][0]["supplied_mw"] = 0.0

    manager = PriorityLoadManager()
    res = manager.execute(baseline_grid_state, {"protect_critical": True})

    assert res.success is True
    assert "HOSPITAL" in res.data["served"]
    assert "WATER_PLANT" in res.data["served"]
    assert "FACTORY" in res.data["shed"]
    assert res.data["shed_mw"] == 40.0
    assert res.data["critical_supplied_mw"] == 70.0

    # Verify hospital restored in state
    hospital = next(l for l in baseline_grid_state["loads"] if l["id"] == "HOSPITAL")
    assert hospital["connected"] is True
    assert hospital["supplied_mw"] == 30.0

    # Verify factory shed in state
    factory = next(l for l in baseline_grid_state["loads"] if l["id"] == "FACTORY")
    assert factory["connected"] is False
    assert factory["supplied_mw"] == 0.0


def test_priority_manager_custom_shed_targets(baseline_grid_state):
    manager = PriorityLoadManager()
    res = manager.execute(baseline_grid_state, {
        "protect_critical": True,
        "shed_targets": ["RESIDENTIAL_ZONE"]
    })
    assert res.success is True
    assert "RESIDENTIAL_ZONE" in res.data["shed"]
    assert "FACTORY" not in res.data["shed"]


# --- 5. BatteryEngine Tests ---

def test_battery_engine_success(baseline_grid_state):
    """Verifies Demo Scenario Step 5: Discharge 20MW for 15 minutes."""
    engine = BatteryEngine()
    res = engine.execute(baseline_grid_state, {"power_mw": 20.0, "duration_minutes": 15.0})
    assert res.success is True
    assert res.data["discharged_mw"] == 20.0
    assert res.data["energy_discharged_mwh"] == 5.0  # 20MW * 0.25h = 5MWh
    assert res.data["remaining_mwh"] == 75.0  # 80MWh - 5MWh = 75MWh
    assert baseline_grid_state["battery"]["remaining_mwh"] == 75.0


def test_battery_engine_max_output_exceeded(baseline_grid_state):
    engine = BatteryEngine()
    # Requesting 50MW when max_output_mw is 40MW
    res = engine.execute(baseline_grid_state, {"power_mw": 50.0})
    assert res.success is False
    assert res.error.code == "BATTERY_OUTPUT_EXCEEDED"


def test_battery_engine_offline(baseline_grid_state):
    baseline_grid_state["battery"]["online"] = False
    engine = BatteryEngine()
    res = engine.execute(baseline_grid_state, {"power_mw": 10.0})
    assert res.success is False
    assert res.error.code == "BATTERY_OFFLINE"


def test_battery_engine_insufficient_storage(baseline_grid_state):
    baseline_grid_state["battery"]["remaining_mwh"] = 2.0
    engine = BatteryEngine()
    # 20MW * 0.25h = 5MWh > 2MWh
    res = engine.execute(baseline_grid_state, {"power_mw": 20.0, "duration_minutes": 15.0})
    assert res.success is False
    assert res.error.code == "INSUFFICIENT_STORAGE"


# --- 6. GridOutcomeValidator Tests ---

def test_grid_outcome_validator_pass(baseline_grid_state):
    validator = GridOutcomeValidator()
    result = validator.validate(baseline_grid_state)
    assert result.valid is True
    assert result.details["critical_facilities_verified"] == 3


def test_grid_outcome_validator_fail_critical_load(baseline_grid_state):
    """Verifies Contract 7: failed_critical_loads."""
    baseline_grid_state["loads"][0]["supplied_mw"] = 10.0  # Hospital needs 30MW
    validator = GridOutcomeValidator()
    result = validator.validate(baseline_grid_state)
    assert result.valid is False
    assert "HOSPITAL" in result.details["failed_critical_loads"]


def test_grid_outcome_validator_fail_overloaded_line(baseline_grid_state):
    baseline_grid_state["transmission_lines"][1]["load_mw"] = 75.0  # TL4 capacity is 60MW
    validator = GridOutcomeValidator()
    result = validator.validate(baseline_grid_state)
    assert result.valid is False
    assert len(result.details["overloaded_lines"]) == 1
    assert result.details["overloaded_lines"][0]["line"] == "TL4"
