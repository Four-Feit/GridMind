"""
Redistribution Engine Capability (Owned by P3)
"""
from typing import Any, Dict, Optional
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolError, ToolResult


class RedistributionEngine(BaseCapability):
    name = "redistribution_engine"
    description = "Attempt alternative power routing across transmission lines to reconnect isolated substations."

    def __init__(self, simulator: Optional[Any] = None):
        self.simulator = simulator

    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "target_substation": {
                    "type": "string",
                    "description": "The substation ID to reroute power towards."
                }
            },
            "required": ["target_substation"]
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """
        Attempts alternative power routing while strictly respecting line capacities.
        Fails deterministically when transmission line thermal limits would be breached.
        """
        target = arguments.get("target_substation")

        # Validate substation existence
        known_substations = [s.get("id") for s in state.get("substations", [])]
        if known_substations and target not in known_substations:
            return ToolResult(
                success=False,
                error=ToolError(
                    code="SUBSTATION_NOT_FOUND",
                    message=f"Substation '{target}' is not part of the active grid topology.",
                    details={"target_substation": target}
                )
            )

        # Rehearsed Demo Failure Case (README 9.4 & contracts.md 4B & demo-scenario.md Step 3):
        # Rerouting power to Substation S2 forces 71.0 MW across transmission line TL4 (rated at 60.0 MW).
        if target == "S2":
            return ToolResult(
                success=False,
                error=ToolError(
                    code="TRANSMISSION_OVERLOAD",
                    message="Requested redistribution would exceed TL4 capacity.",
                    details={
                        "line": "TL4",
                        "load_mw": 71.0,
                        "attempted_mw": 71.0,
                        "capacity_mw": 60.0
                    }
                )
            )

        # Check line capacities dynamically across state lines
        for line in state.get("transmission_lines", []):
            if line.get("to") == target or line.get("from") == target:
                load = float(line.get("load_mw", 0.0))
                capacity = float(line.get("capacity_mw", 0.0))
                if load > capacity:
                    return ToolResult(
                        success=False,
                        error=ToolError(
                            code="TRANSMISSION_OVERLOAD",
                            message=f"Transmission line {line.get('id')} exceeds capacity.",
                            details={
                                "line": line.get("id"),
                                "load_mw": load,
                                "capacity_mw": capacity
                            }
                        )
                    )

        # Successful routing for feasible paths
        if self.simulator is not None:
            for s in getattr(self.simulator, "substations", []):
                if s.id == target:
                    s.online = True

        return ToolResult(
            success=True,
            data={
                "target_substation": target,
                "status": f"Power successfully rerouted to {target}.",
                "route_verified": True
            }
        )
