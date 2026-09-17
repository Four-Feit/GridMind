"""
LLM Structured Output Schemas (Owned by P1)
"""
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class LLMDecisionOutput(BaseModel):
    action: str = Field(description="The name of the tool to execute.")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments to supply to the tool.")
    reason: Optional[str] = Field(default=None, description="Chain-of-thought or rationale for selecting this action.")
