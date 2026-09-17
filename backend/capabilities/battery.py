"""
Battery Engine Capability (Owned by P3)
"""
from typing import Any, Dict, Optional
from backend.capabilities.base import BaseCapability
from backend.core.registry import ToolError, ToolResult


class BatteryEngine(BaseCapability):
    name = "battery_engine"
    description = "Discharge stored battery energy to compensate for temporary generation deficits."

    def __init__(self, simulator: Optional[Any] = None):
        self.simulator = simulator

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
                    "description": "Discharge duration in minutes (defaults to 15.0 minutes if omitted)."
                }
            },
            "required": ["power_mw"]
        }

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """
        Discharges energy from the battery within physical limits.
        Fails if battery is offline, output rating is exceeded, or energy is exhausted.
        """
        power_mw = float(arguments.get("power_mw", 0.0))
        duration_minutes = float(arguments.get("duration_minutes", 15.0))

        if power_mw <= 0.0:
            return ToolResult(
                success=False,
                error=ToolError(
                    code="INVALID_DISCHARGE_POWER",
                    message=f"Discharge power must be positive, got {power_mw}MW."
                )
            )

        battery = state.get("battery", {})

        # 1. Online Check
        if not battery.get("online", True):
            return ToolResult(
                success=False,
                error=ToolError(
                    code="BATTERY_OFFLINE",
                    message="Battery energy storage system is currently offline."
                )
            )

        # 2. Maximum Inverter Power Check (40.0 MW limit)
        max_output = float(battery.get("max_output_mw", 40.0))
        if power_mw > max_output:
            return ToolResult(
                success=False,
                error=ToolError(
                    code="BATTERY_OUTPUT_EXCEEDED",
                    message=f"Requested {power_mw}MW exceeds max battery output of {max_output}MW.",
                    details={"requested_mw": power_mw, "max_output_mw": max_output}
                )
            )

        # 3. Remaining Storage Capacity Check (MWh)
        remaining_mwh = float(battery.get("remaining_mwh", 0.0))
        hours = duration_minutes / 60.0
        energy_needed_mwh = round(power_mw * hours, 2)

        if energy_needed_mwh > remaining_mwh:
            return ToolResult(
                success=False,
                error=ToolError(
                    code="INSUFFICIENT_STORAGE",
                    message=f"Requested discharge ({energy_needed_mwh}MWh) exceeds available battery storage ({remaining_mwh}MWh).",
                    details={
                        "requested_mwh": energy_needed_mwh,
                        "remaining_mwh": remaining_mwh,
                        "power_mw": power_mw,
                        "duration_minutes": duration_minutes
                    }
                )
            )

        # 4. Discharge and Synchronize State
        new_remaining = round(remaining_mwh - energy_needed_mwh, 2)
        battery["remaining_mwh"] = new_remaining

        if self.simulator is not None and hasattr(self.simulator, "battery"):
            self.simulator.battery.remaining_mwh = new_remaining

        return ToolResult(
            success=True,
            data={
                "discharged_mw": power_mw,
                "duration_minutes": duration_minutes,
                "energy_discharged_mwh": energy_needed_mwh,
                "remaining_mwh": new_remaining,
                "status": "Discharging"
            }
        )

