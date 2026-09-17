"""
Capability Outcome Validator (Owned by P3)
"""
from typing import Any, Dict, List
from backend.core.validator import ValidationResult


class GridOutcomeValidator:
    """Verifies physical and logical constraints of the environment."""

    def validate(self, grid_state: Dict[str, Any]) -> ValidationResult:
        # Check critical loads
        failed_facilities: List[str] = []
        for load in grid_state.get("loads", []):
            if load.get("priority") == "critical":
                supplied = load.get("supplied_mw", 0.0)
                demand = load.get("demand_mw", 0.0)
                connected = load.get("connected", True)
                if not connected or supplied < demand:
                    failed_facilities.append(load.get("id"))

        if failed_facilities:
            return ValidationResult(
                valid=False,
                reason=f"Critical facility power deficit: {', '.join(failed_facilities)}"
            )

        return ValidationResult(valid=True)
