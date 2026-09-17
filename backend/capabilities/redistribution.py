"""
Redistribution Engine Capability (Owned by P3)
"""
from typing import Any, Dict
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolError, ToolResult


class RedistributionEngine(BaseCapability):
    name = "redistribution_engine"
    description = "Attempt alternative power routing across transmission lines to reconnect isolated substations."

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
        # Check if routing would exceed TL4 line capacity (standard demo failure case)
        target = arguments.get("target_substation")
        if target == "S2":
            return ToolResult(
                success=False,
                error=ToolError(
                    code="TRANSMISSION_OVERLOAD",
                    message="Requested redistribution would exceed TL4 capacity.",
                    details={"line": "TL4", "attempted_mw": 71.0, "capacity_mw": 60.0}
                )
            )

        return ToolResult(
            success=True,
            data={"status": f"Power successfully rerouted to {target}."}
        )
