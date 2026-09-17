"""
Milestone 1 Verification: P1 + P2 (Agent Core + Grid Simulator)
Goal from README Section 31:
Agent -> observe -> receive GridState -> verify and print state.
"""
from backend.core.agent import AgentController
from backend.core.events import AgentEventType, EventBus
from backend.core.planner import Planner
from backend.core.registry import CapabilityRegistry
from backend.grid.simulator import GridSimulator
from backend.llm.client import FakeLLM


def test_milestone_1_agent_observes_simulator():
    # 1. Initialize P2 Grid Simulator
    simulator = GridSimulator()
    raw_state = simulator.get_state()

    print("\n--- P2 Simulator Initial State ---")
    print(f"Total Generation: {raw_state['generation_mw']} MW")
    print(f"Total Demand:     {raw_state['demand_mw']} MW")
    print(f"Generators Count: {len(raw_state['generators'])}")
    print(f"Substations:      {len(raw_state['substations'])}")
    print(f"Loads Count:      {len(raw_state['loads'])}")

    # Assert contract compliance (Contract 1: GridState)
    assert "generation_mw" in raw_state
    assert "demand_mw" in raw_state
    assert "generators" in raw_state
    assert "substations" in raw_state
    assert "transmission_lines" in raw_state
    assert "loads" in raw_state
    assert "battery" in raw_state

    # 2. Initialize P1 Agent Core with Observer linked to simulator
    event_bus = EventBus()
    emitted_events = []
    event_bus.subscribe(lambda e: emitted_events.append(e))

    registry = CapabilityRegistry()
    planner = Planner(FakeLLM(), event_bus)

    agent = AgentController(
        planner=planner,
        registry=registry,
        state_supplier=simulator.get_state,
        event_bus=event_bus
    )

    # 3. Agent executes observation
    observed_state = agent.observer.observe(plan_id=1)
    agent.state.update_grid(observed_state)

    print("\n--- P1 Agent Observed State ---")
    print(f"Observation ID: {agent.state.last_observation_id}")
    print(f"Agent Cached Gen: {agent.state.grid_state['generation_mw']} MW")
    print(f"Agent Cached Dem: {agent.state.grid_state['demand_mw']} MW")

    # Verify P1 successfully received and cached P2's state
    assert agent.state.last_observation_id == 1
    assert agent.state.grid_state["generation_mw"] == raw_state["generation_mw"]
    assert agent.state.grid_state["demand_mw"] == raw_state["demand_mw"]
    assert len(agent.state.grid_state["loads"]) == len(raw_state["loads"])

    # Verify OBSERVATION event was published on EventBus
    obs_events = [e for e in emitted_events if e.type == AgentEventType.OBSERVATION]
    assert len(obs_events) == 1
    assert obs_events[0].data["generation_mw"] == raw_state["generation_mw"]

    # 4. Simulate a change in P2 (e.g. generator output adjusts)
    simulator.generators[0].available_mw = 120.0
    fresh_state = agent.observer.observe(plan_id=2)
    agent.state.update_grid(fresh_state)

    print("\n--- P1 Agent Re-observed After World Change ---")
    print(f"New Total Gen Observed: {agent.state.grid_state['generation_mw']} MW")
    assert agent.state.grid_state["generation_mw"] == 160.0  # 120 + 40
    assert agent.state.last_observation_id == 2
