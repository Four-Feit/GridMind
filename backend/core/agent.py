"""
Agent Controller (Owned by P1)
The master orchestration loop of GridMind: Build the Brain, Not the Puppet.
"""
from typing import Any, Callable, Dict, Optional
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.executor import Executor
from backend.core.memory import Memory
from backend.core.observer import Observer
from backend.core.planner import Planner
from backend.core.recovery import RecoveryEngine
from backend.core.registry import CapabilityRegistry
from backend.core.state import MissionStatus, StateManager
from backend.core.validator import ActionValidator


class AgentMetrics:
    """Tracks operational performance and audit statistics for the dashboard."""

    def __init__(self):
        self.plans_created = 0
        self.replans_triggered = 0
        self.tool_calls_total = 0
        self.tool_failures = 0
        self.successful_recoveries = 0
        self.validation_failures = 0
        self.cycles_executed = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plans_created": self.plans_created,
            "replans_triggered": self.replans_triggered,
            "tool_calls_total": self.tool_calls_total,
            "tool_failures": self.tool_failures,
            "successful_recoveries": self.successful_recoveries,
            "validation_failures": self.validation_failures,
            "cycles_executed": self.cycles_executed
        }


class AgentController:
    """
    Orchestrates the autonomous agent loop:
    Observe -> State -> Plan -> Validate -> Execute -> Observe -> Verify -> Recover/Replan -> Repeat
    """

    def __init__(
        self,
        planner: Planner,
        registry: CapabilityRegistry,
        state_supplier: Callable[[], Dict[str, Any]],
        event_bus: Optional[EventBus] = None,
        max_cycles: int = 15
    ):
        self.events = event_bus or EventBus()
        self.state = StateManager()
        self.memory = Memory()
        self.registry = registry
        self.planner = planner
        self.validator = ActionValidator()
        self.executor = Executor(self.events)
        self.observer = Observer(state_supplier, self.events)
        self.recovery = RecoveryEngine(self.state, self.memory, self.events)
        self.metrics = AgentMetrics()
        self.max_cycles = max_cycles

    def start_mission(self, goal: str = "Maintain power to critical facilities") -> None:
        """Initializes a new mission."""
        self.state.mission.goal = goal
        self.state.mission.status = MissionStatus.RUNNING
        self.events.emit(AgentEvent(
            type=AgentEventType.MISSION_STARTED,
            message=f"Mission initialized with goal: '{goal}'",
            data={"mission_id": self.state.mission.mission_id, "goal": goal}
        ))

    def step(self) -> bool:
        """
        Runs a single cycle of the agent loop.
        Returns True if the mission is completed, False otherwise.
        """
        if self.state.mission.status != MissionStatus.RUNNING:
            return True

        self.metrics.cycles_executed += 1
        plan_id = self.state.increment_plan_id()
        self.metrics.plans_created += 1

        # 1. Observe current environment state
        observation = self.observer.observe(plan_id=plan_id)
        self.state.update_grid(observation)

        # 2. Check if already satisfied at start (if no active disruptions)
        initial_outcome = self.validator.validate_outcome(self.state.grid_state)
        if initial_outcome.valid and self.state.mission.observation_count > 1 and not self.state.grid_state.get("failures"):
            self.state.mission.status = MissionStatus.COMPLETED
            self.events.emit(AgentEvent(
                type=AgentEventType.MISSION_COMPLETED,
                plan_id=plan_id,
                message="Mission goals already satisfied; grid is healthy."
            ))
            return True

        # 3. Plan / Select Tool via LLM (Rule 6: dynamic selection)
        decision = self.planner.decide(
            goal=self.state.mission.goal,
            state=self.state.grid_state,
            capabilities=self.registry.describe_all(enabled_only=True),
            memory_context=self.memory.get_context(),
            plan_id=plan_id
        )

        # 4. Action Validation (Rule 3: never trust LLM directly)
        val_result = self.validator.validate_action(decision, self.registry, self.memory.constraints)
        if not val_result.valid:
            self.metrics.replans_triggered += 1
            self.recovery.handle_invalid_action(decision, val_result, plan_id)
            return False

        # 5. Execute Capability (Rule 1 & Rule 2)
        self.metrics.tool_calls_total += 1
        result = self.executor.execute(decision, self.state.grid_state, self.registry, plan_id)
        self.memory.record(plan_id, decision, result)

        # 6. Handle Tool Failure if any (Rule 5 & Rule 6)
        if not result.success:
            self.metrics.tool_failures += 1
            self.metrics.replans_triggered += 1
            self.recovery.handle_tool_failure(decision, result, plan_id)
            return False

        # 7. Observe fresh environment state after execution
        fresh_observation = self.observer.observe(plan_id=plan_id)
        self.state.update_grid(fresh_observation)

        # 8. Ground-Truth Outcome Validation (Rule 4: code verified)
        self.events.emit(AgentEvent(
            type=AgentEventType.VALIDATION_STARTED,
            plan_id=plan_id,
            message="Validating environment outcome against critical constraints."
        ))
        outcome = self.validator.validate_outcome(self.state.grid_state)

        if outcome.valid:
            if self.metrics.tool_failures > 0:
                self.metrics.successful_recoveries += 1

            self.events.emit(AgentEvent(
                type=AgentEventType.VALIDATION_PASSED,
                plan_id=plan_id,
                message="Outcome validation passed: all critical loads supplied within limits."
            ))
            self.state.mission.status = MissionStatus.COMPLETED
            self.events.emit(AgentEvent(
                type=AgentEventType.MISSION_COMPLETED,
                plan_id=plan_id,
                message="Mission successfully completed!",
                data=self.metrics.to_dict()
            ))
            return True
        else:
            self.metrics.validation_failures += 1
            self.metrics.replans_triggered += 1
            self.recovery.handle_outcome_failure(outcome, plan_id)
            return False

    def run(self, goal: str = "Maintain power to critical facilities") -> bool:
        """Runs the loop until mission completion or max cycles reached."""
        self.start_mission(goal)
        while self.state.mission.status == MissionStatus.RUNNING and self.metrics.cycles_executed < self.max_cycles:
            completed = self.step()
            if completed:
                return True

        if self.state.mission.status != MissionStatus.COMPLETED:
            self.state.mission.status = MissionStatus.FAILED
            self.events.emit(AgentEvent(
                type=AgentEventType.MISSION_FAILED,
                message=f"Mission reached cycle limit ({self.max_cycles}) without achieving verified safety."
            ))
            return False
        return True

    def get_metrics(self) -> Dict[str, Any]:
        """Returns dashboard telemetry metrics."""
        return self.metrics.to_dict()
