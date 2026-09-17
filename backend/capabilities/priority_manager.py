"""
Priority Load Manager Capability (Owned by P3)
"""
from typing import Any, Dict, List, Optional
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
                },
                "shed_targets": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional specific non-critical load IDs to shed (defaults to non-critical loads like FACTORY)."
                }
            },
            "required": ["protect_critical"]
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """
        Executes priority load management:
        - Restores power to critical facilities (Hospital, Water Plant, Emergency Services).
        - Sheds non-critical loads (Factory, etc.) to keep grid within generation limits.
        """
        protect_critical = arguments.get("protect_critical", True)
        specific_shed_targets = arguments.get("shed_targets")

        served: List[str] = []
        shed: List[str] = []
        total_shed_mw = 0.0
        total_critical_supplied_mw = 0.0

        if protect_critical:
            # 1. Update GridSimulator if attached (P2 physics)
            if self.simulator is not None and hasattr(self.simulator, "loads"):
                for load in self.simulator.loads:
                    is_critical = getattr(load, "priority", "") == "critical"
                    load_id = getattr(load, "id", "")

                    if is_critical:
                        load.connected = True
                        load.supplied_mw = load.demand_mw
                    else:
                        # Non-critical load: shed if in specific targets or default to FACTORY
                        should_shed = (
                            (specific_shed_targets is not None and load_id in specific_shed_targets)
                            or (specific_shed_targets is None and load_id == "FACTORY")
                        )
                        if should_shed:
                            load.connected = False
                            load.supplied_mw = 0.0

            # 2. Update state dictionary (P1 observation view)
            for load in state.get("loads", []):
                is_critical = load.get("priority") == "critical"
                load_id = load.get("id")
                demand = float(load.get("demand_mw", 0.0))

                if is_critical:
                    load["connected"] = True
                    load["supplied_mw"] = demand
                    served.append(load_id)
                    total_critical_supplied_mw += demand
                else:
                    should_shed = (
                        (specific_shed_targets is not None and load_id in specific_shed_targets)
                        or (specific_shed_targets is None and load_id == "FACTORY")
                    )
                    if should_shed:
                        load["connected"] = False
                        load["supplied_mw"] = 0.0
                        shed.append(load_id)
                        total_shed_mw += demand
                    elif load.get("connected", True):
                        served.append(load_id)

            return ToolResult(
                success=True,
                data={
                    "served": served,
                    "shed": shed,
                    "shed_mw": total_shed_mw,
                    "critical_supplied_mw": total_critical_supplied_mw,
                    "status": "Critical loads protected successfully."
                }
            )

        return ToolResult(
            success=True,
            data={
                "served": [l.get("id") for l in state.get("loads", []) if l.get("connected", True)],
                "shed": [],
                "status": "No shedding performed (protect_critical was False)."
            }
        )

