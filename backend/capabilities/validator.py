"""
Capability Outcome Validator (Owned by P3)
Rule 4: Success verified by code, not LLM self-reporting.
"""
from typing import Any, Dict, List
from backend.core.validator import ValidationResult


class GridOutcomeValidator:
    """
    Deterministically verifies physical and logical constraints of the environment.
    Guarantees mission completion cannot be faked by the LLM.
    """

    def validate(self, grid_state: Dict[str, Any]) -> ValidationResult:
        """
        Validates the ground-truth environment against 3 safety dimensions:
        1. All critical facilities are connected and 100% supplied.
        2. No active transmission line exceeds its thermal capacity.
        3. Battery storage remains within non-negative physical limits.
        """
        failed_critical_loads: List[str] = []
        critical_verified_count = 0

        # 1. Critical Load Verification
        for load in grid_state.get("loads", []):
            if load.get("priority") == "critical":
                critical_verified_count += 1
                supplied = float(load.get("supplied_mw", 0.0))
                demand = float(load.get("demand_mw", 0.0))
                connected = load.get("connected", True)
                if not connected or supplied < demand:
                    failed_critical_loads.append(load.get("id"))

        # 2. Transmission Line Capacity Verification
        overloaded_lines: List[Dict[str, Any]] = []
        active_lines_count = 0
        for line in grid_state.get("transmission_lines", []):
            if line.get("online", True):
                active_lines_count += 1
                load_mw = float(line.get("load_mw", 0.0))
                capacity_mw = float(line.get("capacity_mw", 0.0))
                if load_mw > capacity_mw:
                    overloaded_lines.append({
                        "line": line.get("id"),
                        "load_mw": load_mw,
                        "capacity_mw": capacity_mw,
                        "overload_mw": round(load_mw - capacity_mw, 2)
                    })

        # 3. Battery Storage Physical Limit Verification
        battery = grid_state.get("battery", {})
        remaining_mwh = float(battery.get("remaining_mwh", 0.0))
        battery_exhausted = remaining_mwh < 0.0

        # Compile validation errors if any
        reasons: List[str] = []
        if failed_critical_loads:
            reasons.append(f"Critical loads not fully supplied: {failed_critical_loads}")
        if overloaded_lines:
            overloaded_ids = [ol["line"] for ol in overloaded_lines]
            reasons.append(f"Transmission lines overloaded: {overloaded_ids}")
        if battery_exhausted:
            reasons.append(f"Battery storage is negative: {remaining_mwh}MWh")

        if reasons:
            return ValidationResult(
                valid=False,
                reason="; ".join(reasons),
                details={
                    "failed_critical_loads": failed_critical_loads,
                    "overloaded_lines": overloaded_lines,
                    "battery_exhausted": battery_exhausted
                }
            )

        return ValidationResult(
            valid=True,
            reason="All critical facilities supplied and grid constraints respected.",
            details={
                "critical_facilities_verified": critical_verified_count,
                "transmission_lines_verified": active_lines_count,
                "battery_mwh_remaining": remaining_mwh
            }
        )

