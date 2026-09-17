"""
Memory (Owned by P1)
Maintains short-term cycle trace, structured failure records, and automatically learned constraints.
"""
import time
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.core.registry import ToolCall, ToolResult


class MemoryRecord(BaseModel):
    plan_id: int
    tool_call: ToolCall
    result: ToolResult
    timestamp: float = Field(default_factory=time.time)


class Memory:
    """
    Agent working memory.
    Stores past actions, execution results, failures, and learned environmental constraints.
    """

    def __init__(self, max_history: int = 20):
        self.max_history = max_history
        self.history: List[MemoryRecord] = []
        self.failures: List[Dict[str, Any]] = []
        self.constraints: List[str] = []

    def record(self, plan_id: int, tool_call: ToolCall, result: ToolResult) -> None:
        """Records an executed tool call and its outcome."""
        rec = MemoryRecord(
            plan_id=plan_id,
            tool_call=tool_call,
            result=result
        )
        self.history.append(rec)
        if len(self.history) > self.max_history:
            self.history.pop(0)

        # If failed, catalog the failure and extract learned constraints
        if not result.success and result.error:
            failure_entry = {
                "plan_id": plan_id,
                "tool": tool_call.action,
                "code": result.error.code,
                "message": result.error.message,
                "details": result.error.details,
                "timestamp": rec.timestamp
            }
            self.failures.append(failure_entry)
            self._extract_constraints_from_error(tool_call, result.error)

    def _extract_constraints_from_error(self, tool_call: ToolCall, error: Any) -> None:
        """
        Dynamically extracts learned environment constraints from error payloads.
        Example: TL4 transmission overload discovers 'TL4 capacity is 60.0MW'.
        """
        if error.code == "TRANSMISSION_OVERLOAD":
            line = error.details.get("line")
            cap = error.details.get("capacity_mw")
            if line and cap is not None:
                self.add_constraint(f"Line {line} capacity limit is {cap}MW")
        elif error.code == "BATTERY_OUTPUT_EXCEEDED":
            max_out = error.details.get("max_output_mw")
            if max_out is not None:
                self.add_constraint(f"Battery max output limit is {max_out}MW")

    def add_constraint(self, constraint: str) -> None:
        """Adds a discovered constraint without duplication."""
        clean = constraint.strip()
        if clean and clean not in self.constraints:
            self.constraints.append(clean)

    def get_failed_tools(self) -> List[str]:
        """Returns unique tool names that have failed during this mission."""
        return list({f["tool"] for f in self.failures})

    def consecutive_failures(self, tool_name: str) -> int:
        """Counts how many times tool_name has failed consecutively most recently."""
        count = 0
        for rec in reversed(self.history):
            if rec.tool_call.action == tool_name:
                if not rec.result.success:
                    count += 1
                else:
                    break
            else:
                break
        return count

    def get_context(self) -> Dict[str, Any]:
        """
        Builds concise memory context for the Planner / LLM prompt.
        Focuses on recent actions, previous failures, and learned constraints.
        """
        recent = [
            {
                "plan_id": rec.plan_id,
                "action": rec.tool_call.action,
                "success": rec.result.success,
                "error": rec.result.error.code if rec.result.error else None
            }
            for rec in self.history[-5:]
        ]
        return {
            "recent_actions": recent,
            "previous_failures": self.failures[-5:],
            "known_constraints": list(self.constraints)
        }

    def clear(self) -> None:
        """Resets memory state."""
        self.history.clear()
        self.failures.clear()
        self.constraints.clear()
