"""
Recovery Engine (Owned by P1)
Handles capability failures, plan invalidations, and coordinates autonomous replanning.
Strictly adheres to Rule 5 (Failures as first-class data) and Rule 6 (No hardcoded tool routing).
"""
from typing import Any, Dict, Optional
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.memory import Memory
from backend.core.registry import ToolCall, ToolResult
from backend.core.state import StateManager
from backend.core.validator import ValidationResult


class RecoveryEngine:
    """
    Coordinates agent recovery after tool execution failures or invalid actions.
    Translates errors into structured planning feedback without hardcoding fallback choices.
    """

    def __init__(self, state: StateManager, memory: Memory, event_bus: EventBus, max_tool_retries: int = 2):
        self.state = state
        self.memory = memory
        self.events = event_bus
        self.max_tool_retries = max_tool_retries

    def handle_tool_failure(self, decision: ToolCall, result: ToolResult, plan_id: int) -> Dict[str, Any]:
        """
        Executes recovery sequence for a failed capability execution.
        Emits PLAN_INVALIDATED and REPLAN_STARTED events.
        """
        err_msg = result.error.message if result.error else "Unknown execution error"
        err_code = result.error.code if result.error else "EXECUTION_ERROR"

        # Update StateManager
        self.state.record_failure(decision.action, err_msg)

        # Sync learned constraints from Memory to StateManager
        for c in self.memory.constraints:
            self.state.add_constraint(c)

        # Check consecutive failures
        consecutive = self.memory.consecutive_failures(decision.action)
        if consecutive >= self.max_tool_retries:
            warning_constraint = f"Capability '{decision.action}' has failed {consecutive} times consecutively; try an alternative capability."
            self.memory.add_constraint(warning_constraint)
            self.state.add_constraint(warning_constraint)

        # 1. Invalidate plan
        self.events.emit(AgentEvent(
            type=AgentEventType.PLAN_INVALIDATED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Plan #{plan_id} invalidated: {decision.action} failed with {err_code}",
            data={"error_code": err_code, "error_message": err_msg}
        ))

        # 2. Trigger replan
        self.events.emit(AgentEvent(
            type=AgentEventType.REPLAN_STARTED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Initiating autonomous replan following failure of {decision.action}"
        ))

        return {
            "failed_action": decision.action,
            "error_code": err_code,
            "error_message": err_msg,
            "consecutive_failures": consecutive
        }

    def handle_invalid_action(self, decision: ToolCall, validation: ValidationResult, plan_id: int) -> None:
        """
        Handles pre-execution rejection (e.g. missing args or invalid types).
        """
        self.events.emit(AgentEvent(
            type=AgentEventType.TOOL_REJECTED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Action '{decision.action}' rejected: {validation.reason}",
            data={"code": validation.code, "details": validation.details}
        ))
        self.events.emit(AgentEvent(
            type=AgentEventType.REPLAN_STARTED,
            plan_id=plan_id,
            message=f"Replanning after invalid tool selection: {decision.action}"
        ))

    def handle_outcome_failure(self, outcome: ValidationResult, plan_id: int) -> None:
        """
        Handles post-execution environment state that fails safety goals.
        """
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

    def format_replan_prompt_feedback(self) -> str:
        """
        Formats a helpful summary string to inject into the planner's next prompt.
        """
        recent_failures = self.memory.failures[-3:]
        if not recent_failures:
            return ""

        lines = ["Previous action failures to avoid:"]
        for f in recent_failures:
            lines.append(f"- Tool '{f['tool']}' failed with [{f['code']}]: {f['message']}")
        return "\n".join(lines)
