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
        raw_key = (
            api_key
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("LLM_API_KEY")
            or os.getenv("OPENAI_API_KEY", "")
        )
        self.api_key = raw_key.strip().strip('"').strip("'") if raw_key else ""

        # Check if provider is Gemini
        self.is_gemini = bool(
            os.getenv("GEMINI_API_KEY")
            or self.api_key.startswith("AQ.")
            or self.api_key.startswith("AIzaSy")
            or "gemini" in (model or os.getenv("LLM_MODEL", "")).lower()
        )

        # Default model selection
        raw_model = model or os.getenv("LLM_MODEL", "")
        if not raw_model:
            raw_model = "gemini-flash-latest" if self.is_gemini else "gpt-4o-mini"
        self.model = raw_model

        # Provider auto-detection for base_url
        explicit_base = base_url or os.getenv("LLM_BASE_URL", "")
        if explicit_base:
            self.base_url = explicit_base
        elif self.is_gemini:
            self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        elif "groq" in self.model.lower() or os.getenv("GROQ_API_KEY"):
            self.base_url = "https://api.groq.com/openai/v1"
        else:
            self.base_url = "https://api.openai.com/v1"

        self._fallback = FakeLLM()

    def generate_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            logger.info("No LLM_API_KEY/GEMINI_API_KEY provided; using dynamic FakeLLM.")
            return self._fallback.generate_decision(context)

        prompt = format_planner_prompt(context)

        # 1. Native Google Gemini Execution
        if self.is_gemini:
            import httpx
            # Candidate models to try in case specific tier hits 404/429/503
            candidate_models = [self.model, "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-latest"]
            # Deduplicate while preserving order
            candidate_models = list(dict.fromkeys(candidate_models))
            payload = {
                "contents": [{"parts": [{"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}]}],
                "generationConfig": {"responseMimeType": "application/json", "temperature": 0.1}
            }

            for model_name in candidate_models:
                url = f"{self.base_url.rstrip('/')}/models/{model_name}:generateContent?key={self.api_key}"
                try:
                    with httpx.Client(timeout=15.0) as client:
                        res = client.post(url, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                            decision = parse_llm_decision(raw_text)
                            logger.info(f"Generated live decision via Gemini ({model_name}): {decision.action}")
                            return decision.model_dump()
                        else:
                            logger.warning(f"Gemini {model_name} returned {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    logger.warning(f"Gemini {model_name} request failed ({e})")

            logger.warning("All Gemini model attempts failed; falling back to dynamic reasoning.")
            return self._fallback.generate_decision(context)

        # 2. Standard OpenAI / Groq Chat Completions Execution
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
            with httpx.Client(timeout=20.0) as client:
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
            logger.warning(f"Live LLM API call to {self.base_url} ({self.model}) failed ({e}); falling back to dynamic reasoning.")
            return self._fallback.generate_decision(context)


# Backward-compatibility alias for P4
OpenAILikeClient = LiveLLMClient

