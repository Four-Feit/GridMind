"""
Base Capability Interface (Owned by P3 / P1 Contract)
"""
from abc import ABC, abstractmethod
from typing import Any, Dict
from backend.core.registry import ToolResult


class BaseCapability(ABC):
    """
    Abstract base class for all capabilities (tools) owned by Person 3.

    Every capability must implement:
    1. `input_schema()`: Valid JSON Schema specifying allowed arguments.
    2. `execute(state, arguments)`: Deterministic execution returning a ToolResult.
    """

    name: str
    description: str

    @abstractmethod
    def input_schema(self) -> Dict[str, Any]:
        """
        Returns the JSON Schema of accepted input arguments.
        Used by the ActionValidator and passed to the LLM context.
        """
        pass

    @abstractmethod
    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """
        Executes capability logic against the current grid state and arguments.
        Must return a structured ToolResult (success/data or failure/error).
        """
        pass

    def to_spec(self) -> Dict[str, Any]:
        """
        Formats the capability as a CapabilitySpec matching Contract 2.
        """
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema()
        }

