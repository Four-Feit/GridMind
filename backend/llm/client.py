"""
LLM Client Interface and Implementations (Owned by P1)
Provides FakeLLM (for testing & offline demo) and LiveLLMClient (for real model calls).
"""
import os
import json
import logging
from typing import Any, Dict, List, Optional, Protocol
from backend.llm.prompts import SYSTEM_PROMPT, format_planner_prompt
from backend.llm.schemas import parse_llm_decision

logger = logging.getLogger(__name__)


class LLMClient(Protocol):
    """Protocol for all LLM providers."""

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Takes planner context (goal, state, capabilities, memory)
        and returns a validated dict with keys: 'action', 'arguments', 'reason'.
        """
        ...


class FakeLLM:
    """
    Deterministic fake LLM for unit tests, offline development, and fallback.
    Can replay scripted responses or use dynamic heuristic fallback.
    """

    def __init__(self, scripted_responses: Optional[List[Dict[str, Any]]] = None):
        self.scripted_responses: List[Dict[str, Any]] = list(scripted_responses) if scripted_responses else []
        self._call_count = 0
        self.call_history: List[Dict[str, Any]] = []

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        self.call_history.append(context)

        # 1. Replay scripted responses if available
        if self._call_count < len(self.scripted_responses):
            decision = self.scripted_responses[self._call_count]
            self._call_count += 1
            return decision

        # 2. Dynamic state-aware fallback
        grid = context.get("grid_state", {})
        failures = context.get("previous_failures", [])
        constraints = context.get("known_constraints", [])
        gen = grid.get("generation_mw", 0.0)
        dem = grid.get("demand_mw", 0.0)

        # Check if critical load (e.g. HOSPITAL) is unserved
        critical_unserved = False
        for l in grid.get("loads", []):
            if l.get("priority") == "critical":
                if not l.get("connected", True) or l.get("supplied_mw", 0) < l.get("demand_mw", 0):
                    critical_unserved = True
                    break

        # Check if redistribution previously failed
        redistribution_failed = any(
            "redistribution" in str(f).lower() or "tl4" in str(f).lower() or "tl4" in str(c).lower()
            for f in failures for c in constraints
        ) or any("redistribution" in str(f).lower() for f in failures)

        # Strategic decision tree:
        if critical_unserved:
            if not redistribution_failed:
                return {
                    "action": "redistribution_engine",
                    "arguments": {"target_substation": "S2"},
                    "reason": "Hospital is disconnected; attempting alternative power routing via redistribution."
                }
            else:
                return {
                    "action": "priority_load_manager",
                    "arguments": {"protect_critical": True},
                    "reason": "Redistribution previously failed; shedding non-critical load to restore hospital."
                }

        # Check for generation deficit
        if gen < dem:
            deficit = dem - gen
            return {
                "action": "battery_engine",
                "arguments": {"power_mw": min(deficit, 40.0), "duration_minutes": 15.0},
                "reason": f"Generation deficit of {deficit:.1f}MW detected; discharging battery storage."
            }

        # Default monitoring
        return {
            "action": "grid_analyzer",
            "arguments": {},
            "reason": "Grid appears stable; performing routine diagnostic scan."
        }


class LiveLLMClient:
    """
    Production client connecting to OpenAI or Gemini API via standard chat completions.
    Automatically falls back to FakeLLM if API key is not configured or network fails.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.base_url = base_url or os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
        self._fallback = FakeLLM()

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            logger.info("No LLM_API_KEY provided; using deterministic FakeLLM.")
            return self._fallback.generate_decision(context)

        prompt = format_planner_prompt(context)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "response_format": {"type": "json_object"}
        }

        try:
            import httpx
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    f"{self.base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                raw_text = data["choices"][0]["message"]["content"]
                decision = parse_llm_decision(raw_text)
                return decision.model_dump()
        except Exception as e:
            logger.warning(f"Live LLM API call failed ({e}); falling back to FakeLLM.")
            return self._fallback.generate_decision(context)
