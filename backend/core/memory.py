"""
Memory (Owned by P1)
"""
from typing import Any, Dict, List
from pydantic import BaseModel, Field
from backend.core.registry import ToolCall, ToolResult


class MemoryRecord(BaseModel):
    plan_id: int
    tool_call: ToolCall
    result: ToolResult


class Memory:
    """Maintains execution history, failures, and learned constraints."""

    def __init__(self):
        self.history: List[MemoryRecord] = []
        self.failures: List[Dict[str, Any]] = []
        self.constraints: List[str] = []

    def record(self, plan_id: int, tool_call: ToolCall, result: ToolResult) -> None:
        self.history.append(MemoryRecord(
            plan_id=plan_id,
            tool_call=tool_call,
            result=result
        ))
        if not result.success and result.error:
            self.failures.append({
                "plan_id": plan_id,
                "tool": tool_call.action,
                "code": result.error.code,
                "message": result.error.message,
                "details": result.error.details
            })

    def add_constraint(self, constraint: str) -> None:
        if constraint not in self.constraints:
            self.constraints.append(constraint)

    def get_context(self) -> Dict[str, Any]:
        return {
            "recent_actions": [
                {"action": rec.tool_call.action, "success": rec.result.success}
                for rec in self.history[-5:]
            ],
            "previous_failures": self.failures[-5:],
            "known_constraints": self.constraints
        }

    def clear(self) -> None:
        self.history.clear()
        self.failures.clear()
        self.constraints.clear()
