"""
Observer (Owned by P1)
"""
from typing import Any, Callable, Dict
from backend.core.events import AgentEvent, AgentEventType, EventBus


class Observer:
    """Queries simulator (P2) to fetch current GridState."""

    def __init__(self, state_supplier: Callable[[], Dict[str, Any]], event_bus: EventBus):
        self._state_supplier = state_supplier
        self.events = event_bus

    def observe(self, plan_id: int = 0) -> Dict[str, Any]:
        grid_state = self._state_supplier()
        self.events.emit(AgentEvent(
            type=AgentEventType.OBSERVATION,
            plan_id=plan_id,
            message="Observed fresh grid state",
            data={
                "generation_mw": grid_state.get("generation_mw"),
                "demand_mw": grid_state.get("demand_mw"),
                "failures": grid_state.get("failures", [])
            }
        ))
        return grid_state
