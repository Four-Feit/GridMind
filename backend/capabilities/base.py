"""
Base Capability Interface (Owned by P3 / P1 Contract)
"""
from abc import ABC, abstractmethod
from typing import Any, Dict
from backend.core.registry import ToolResult


class BaseCapability(ABC):
    """Abstract base class for all capabilities."""

    name: str
    description: str

    @abstractmethod
    def input_schema(self) -> Dict[str, Any]:
        """Returns the JSON Schema of accepted input arguments."""
        pass

    @abstractmethod
    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """Executes capability logic and returns structured ToolResult."""
        pass
