"""
Capability Registry (Owned by P1)
Manages tools, registration, availability toggles, and metadata export for LLM planning.
"""
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    action: str = Field(description="Name of the capability to invoke")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments supplied to the capability")
    reason: Optional[str] = Field(default=None, description="Model rationale for choosing this capability")


class ToolError(BaseModel):
    code: str = Field(description="Structured error code, e.g. TRANSMISSION_OVERLOAD")
    message: str = Field(description="Human-readable explanation of failure")
    details: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic data (e.g. line, load, capacity)")


class ToolResult(BaseModel):
    success: bool = Field(description="Whether the capability executed successfully")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Output data if success == True")
    error: Optional[ToolError] = Field(default=None, description="Error details if success == False")


@runtime_checkable
class Capability(Protocol):
    """Protocol that all P3 tools must implement."""
    name: str
    description: str

    def input_schema(self) -> Dict[str, Any]:
        """Returns JSON schema of expected arguments."""
        ...

    def execute(self, state: Dict[str, Any], arguments: Dict[str, Any]) -> ToolResult:
        """Executes capability logic and returns a structured ToolResult."""
        ...


class CapabilityRegistry:
    """
    Central tool registry for GridMind.
    Provides registration, dynamic enabling/disabling, and schema description for the planner.
    """

    def __init__(self):
        self._capabilities: Dict[str, Capability] = {}
        self._enabled_status: Dict[str, bool] = {}

    def register(self, capability: Capability, enabled: bool = True) -> None:
        """Registers a capability into the registry."""
        if not hasattr(capability, "name") or not capability.name:
            raise ValueError("Capability must have a non-empty 'name' attribute.")
        self._capabilities[capability.name] = capability
        self._enabled_status[capability.name] = enabled

    def unregister(self, name: str) -> None:
        """Removes a capability from the registry."""
        self._capabilities.pop(name, None)
        self._enabled_status.pop(name, None)

    def set_enabled(self, name: str, enabled: bool) -> None:
        """Enables or disables a registered capability."""
        if name not in self._capabilities:
            raise KeyError(f"Cannot toggle capability '{name}': not found in registry.")
        self._enabled_status[name] = enabled

    def is_enabled(self, name: str) -> bool:
        """Returns True if the capability exists and is currently enabled."""
        return self._enabled_status.get(name, False)

    def get(self, name: str) -> Optional[Capability]:
        """Retrieves a capability by name if registered and enabled."""
        if self.is_enabled(name):
            return self._capabilities.get(name)
        return None

    def get_any(self, name: str) -> Optional[Capability]:
        """Retrieves a capability by name regardless of enabled status."""
        return self._capabilities.get(name)

    def list(self, enabled_only: bool = True) -> List[str]:
        """Lists registered capability names."""
        if enabled_only:
            return [k for k, v in self._enabled_status.items() if v]
        return list(self._capabilities.keys())

    def describe_all(self, enabled_only: bool = True) -> List[Dict[str, Any]]:
        """
        Generates CapabilitySpec list for the Planner prompt.
        Format matches Contract 2 (CapabilitySpec).
        """
        specs = []
        for name, cap in self._capabilities.items():
            if enabled_only and not self._enabled_status.get(name, False):
                continue
            specs.append({
                "name": cap.name,
                "description": cap.description,
                "input_schema": cap.input_schema()
            })
        return specs
