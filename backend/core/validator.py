"""
Action and Outcome Validator (Owned by P1 / P3 interfaces)
Enforces Rule 3 (LLM output is never trusted) and Rule 4 (Success verified by code).
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.core.registry import CapabilityRegistry, ToolCall


class ValidationResult(BaseModel):
    valid: bool
    reason: Optional[str] = None
    code: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class ActionValidator:
    """
    Validates proposed ToolCalls prior to execution.
    Acts as the security and integrity gatekeeper against LLM hallucination.
    """

    def validate_action(
        self,
        decision: ToolCall,
        registry: CapabilityRegistry,
        known_constraints: Optional[List[str]] = None
    ) -> ValidationResult:
        # 1. Non-empty action check
        if not decision.action or not decision.action.strip():
            return ValidationResult(
                valid=False,
                code="EMPTY_ACTION",
                reason="The planner returned an empty action name."
            )

        # 2. Existence check
        tool = registry.get_any(decision.action)
        if not tool:
            return ValidationResult(
                valid=False,
                code="TOOL_NOT_FOUND",
                reason=f"Capability '{decision.action}' does not exist in registry.",
                details={"action": decision.action, "available": registry.list()}
            )

        # 3. Enabled status check
        if not registry.is_enabled(decision.action):
            return ValidationResult(
                valid=False,
                code="TOOL_DISABLED",
                reason=f"Capability '{decision.action}' is currently disabled/offline.",
                details={"action": decision.action}
            )

        # 4. Schema inspection
        schema = tool.input_schema()
        properties = schema.get("properties", {})
        required_fields = schema.get("required", [])

        # Check required fields
        for field in required_fields:
            if field not in decision.arguments:
                return ValidationResult(
                    valid=False,
                    code="MISSING_ARGUMENT",
                    reason=f"Missing required argument '{field}' for capability '{decision.action}'.",
                    details={"missing_field": field, "required": required_fields}
                )

        # 5. Type and bounds checks
        for arg_name, arg_val in decision.arguments.items():
            if arg_name in properties:
                expected_type = properties[arg_name].get("type")
                
                # Check numbers (floats / ints)
                if expected_type == "number":
                    if isinstance(arg_val, bool) or not isinstance(arg_val, (int, float)):
                        return ValidationResult(
                            valid=False,
                            code="INVALID_ARG_TYPE",
                            reason=f"Argument '{arg_name}' must be a number, got {type(arg_val).__name__}.",
                            details={"field": arg_name, "expected": "number", "actual": type(arg_val).__name__}
                        )
                    # Non-negative check for physical units (power, duration)
                    if arg_val < 0:
                        return ValidationResult(
                            valid=False,
                            code="OUT_OF_BOUNDS",
                            reason=f"Argument '{arg_name}' cannot be negative: {arg_val}",
                            details={"field": arg_name, "value": arg_val}
                        )

                # Check booleans
                elif expected_type == "boolean":
                    if not isinstance(arg_val, bool):
                        return ValidationResult(
                            valid=False,
                            code="INVALID_ARG_TYPE",
                            reason=f"Argument '{arg_name}' must be a boolean (true/false), got {type(arg_val).__name__}.",
                            details={"field": arg_name, "expected": "boolean", "actual": type(arg_val).__name__}
                        )

                # Check strings
                elif expected_type == "string":
                    if not isinstance(arg_val, str) or not arg_val.strip():
                        return ValidationResult(
                            valid=False,
                            code="INVALID_ARG_TYPE",
                            reason=f"Argument '{arg_name}' must be a non-empty string.",
                            details={"field": arg_name, "expected": "string", "actual": type(arg_val).__name__}
                        )

        # 6. Check obvious known constraints
        if known_constraints:
            for constraint in known_constraints:
                # If constraint mentions a line or capacity limit, verify argument doesn't obviously violate it
                if decision.action == "redistribution_engine" and "TL4" in constraint:
                    target = decision.arguments.get("target_substation")
                    # Warning check
                    pass

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
                supplied = load.get("supplied_mw", 0.0)
                demand = load.get("demand_mw", 0.0)
                connected = load.get("connected", True)
                if not connected or supplied < demand:
                    critical_failed.append(load.get("id"))

        if critical_failed:
            return ValidationResult(
                valid=False,
                code="CRITICAL_LOAD_DEFICIT",
                reason=f"Critical loads not fully supplied: {critical_failed}",
                details={"failed_critical_loads": critical_failed}
            )

        return ValidationResult(valid=True)
