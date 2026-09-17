"""
Recovery Engine (Owned by P1)
"""
from typing import Any, Dict
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.memory import Memory
from backend.core.registry import ToolCall, ToolResult
from backend.core.state import StateManager
from backend.core.validator import ValidationResult


class RecoveryEngine:
    """Handles capability failures, validation errors, and coordinates replanning."""

    def __init__(self, state: StateManager, memory: Memory, event_bus: EventBus):
        self.state = state
        self.memory = memory
        self.events = event_bus

    def handle_tool_failure(self, decision: ToolCall, result: ToolResult, plan_id: int) -> None:
        err_msg = result.error.message if result.error else "Unknown tool error"
        self.state.record_failure(decision.action, err_msg)

        # Invalidate plan and start replanning
        self.events.emit(AgentEvent(
            type=AgentEventType.PLAN_INVALIDATED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Plan #{plan_id} invalidated due to tool failure: {err_msg}"
        ))

        self.events.emit(AgentEvent(
            type=AgentEventType.REPLAN_STARTED,
            plan_id=plan_id,
            message=f"Initiating dynamic replan following failure of {decision.action}"
        ))

    def handle_invalid_action(self, decision: ToolCall, validation: ValidationResult, plan_id: int) -> None:
        self.events.emit(AgentEvent(
            type=AgentEventType.TOOL_REJECTED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Tool call rejected: {validation.reason}"
        ))
        self.events.emit(AgentEvent(
            type=AgentEventType.REPLAN_STARTED,
            plan_id=plan_id,
            message=f"Replanning after invalid tool selection: {decision.action}"
        ))

    def handle_outcome_failure(self, outcome: ValidationResult, plan_id: int) -> None:
        self.events.emit(AgentEvent(
            type=AgentEventType.VALIDATION_FAILED,
            plan_id=plan_id,
            message=f"Post-action outcome validation failed: {outcome.reason}",
            data=outcome.details
        ))
        self.events.emit(AgentEvent(
            type=AgentEventType.REPLAN_STARTED,
            plan_id=plan_id,
            message="Replanning because grid state did not satisfy mission goals."
        ))
