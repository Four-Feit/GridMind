"""
Capability Registry (Owned by P1)
"""
from typing import Any, Dict, List, Optional, Protocol
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    action: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    reason: Optional[str] = None


class ToolError(BaseModel):
    code: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[ToolError] = None


class Capability(Protocol):
    name: str
    description: str

    def input_schema(self) -> Dict[str, Any]:
        ...

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        ...


class CapabilityRegistry:
    """Manages registration, lookup, and description of capabilities."""

    def __init__(self):
        self._capabilities: Dict[str, Capability] = {}

    def register(self, capability: Capability) -> None:
        self._capabilities[capability.name] = capability

    def get(self, name: str) -> Optional[Capability]:
        return self._capabilities.get(name)

    def list(self) -> List[str]:
        return list(self._capabilities.keys())

    def describe_all(self) -> List[Dict[str, Any]]:
        specs = []
        for cap in self._capabilities.values():
            specs.append({
                "name": cap.name,
                "description": cap.description,
                "input_schema": cap.input_schema()
            })
        return specs
