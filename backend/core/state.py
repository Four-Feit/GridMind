"""
State Manager (Owned by P1)
"""
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MissionStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class MissionState(BaseModel):
    mission_id: str
    goal: str
    status: MissionStatus = MissionStatus.IDLE
    plan_id: int = 0
    observation_count: int = 0
    previous_failures: List[str] = Field(default_factory=list)
    known_constraints: List[str] = Field(default_factory=list)
    critical_loads: List[str] = Field(default_factory=list)


class StateManager:
    """Manages mission state and latest observed grid state."""

    def __init__(self, mission_id: str = "mission-001", goal: str = "Maintain power to critical facilities"):
        self.mission = MissionState(
            mission_id=mission_id,
            goal=goal,
            critical_loads=["HOSPITAL", "WATER_PLANT", "EMERGENCY_SERVICES"]
        )
        self.grid_state: Dict[str, Any] = {}
        self.last_observation_id: int = 0

    def update_grid(self, observation: Dict[str, Any]) -> None:
        self.grid_state = observation
        self.mission.observation_count += 1
        self.last_observation_id += 1

    def increment_plan_id(self) -> int:
        self.mission.plan_id += 1
        return self.mission.plan_id

    def record_failure(self, tool_name: str, reason: Optional[str] = None) -> None:
        fail_desc = f"{tool_name}: {reason}" if reason else tool_name
        self.mission.previous_failures.append(fail_desc)

    def add_constraint(self, constraint: str) -> None:
        if constraint not in self.mission.known_constraints:
            self.mission.known_constraints.append(constraint)
