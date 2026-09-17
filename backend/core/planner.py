"""
Planner (Owned by P1)
"""
from typing import Any, Dict, List, Optional
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.registry import ToolCall
from backend.llm.client import LLMClient


class Planner:
    """Formats context for LLM decision-making and returns validated ToolCall."""

    def __init__(self, llm_client: LLMClient, event_bus: EventBus):
        self.llm = llm_client
        self.events = event_bus

    def decide(
        self,
        goal: str,
        state: Dict[str, Any],
        capabilities: List[Dict[str, Any]],
        memory_context: Dict[str, Any],
        plan_id: int
    ) -> ToolCall:
        context = {
            "goal": goal,
            "grid_state": state,
            "available_capabilities": capabilities,
            "previous_failures": memory_context.get("previous_failures", []),
            "known_constraints": memory_context.get("known_constraints", []),
            "recent_actions": memory_context.get("recent_actions", [])
        }

        decision_data = self.llm.generate_decision(context)

        tool_call = ToolCall(
            action=decision_data.get("action", ""),
            arguments=decision_data.get("arguments", {}),
            reason=decision_data.get("reason", "")
        )

        self.events.emit(AgentEvent(
            type=AgentEventType.PLAN_CREATED,
            plan_id=plan_id,
            tool=tool_call.action,
            message=f"Plan #{plan_id} created: {tool_call.action}",
            data={"reason": tool_call.reason, "arguments": tool_call.arguments}
        ))
        self.events.emit(AgentEvent(
            type=AgentEventType.TOOL_SELECTED,
            plan_id=plan_id,
            tool=tool_call.action,
            message=f"Selected tool '{tool_call.action}'",
            data={"arguments": tool_call.arguments}
        ))

        return tool_call
