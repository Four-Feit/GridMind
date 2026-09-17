"""
Executor (Owned by P1)
"""
from typing import Any, Dict
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.registry import CapabilityRegistry, ToolCall, ToolError, ToolResult


class Executor:
    """Executes validated capabilities safely and returns ToolResult."""

    def __init__(self, event_bus: EventBus):
        self.events = event_bus

    def execute(self, decision: ToolCall, state: Dict[str, Any], registry: CapabilityRegistry, plan_id: int = 0) -> ToolResult:
        tool = registry.get(decision.action)
        if not tool:
            err = ToolResult(
                success=False,
                error=ToolError(
                    code="CAPABILITY_NOT_FOUND",
                    message=f"Capability '{decision.action}' not found."
                )
            )
            self.events.emit(AgentEvent(
                type=AgentEventType.TOOL_FAILED,
                plan_id=plan_id,
                tool=decision.action,
                message=f"Tool {decision.action} failed: not found"
            ))
            return err

        self.events.emit(AgentEvent(
            type=AgentEventType.TOOL_STARTED,
            plan_id=plan_id,
            tool=decision.action,
            message=f"Executing tool {decision.action}",
            data={"arguments": decision.arguments}
        ))

        try:
            result = tool.execute(state, decision.arguments)
        except Exception as e:
            result = ToolResult(
                success=False,
                error=ToolError(
                    code="TOOL_EXECUTION_EXCEPTION",
                    message=str(e)
                )
            )

        if result.success:
            self.events.emit(AgentEvent(
                type=AgentEventType.TOOL_SUCCESS,
                plan_id=plan_id,
                tool=decision.action,
                message=f"Tool {decision.action} completed successfully",
                data=result.data or {}
            ))
        else:
            err_msg = result.error.message if result.error else "Unknown error"
            self.events.emit(AgentEvent(
                type=AgentEventType.TOOL_FAILED,
                plan_id=plan_id,
                tool=decision.action,
                message=f"Tool {decision.action} failed: {err_msg}",
                data=result.error.details if result.error else {}
            ))

        return result
