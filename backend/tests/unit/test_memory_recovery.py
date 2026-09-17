"""
Unit Tests for Memory & RecoveryEngine (Step 2 of P1 Brain)
"""
import pytest
from backend.core.events import AgentEventType, EventBus
from backend.core.memory import Memory
from backend.core.recovery import RecoveryEngine
from backend.core.registry import ToolCall, ToolError, ToolResult
from backend.core.state import StateManager
from backend.core.validator import ValidationResult


@pytest.fixture
def event_bus():
    return EventBus()


@pytest.fixture
def state_manager():
    return StateManager()


@pytest.fixture
def memory():
    return Memory(max_history=5)


@pytest.fixture
def recovery(state_manager, memory, event_bus):
    return RecoveryEngine(state=state_manager, memory=memory, event_bus=event_bus, max_tool_retries=2)


def test_memory_success_and_failure_recording(memory):
    call_success = ToolCall(action="grid_analyzer", arguments={})
    res_success = ToolResult(success=True, data={"generation": 180})
    memory.record(plan_id=1, tool_call=call_success, result=res_success)

    assert len(memory.history) == 1
    assert len(memory.failures) == 0

    call_fail = ToolCall(action="redistribution_engine", arguments={"target_substation": "S2"})
    res_fail = ToolResult(
        success=False,
        error=ToolError(code="TRANSMISSION_OVERLOAD", message="TL4 overloaded", details={"line": "TL4", "capacity_mw": 60.0})
    )
    memory.record(plan_id=2, tool_call=call_fail, result=res_fail)

    assert len(memory.history) == 2
    assert len(memory.failures) == 1
    assert memory.failures[0]["tool"] == "redistribution_engine"
    assert "redistribution_engine" in memory.get_failed_tools()


def test_memory_automatic_constraint_extraction(memory):
    call = ToolCall(action="redistribution_engine", arguments={})
    res = ToolResult(
        success=False,
        error=ToolError(
            code="TRANSMISSION_OVERLOAD",
            message="Line overload",
            details={"line": "TL4", "capacity_mw": 60.0}
        )
    )
    memory.record(plan_id=1, tool_call=call, result=res)

    assert len(memory.constraints) == 1
    assert "Line TL4 capacity limit is 60.0MW" in memory.constraints


def test_memory_consecutive_failures(memory):
    call = ToolCall(action="battery_engine", arguments={"power_mw": 100})
    fail = ToolResult(success=False, error=ToolError(code="BATTERY_LIMIT", message="Max 40MW"))

    memory.record(plan_id=1, tool_call=call, result=fail)
    assert memory.consecutive_failures("battery_engine") == 1

    memory.record(plan_id=2, tool_call=call, result=fail)
    assert memory.consecutive_failures("battery_engine") == 2

    # Success resets consecutive failures
    success = ToolResult(success=True, data={})
    memory.record(plan_id=3, tool_call=call, result=success)
    assert memory.consecutive_failures("battery_engine") == 0


def test_recovery_engine_handles_tool_failure(recovery, memory, state_manager, event_bus):
    emitted = []
    event_bus.subscribe(lambda e: emitted.append(e.type))

    call = ToolCall(action="redistribution_engine", arguments={"target": "S2"})
    fail = ToolResult(
        success=False,
        error=ToolError(code="TRANSMISSION_OVERLOAD", message="TL4 overloaded", details={"line": "TL4", "capacity_mw": 60.0})
    )

    # First record in memory as executor does
    memory.record(plan_id=1, tool_call=call, result=fail)
    recovery_info = recovery.handle_tool_failure(call, fail, plan_id=1)

    assert recovery_info["failed_action"] == "redistribution_engine"
    assert AgentEventType.PLAN_INVALIDATED in emitted
    assert AgentEventType.REPLAN_STARTED in emitted

    # State manager received failure description and synced constraints
    assert any("redistribution_engine" in f for f in state_manager.mission.previous_failures)
    assert any("TL4" in c for c in state_manager.mission.known_constraints)


def test_recovery_engine_warning_on_repeated_failure(recovery, memory, state_manager):
    call = ToolCall(action="redistribution_engine", arguments={})
    fail = ToolResult(success=False, error=ToolError(code="FAIL", message="Failed"))

    memory.record(plan_id=1, tool_call=call, result=fail)
    recovery.handle_tool_failure(call, fail, plan_id=1)

    memory.record(plan_id=2, tool_call=call, result=fail)
    recovery.handle_tool_failure(call, fail, plan_id=2)

    # 2 consecutive failures should trigger alternative capability warning
    assert any("failed 2 times consecutively" in c for c in memory.constraints)


def test_recovery_engine_handles_invalid_action(recovery, event_bus):
    emitted = []
    event_bus.subscribe(lambda e: emitted.append(e.type))

    call = ToolCall(action="bad_tool", arguments={})
    val = ValidationResult(valid=False, code="TOOL_NOT_FOUND", reason="Not found")

    recovery.handle_invalid_action(call, val, plan_id=1)

    assert AgentEventType.TOOL_REJECTED in emitted
    assert AgentEventType.REPLAN_STARTED in emitted


def test_recovery_replan_feedback_formatting(recovery, memory):
    call = ToolCall(action="redistribution_engine", arguments={})
    fail = ToolResult(success=False, error=ToolError(code="TRANSMISSION_OVERLOAD", message="TL4 exceeded"))
    memory.record(plan_id=1, tool_call=call, result=fail)

    feedback = recovery.format_replan_prompt_feedback()
    assert "redistribution_engine" in feedback
    assert "TRANSMISSION_OVERLOAD" in feedback
