"""
Agent Events and Trace System (Owned by P1)
"""
import time
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentEventType(str, Enum):
    MISSION_STARTED = "MISSION_STARTED"
    OBSERVATION = "OBSERVATION"
    PLAN_CREATED = "PLAN_CREATED"
    TOOL_SELECTED = "TOOL_SELECTED"
    TOOL_STARTED = "TOOL_STARTED"
    TOOL_SUCCESS = "TOOL_SUCCESS"
    TOOL_FAILED = "TOOL_FAILED"
    TOOL_REJECTED = "TOOL_REJECTED"
    PLAN_INVALIDATED = "PLAN_INVALIDATED"
    REPLAN_STARTED = "REPLAN_STARTED"
    VALIDATION_STARTED = "VALIDATION_STARTED"
    VALIDATION_PASSED = "VALIDATION_PASSED"
    VALIDATION_FAILED = "VALIDATION_FAILED"
    MISSION_COMPLETED = "MISSION_COMPLETED"
    MISSION_FAILED = "MISSION_FAILED"
    CHAOS_EVENT = "CHAOS_EVENT"


class AgentEvent(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    type: AgentEventType
    plan_id: Optional[int] = None
    tool: Optional[str] = None
    message: str
    data: Dict[str, Any] = Field(default_factory=dict)


class EventBus:
    """Manages publishing and subscribing to agent events."""

    def __init__(self):
        self._subscribers: List[Callable[[AgentEvent], Any]] = []
        self._history: List[AgentEvent] = []

    def subscribe(self, callback: Callable[[AgentEvent], Any]) -> None:
        self._subscribers.append(callback)

    def emit(self, event: AgentEvent) -> None:
        self._history.append(event)
        for sub in self._subscribers:
            try:
                sub(event)
            except Exception:
                pass

    def get_history(self) -> List[AgentEvent]:
        return list(self._history)
