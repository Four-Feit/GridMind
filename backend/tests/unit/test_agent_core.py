"""
Unit Tests for P1 Agent Core
Tests:
- Action validation
- Tool execution
- Failure handling
- Plan invalidation and dynamic replan
- Outcome validation
"""
from backend.core.agent import AgentController
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.planner import Planner
from backend.core.registry import CapabilityRegistry, ToolError, ToolResult
from backend.llm.client import FakeLLM


class MockFailingTool:
    name = "redistribution_engine"
    description = "Mock redistribution that fails with TL4 overload"

    def input_schema(self):
        return {"type": "object", "properties": {"target_substation": {"type": "string"}}}

    def execute(self, state, arguments):
        return ToolResult(
            success=False,
            error=ToolError(
                code="TRANSMISSION_OVERLOAD",
                message="TL4 overloaded"
            )
        )


class MockRecoveringTool:
    name = "priority_load_manager"
    description = "Mock load manager that succeeds and restores hospital"

    def input_schema(self):
        return {"type": "object", "properties": {"protect_critical": {"type": "boolean"}}}

    def execute(self, state, arguments):
        # Update mock state to satisfy outcome validation
        for load in state.get("loads", []):
            if load.get("id") == "HOSPITAL":
                load["connected"] = True
                load["supplied_mw"] = 30.0
        return ToolResult(success=True, data={"served": ["HOSPITAL"]})


def test_agent_core_recovery_and_replan():
    # Setup mock grid state where hospital is disconnected
    grid_state = {
        "generation_mw": 180,
        "demand_mw": 150,
        "loads": [
            {"id": "HOSPITAL", "demand_mw": 30.0, "supplied_mw": 0.0, "priority": "critical", "connected": False}
        ]
    }

    # Setup Registry
    registry = CapabilityRegistry()
    registry.register(MockFailingTool())
    registry.register(MockRecoveringTool())

    # Setup FakeLLM with scripted decisions:
    # 1. First tries redistribution (which will fail)
    # 2. Then falls back to priority_load_manager (which succeeds)
    scripted_decisions = [
        {"action": "redistribution_engine", "arguments": {"target_substation": "S2"}, "reason": "Try rerouting"},
        {"action": "priority_load_manager", "arguments": {"protect_critical": True}, "reason": "Shed load for hospital"}
    ]
    fake_llm = FakeLLM(scripted_responses=scripted_decisions)

    event_bus = EventBus()
    emitted_event_types = []
    event_bus.subscribe(lambda e: emitted_event_types.append(e.type))

    planner = Planner(fake_llm, event_bus)
    agent = AgentController(
        planner=planner,
        registry=registry,
        state_supplier=lambda: grid_state,
        event_bus=event_bus,
        max_cycles=5
    )

    completed = agent.run("Protect critical hospital load")

    assert completed is True
    assert AgentEventType.TOOL_FAILED in emitted_event_types
    assert AgentEventType.PLAN_INVALIDATED in emitted_event_types
    assert AgentEventType.REPLAN_STARTED in emitted_event_types
    assert AgentEventType.TOOL_SUCCESS in emitted_event_types
    assert AgentEventType.MISSION_COMPLETED in emitted_event_types
