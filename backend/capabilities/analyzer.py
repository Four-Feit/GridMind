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
        """
        Performs read-only diagnostic analysis of the grid state without mutating it.
        """
        failures = list(state.get("failures", []))
        
        # Check for any offline substations or generators not already in failures list
        for s in state.get("substations", []):
            if not s.get("online", True) and s.get("id") not in failures:
                failures.append(s.get("id"))
                
        for g in state.get("generators", []):
            if not g.get("online", True) and g.get("id") not in failures:
                failures.append(g.get("id"))

        # Identify critical loads that are disconnected or under-supplied
        critical_affected = []
        for load in state.get("loads", []):
            if load.get("priority") == "critical":
                is_connected = load.get("connected", True)
                supplied = float(load.get("supplied_mw", 0.0))
                demand = float(load.get("demand_mw", 0.0))
                if not is_connected or supplied < demand:
                    critical_affected.append(load.get("id"))

        # Identify transmission lines exceeding capacity or offline
        overloaded_lines = []
        for line in state.get("transmission_lines", []):
            load_mw = float(line.get("load_mw", 0.0))
            capacity_mw = float(line.get("capacity_mw", 0.0))
            if load_mw > capacity_mw:
                overloaded_lines.append({
                    "line_id": line.get("id"),
                    "load_mw": load_mw,
                    "capacity_mw": capacity_mw,
                    "overload_mw": round(load_mw - capacity_mw, 2)
                })

        gen_mw = float(state.get("generation_mw", 0.0))
        demand_mw = float(state.get("demand_mw", 0.0))
        net_margin = round(gen_mw - demand_mw, 2)

        return ToolResult(
            success=True,
            data={
                "generation_mw": gen_mw,
                "demand_mw": demand_mw,
                "net_margin_mw": net_margin,
                "failed_components": failures,
                "critical_loads_affected": critical_affected,
                "overloaded_lines": overloaded_lines
            }
        )

