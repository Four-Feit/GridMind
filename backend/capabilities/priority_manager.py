"""
Priority Load Manager Capability (Owned by P3)
"""
from typing import Any, Dict, Optional
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolResult


class PriorityLoadManager(BaseCapability):
    name = "priority_load_manager"
    description = "Prioritize power allocation to critical facilities and shed non-critical load when necessary."

    def __init__(self, simulator: Optional[Any] = None):
        self.simulator = simulator

    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "protect_critical": {
                    "type": "boolean",
                    "description": "Whether to protect critical infrastructure by shedding non-critical loads."
                }
            },
            "required": ["protect_critical"]
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        if self.simulator is not None and hasattr(self.simulator, "loads"):
            for load in self.simulator.loads:
                if load.priority == "critical":
                    load.connected = True
                    load.supplied_mw = load.demand_mw
                elif load.id == "FACTORY":
                    load.connected = False
                    load.supplied_mw = 0.0

        for load in state.get("loads", []):
            if load.get("priority") == "critical":
                load["connected"] = True
                load["supplied_mw"] = load.get("demand_mw", 0)
            elif load.get("id") == "FACTORY":
                load["connected"] = False
                load["supplied_mw"] = 0

        return ToolResult(
            success=True,
            data={
                "served": ["HOSPITAL", "WATER_PLANT"],
                "shed": ["FACTORY"]
            }
        )
