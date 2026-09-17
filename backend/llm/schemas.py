"""
LLM Structured Output Schemas & Response Parsers (Owned by P1)
"""
import json
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ValidationError


class LLMDecisionOutput(BaseModel):
    """The canonical structured decision returned by the LLM."""
    action: str = Field(description="The exact name of the registered tool to execute.")
    arguments: Dict[str, Any] = Field(default_factory=dict, description="Arguments conforming to the tool's JSON schema.")
    reason: Optional[str] = Field(default=None, description="Step-by-step reasoning or rationale.")


def clean_json_response(raw_response: str) -> str:
    """
    Strips markdown code blocks, backticks, and whitespace from model responses.
    Handles ```json ... ``` and ``` ... ``` wrappers.
    """
    text = raw_response.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text


def parse_llm_decision(raw_text: str) -> LLMDecisionOutput:
    """
    Safely parses raw LLM text into a validated LLMDecisionOutput object.
    Raises ValueError if JSON is malformed or missing required keys.
    """
    cleaned = clean_json_response(raw_text)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse LLM response as JSON: {e}\nRaw output: {raw_text[:200]}")

    if not isinstance(data, dict):
        raise ValueError(f"LLM response must be a JSON object, got {type(data).__name__}")

    try:
        return LLMDecisionOutput(**data)
    except ValidationError as e:
        raise ValueError(f"LLM decision violates schema: {e}")
