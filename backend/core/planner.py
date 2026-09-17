"""
Planner (Owned by P1)
Connects working memory, current telemetry, and capability registry into LLM decisions.
Emits PLAN_CREATED and TOOL_SELECTED lifecycle trace events.
"""
from typing import Any, Dict, List, Optional
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.registry import ToolCall
from backend.llm.client import LLMClient


class Planner:
    """
    Formulates planning context for LLM decision-making and returns validated ToolCalls.
    Tracks planning history and ensures model rationale is recorded.
    """

    def __init__(self, llm_client: LLMClient, event_bus: EventBus):
        self.llm = llm_client
        self.events = event_bus
        self.history: List[ToolCall] = []

    def decide(
        self,
        goal: str,
        state: Dict[str, Any],
        capabilities: List[Dict[str, Any]],
        memory_context: Dict[str, Any],
        plan_id: int
    ) -> ToolCall:
        """
        Executes one planning step:
        1. Packs current state, available tools, past failures, and learned constraints.
        2. Calls the LLM adapter.
        3. Parses output into a structured ToolCall.
        4. Emits PLAN_CREATED and TOOL_SELECTED events.
        """
        context = {
            "goal": goal,
            "grid_state": state,
            "available_capabilities": capabilities,
            "previous_failures": memory_context.get("previous_failures", []),
            "known_constraints": memory_context.get("known_constraints", []),
            "recent_actions": memory_context.get("recent_actions", [])
        }

        try:
            decision_data = self.llm.generate_decision(context)
        except Exception as e:
            # If LLM invocation itself fails unexpectedly, return an explicit failure tool call
            decision_data = {
                "action": "error",
                "arguments": {},
                "reason": f"LLM generation failed with exception: {str(e)}"
            }

        tool_call = ToolCall(
            action=decision_data.get("action", ""),
            arguments=decision_data.get("arguments", {}),
            reason=decision_data.get("reason", "")
        )
        self.history.append(tool_call)

        # Emit audit trace events
        self.events.emit(AgentEvent(
            type=AgentEventType.PLAN_CREATED,
            plan_id=plan_id,
            tool=tool_call.action,
            message=f"Plan #{plan_id} formulated: selected {tool_call.action}",
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
