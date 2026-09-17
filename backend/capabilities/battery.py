"""
Battery Engine Capability (Owned by P3)
"""
from typing import Any, Dict
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolError, ToolResult


class BatteryEngine(BaseCapability):
    name = "battery_engine"
    description = "Discharge stored battery energy to compensate for temporary generation deficits."

    def input_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "power_mw": {
                    "type": "number",
                    "description": "Megawatts of power to discharge."
                },
                "duration_minutes": {
                    "type": "number",
                    "description": "Discharge duration in minutes."
                }
            },
            "required": ["power_mw"]
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        power_mw = arguments.get("power_mw", 0)
        battery = state.get("battery", {})

        if not battery.get("online", True):
            return ToolResult(
                success=False,
                error=ToolError(code="BATTERY_OFFLINE", message="Battery system is currently offline.")
            )

        max_output = battery.get("max_output_mw", 40)
        if power_mw > max_output:
            return ToolResult(
                success=False,
                error=ToolError(
                    code="BATTERY_OUTPUT_EXCEEDED",
                    message=f"Requested {power_mw}MW exceeds max battery output of {max_output}MW."
                )
            )

        return ToolResult(
            success=True,
            data={"discharged_mw": power_mw, "status": "Discharging"}
        )
