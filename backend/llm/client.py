"""
LLM Client Interface and Implementations (Owned by P1)
"""
import os
import json
from typing import Any, Dict, List, Optional, Protocol
from backend.llm.prompts import SYSTEM_PROMPT, format_planner_prompt


class LLMClient(Protocol):
    """Protocol for all LLM providers."""

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        ...


class FakeLLM:
    """
    Deterministic fake LLM for independent testing and development.
    Can be loaded with a scripted sequence of responses or default behavior.
    """

    def __init__(self, scripted_responses: Optional[List[Dict[str, Any]]] = None):
        self.scripted_responses: List[Dict[str, Any]] = scripted_responses or []
        self._call_count = 0

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if self._call_count < len(self.scripted_responses):
            resp = self.scripted_responses[self._call_count]
            self._call_count += 1
            return resp

        # Default fallback behavior based on context
        failures = context.get("previous_failures", [])
        if any("redistribution" in str(f).lower() for f in failures):
            return {
                "action": "priority_load_manager",
                "arguments": {"protect_critical": True},
                "reason": "Redistribution previously failed; shedding non-critical load."
            }

        return {
            "action": "redistribution_engine",
            "arguments": {"target_substation": "S2"},
            "reason": "Attempting power rerouting to restore disconnected load."
        }


class OpenAILikeClient:
    """Production LLM adapter using OpenAI / compatible API (e.g. Gemini OpenAI compatibility)."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Placeholder for API invocation
        prompt = format_planner_prompt(context)
        # When integrating live API, call client.chat.completions.create here
        return FakeLLM().generate_decision(context)
