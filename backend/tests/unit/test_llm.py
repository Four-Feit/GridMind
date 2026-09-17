"""
Unit Tests for LLM Adapter, Prompts, and Parsers (Step 3 of P1 Brain)
"""
import pytest
from backend.llm.client import FakeLLM, LiveLLMClient
from backend.llm.prompts import format_planner_prompt
from backend.llm.schemas import clean_json_response, parse_llm_decision


def test_clean_json_response():
    raw_clean = '{"action": "grid_analyzer", "arguments": {}}'
    assert clean_json_response(raw_clean) == raw_clean

    raw_markdown = '```json\n{"action": "battery_engine", "arguments": {"power_mw": 20}}\n```'
    assert clean_json_response(raw_markdown) == '{"action": "battery_engine", "arguments": {"power_mw": 20}}'

    raw_simple_fence = '```\n{"action": "test"}\n```'
    assert clean_json_response(raw_simple_fence) == '{"action": "test"}'


def test_parse_llm_decision_valid():
    raw = '```json\n{"action": "battery_engine", "arguments": {"power_mw": 15.0}, "reason": "Compensate solar deficit"}\n```'
    decision = parse_llm_decision(raw)
    assert decision.action == "battery_engine"
    assert decision.arguments == {"power_mw": 15.0}
    assert decision.reason == "Compensate solar deficit"


def test_parse_llm_decision_invalid_json():
    with pytest.raises(ValueError, match="Failed to parse LLM response as JSON"):
        parse_llm_decision("This is not json at all.")


def test_parse_llm_decision_missing_action():
    with pytest.raises(ValueError, match="LLM decision violates schema"):
        parse_llm_decision('{"arguments": {}}')


def test_fake_llm_scripted_replay():
    scripted = [
        {"action": "redistribution_engine", "arguments": {"target_substation": "S2"}},
        {"action": "priority_load_manager", "arguments": {"protect_critical": True}}
    ]
    llm = FakeLLM(scripted_responses=scripted)

    res1 = llm.generate_decision({})
    assert res1["action"] == "redistribution_engine"

    res2 = llm.generate_decision({})
    assert res2["action"] == "priority_load_manager"


def test_fake_llm_dynamic_state_response():
    llm = FakeLLM()

    # Context 1: Hospital disconnected -> recommends redistribution
    ctx_disconnected = {
        "grid_state": {
            "generation_mw": 180,
            "demand_mw": 150,
            "loads": [
                {"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 0, "connected": False}
            ]
        },
        "previous_failures": [],
        "known_constraints": []
    }
    decision1 = llm.generate_decision(ctx_disconnected)
    assert decision1["action"] == "redistribution_engine"

    # Context 2: Hospital disconnected BUT redistribution previously failed -> recommends priority manager
    ctx_redist_failed = dict(ctx_disconnected)
    ctx_redist_failed["previous_failures"] = ["redistribution_engine: TL4 overload"]
    decision2 = llm.generate_decision(ctx_redist_failed)
    assert decision2["action"] == "priority_load_manager"

    # Context 3: Generation deficit -> recommends battery engine
    ctx_deficit = {
        "grid_state": {
            "generation_mw": 120,
            "demand_mw": 150,
            "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 30, "connected": True}]
        },
        "previous_failures": [],
        "known_constraints": []
    }
    decision3 = llm.generate_decision(ctx_deficit)
    assert decision3["action"] == "battery_engine"
    assert decision3["arguments"]["power_mw"] == 30.0


def test_live_llm_fallback_without_key():
    # If no key, LiveLLMClient must safely fall back to FakeLLM without raising errors
    client = LiveLLMClient(api_key="")
    ctx = {
        "grid_state": {"generation_mw": 180, "demand_mw": 150, "loads": []},
        "previous_failures": [],
        "known_constraints": []
    }
    decision = client.generate_decision(ctx)
    assert "action" in decision


def test_format_planner_prompt():
    ctx = {
        "goal": "Protect hospital",
        "grid_state": {
            "generation_mw": 180,
            "demand_mw": 150,
            "loads": [{"id": "HOSPITAL", "priority": "critical", "demand_mw": 30, "supplied_mw": 30, "connected": True}]
        },
        "available_capabilities": [{"name": "battery_engine"}],
        "previous_failures": [],
        "known_constraints": []
    }
    prompt = format_planner_prompt(ctx)
    assert "MISSION GOAL: Protect hospital" in prompt
    assert "Total Generation: 180.0 MW" in prompt
    assert "battery_engine" in prompt
