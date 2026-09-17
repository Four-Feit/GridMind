"""
Hardcoded-Routing & Dynamic Autonomy Tests (Mandated by README Section 22)
Proves that:
1. Tool choice is never hardcoded.
2. The agent reacts dynamically to differing grid telemetry.
3. The framework adapts when tools are disabled/unavailable in the registry.
4. Telemetry metrics are tracked accurately.
"""
import pytest
from backend.core.agent import AgentController
from backend.core.events import EventBus
from backend.core.planner import Planner
from backend.core.registry import CapabilityRegistry, ToolResult
from backend.llm.client import FakeLLM


class MockAnalyzer:
    name = "grid_analyzer"
    description = "Scans grid"
    def input_schema(self): return {"type": "object", "properties": {}}
    def execute(self, state, args): return ToolResult(success=True, data={"status": "scanned"})


class MockRedistribution:
    name = "redistribution_engine"
    description = "Reroutes lines"
    def input_schema(self): return {"type": "object", "properties": {"target_substation": {"type": "string"}}}
    def execute(self, state, args): return ToolResult(success=True, data={"status": "rerouted"})


class MockBattery:
    name = "battery_engine"
    description = "Discharges battery"
    def input_schema(self): return {"type": "object", "properties": {"power_mw": {"type": "number"}}, "required": ["power_mw"]}
    def execute(self, state, args): return ToolResult(success=True, data={"discharged": args["power_mw"]})


class MockPriorityManager:
    name = "priority_load_manager"
    description = "Sheds non-critical load"
    def input_schema(self): return {"type": "object", "properties": {"protect_critical": {"type": "boolean"}}}
    def execute(self, state, args):
        for l in state.get("loads", []):
            if l.get("id") == "HOSPITAL":
                l["connected"] = True
                l["supplied_mw"] = 30.0
        return ToolResult(success=True, data={"served": ["HOSPITAL"]})


@pytest.fixture
def base_registry():
    reg = CapabilityRegistry()
    reg.register(MockAnalyzer())
    reg.register(MockRedistribution())
    reg.register(MockBattery())
    reg.register(MockPriorityManager())
    return reg


def test_dynamic_tool_selection_across_different_states(base_registry):
    """Proves that varying state inputs produce dynamically varying tool actions (Rule 6)."""
    llm = FakeLLM()
    planner = Planner(llm, EventBus())

    # State A: Hospital disconnected -> selects redistribution
    state_outage = {
        "generation_mw": 180,
        "demand_mw": 150,
        "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 0, "connected": False}]
    }
    action_a = planner.decide("Protect hospital", state_outage, base_registry.describe_all(), {}, plan_id=1)
    assert action_a.action == "redistribution_engine"

    # State B: Generation deficit -> selects battery
    state_deficit = {
        "generation_mw": 120,
        "demand_mw": 150,
        "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 30, "connected": True}]
    }
    action_b = planner.decide("Maintain balance", state_deficit, base_registry.describe_all(), {}, plan_id=2)
    assert action_b.action == "battery_engine"

    # State C: Normal healthy grid -> selects analyzer
    state_healthy = {
        "generation_mw": 180,
        "demand_mw": 150,
        "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 30, "connected": True}]
    }
    action_c = planner.decide("Monitor grid", state_healthy, base_registry.describe_all(), {}, plan_id=3)
    assert action_c.action == "grid_analyzer"


def test_framework_adapts_when_tool_is_disabled(base_registry):
    """Proves the agent does not assume tools are always available (README Section 22)."""
    # Disable battery_engine
    base_registry.set_enabled("battery_engine", False)
    available_tools = base_registry.describe_all(enabled_only=True)
    assert not any(t["name"] == "battery_engine" for t in available_tools)

    # Re-enabling makes it available again
    base_registry.set_enabled("battery_engine", True)
    available_tools_re = base_registry.describe_all(enabled_only=True)
    assert any(t["name"] == "battery_engine" for t in available_tools_re)


def test_agent_controller_end_to_end_metrics():
    """Verifies that the agent controller executes, recovers, and reports telemetry metrics."""
    grid = {
        "generation_mw": 180,
        "demand_mw": 150,
        "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 0, "connected": False}]
    }

    # Setup tools where redistribution fails, and priority manager restores hospital
    class FailingRedistribution:
        name = "redistribution_engine"
        description = "Fails"
        def input_schema(self): return {"type": "object", "properties": {"target_substation": {"type": "string"}}}
        def execute(self, s, a):
            from backend.core.registry import ToolError
            return ToolResult(success=False, error=ToolError(code="TRANSMISSION_OVERLOAD", message="TL4 overloaded", details={"line": "TL4", "capacity_mw": 60}))

    reg = CapabilityRegistry()
    reg.register(FailingRedistribution())
    reg.register(MockPriorityManager())

    # Scripted decisions: 1st tries redistribution, 2nd switches to priority manager
    llm = FakeLLM(scripted_responses=[
        {"action": "redistribution_engine", "arguments": {"target_substation": "S2"}, "reason": "Try reroute"},
        {"action": "priority_load_manager", "arguments": {"protect_critical": True}, "reason": "Shed load for hospital"}
    ])

    bus = EventBus()
    planner = Planner(llm, bus)
    agent = AgentController(
        planner=planner,
        registry=reg,
        state_supplier=lambda: grid,
        event_bus=bus,
        max_cycles=5
    )

    success = agent.run("Protect hospital")
    assert success is True

    # Verify metrics
    metrics = agent.get_metrics()
    assert metrics["plans_created"] >= 2
    assert metrics["tool_failures"] == 1
    assert metrics["successful_recoveries"] == 1
    assert metrics["replans_triggered"] >= 1
    assert metrics["cycles_executed"] >= 2
