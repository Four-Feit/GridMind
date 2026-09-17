"""
Unit Tests for CapabilityRegistry & ActionValidator (Step 1 of P1 Brain)
"""
import pytest
from backend.core.registry import CapabilityRegistry, ToolCall, ToolResult
from backend.core.validator import ActionValidator


class DummyBatteryCapability:
    name = "battery_engine"
    description = "Discharges battery power"

    def input_schema(self):
        return {
            "type": "object",
            "properties": {
                "power_mw": {"type": "number"},
                "mode": {"type": "string"},
                "active": {"type": "boolean"}
            },
            "required": ["power_mw"]
        }

    def execute(self, state, arguments):
        return ToolResult(success=True, data={"discharged": arguments["power_mw"]})


@pytest.fixture
def registry():
    reg = CapabilityRegistry()
    reg.register(DummyBatteryCapability())
    return reg


@pytest.fixture
def validator():
    return ActionValidator()


def test_registry_registration_and_description(registry):
    assert "battery_engine" in registry.list()
    assert registry.is_enabled("battery_engine") is True

    specs = registry.describe_all()
    assert len(specs) == 1
    assert specs[0]["name"] == "battery_engine"
    assert "power_mw" in specs[0]["input_schema"]["properties"]


def test_registry_enable_disable(registry):
    registry.set_enabled("battery_engine", False)
    assert registry.is_enabled("battery_engine") is False
    assert registry.get("battery_engine") is None
    assert len(registry.list(enabled_only=True)) == 0
    assert len(registry.describe_all(enabled_only=True)) == 0

    registry.set_enabled("battery_engine", True)
    assert registry.is_enabled("battery_engine") is True
    assert registry.get("battery_engine") is not None


def test_validator_valid_action(registry, validator):
    call = ToolCall(action="battery_engine", arguments={"power_mw": 25.5, "mode": "emergency", "active": True})
    res = validator.validate_action(call, registry)
    assert res.valid is True
    assert res.code is None


def test_validator_tool_not_found(registry, validator):
    call = ToolCall(action="ghost_tool", arguments={})
    res = validator.validate_action(call, registry)
    assert res.valid is False
    assert res.code == "TOOL_NOT_FOUND"


def test_validator_tool_disabled(registry, validator):
    registry.set_enabled("battery_engine", False)
    call = ToolCall(action="battery_engine", arguments={"power_mw": 10})
    res = validator.validate_action(call, registry)
    assert res.valid is False
    assert res.code == "TOOL_DISABLED"


def test_validator_missing_required_argument(registry, validator):
    call = ToolCall(action="battery_engine", arguments={"mode": "normal"})
    res = validator.validate_action(call, registry)
    assert res.valid is False
    assert res.code == "MISSING_ARGUMENT"
    assert "power_mw" in res.reason


def test_validator_invalid_argument_type(registry, validator):
    # Pass string instead of number
    call = ToolCall(action="battery_engine", arguments={"power_mw": "twenty"})
    res = validator.validate_action(call, registry)
    assert res.valid is False
    assert res.code == "INVALID_ARG_TYPE"

    # Pass bool instead of number (bool inherits from int in python)
    call_bool = ToolCall(action="battery_engine", arguments={"power_mw": True})
    res_bool = validator.validate_action(call_bool, registry)
    assert res_bool.valid is False
    assert res_bool.code == "INVALID_ARG_TYPE"


def test_validator_out_of_bounds(registry, validator):
    call = ToolCall(action="battery_engine", arguments={"power_mw": -10.0})
    res = validator.validate_action(call, registry)
    assert res.valid is False
    assert res.code == "OUT_OF_BOUNDS"


def test_validator_outcome_critical_deficit(validator):
    # Valid grid state
    good_state = {
        "loads": [
            {"id": "HOSPITAL", "priority": "critical", "demand_mw": 30.0, "supplied_mw": 30.0, "connected": True}
        ]
    }
    assert validator.validate_outcome(good_state).valid is True

    # Critical deficit
    bad_state = {
        "loads": [
            {"id": "HOSPITAL", "priority": "critical", "demand_mw": 30.0, "supplied_mw": 0.0, "connected": False}
        ]
    }
    res = validator.validate_outcome(bad_state)
    assert res.valid is False
    assert res.code == "CRITICAL_LOAD_DEFICIT"
    assert "HOSPITAL" in res.details["failed_critical_loads"]
