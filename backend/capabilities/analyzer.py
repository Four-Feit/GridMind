"""
Grid Analyzer Capability (Owned by P3)
"""
from typing import Any, Dict
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolResult


class GridAnalyzer(BaseCapability):
    name = "grid_analyzer"
    description = "Inspect the grid to identify outages, critical loads, deficit/surplus, and overloaded lines."

    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {},
            "required": []
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        failures = state.get("failures", [])
        critical_affected = []
        for load in state.get("loads", []):
            if load.get("priority") == "critical" and (not load.get("connected", True) or load.get("supplied_mw", 0) < load.get("demand_mw", 0)):
                critical_affected.append(load.get("id"))

        return ToolResult(
            success=True,
            data={
                "generation_mw": state.get("generation_mw"),
                "demand_mw": state.get("demand_mw"),
                "failed_components": failures,
                "critical_loads_affected": critical_affected
            }
        )
