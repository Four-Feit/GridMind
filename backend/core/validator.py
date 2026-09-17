"""
Action and Outcome Validator (Owned by P1 / P3 interfaces)
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel
from backend.core.registry import CapabilityRegistry, ToolCall


class ValidationResult(BaseModel):
    valid: bool
    reason: Optional[str] = None
    details: Dict[str, Any] = {}


class ActionValidator:
    """Validates ToolCall before execution."""

    def validate_action(self, decision: ToolCall, registry: CapabilityRegistry) -> ValidationResult:
        # Check tool exists
        tool = registry.get(decision.action)
        if not tool:
            return ValidationResult(
                valid=False,
                reason=f"Capability '{decision.action}' is not registered."
            )

        # Basic argument validation (can be extended with jsonschema)
        schema = tool.input_schema()
        required_fields = schema.get("required", [])
        for field in required_fields:
            if field not in decision.arguments:
                return ValidationResult(
                    valid=False,
                    reason=f"Missing required argument '{field}' for capability '{decision.action}'."
                )

        return ValidationResult(valid=True)

    def validate_outcome(self, grid_state: Dict[str, Any]) -> ValidationResult:
        """
        Validates whether the environment state satisfies safety/mission requirements.
        Rule 4: Success verified by code, not LLM self-reporting.
        """
        loads = grid_state.get("loads", [])
        critical_failed = []
        for load in loads:
            if load.get("priority") == "critical":
                if load.get("supplied_mw", 0) < load.get("demand_mw", 0) or not load.get("connected", True):
                    critical_failed.append(load.get("id"))

        if critical_failed:
            return ValidationResult(
                valid=False,
                reason=f"Critical loads not fully supplied: {critical_failed}",
                details={"failed_critical_loads": critical_failed}
            )

        return ValidationResult(valid=True)
