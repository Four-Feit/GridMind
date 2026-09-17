"""
Integration Tests for GridMind:
Connects P1 (Agent Core) + P2 (Simulator) + P3 (Capabilities)
"""
from backend.capabilities.battery import BatteryEngine
from backend.capabilities.priority_manager import PriorityLoadManager
from backend.capabilities.redistribution import RedistributionEngine
from backend.core.agent import AgentController
from backend.core.events import EventBus
from backend.core.planner import Planner
from backend.core.registry import CapabilityRegistry
from backend.grid.simulator import GridSimulator
from backend.llm.client import FakeLLM


def test_end_to_end_agent_simulator_capabilities():
    sim = GridSimulator()
    # Inject failure into simulator: Substation S2 offline
    sim.inject_failure("substation", "S2")

    registry = CapabilityRegistry()
    registry.register(RedistributionEngine())
    registry.register(PriorityLoadManager(simulator=sim))
    registry.register(BatteryEngine())

    # Scripted LLM decisions:
    # 1. Tries redistribution to S2 (fails due to TL4 capacity overload)
    # 2. Replans to priority_load_manager (succeeds by protecting hospital)
    decisions = [
        {"action": "redistribution_engine", "arguments": {"target_substation": "S2"}, "reason": "Attempt reroute"},
        {"action": "priority_load_manager", "arguments": {"protect_critical": True}, "reason": "Shed load to power hospital"}
    ]
    llm = FakeLLM(scripted_responses=decisions)
    event_bus = EventBus()

    planner = Planner(llm, event_bus)
    agent = AgentController(
        planner=planner,
        registry=registry,
        state_supplier=sim.get_state,
        event_bus=event_bus,
        max_cycles=10
    )

    success = agent.run("Restore hospital power")
    assert success is True
