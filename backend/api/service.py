"""
GridMind Service & Orchestration Adapter (Owned by P4)
Bridges P1 (Agent Core), P2 (Grid Simulator), and P3 (Capabilities)
with FastAPI HTTP and WebSocket streaming.
"""
import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

from backend.capabilities.analyzer import GridAnalyzer
from backend.capabilities.battery import BatteryEngine
from backend.capabilities.priority_manager import PriorityLoadManager
from backend.capabilities.redistribution import RedistributionEngine
from backend.core.agent import AgentController
from backend.core.events import AgentEvent, AgentEventType, EventBus
from backend.core.planner import Planner
from backend.core.registry import CapabilityRegistry
from backend.core.state import MissionStatus
from backend.grid.models import GridState
from backend.grid.simulator import GridSimulator
from backend.llm.client import FakeLLM, OpenAILikeClient

logger = logging.getLogger("gridmind.service")


class GridMindService:
    """
    Singleton service managing the lifecycle of simulator, agent, capabilities,
    and event broadcasting to WebSocket clients.
    """

    def __init__(self):
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None
        self._ws_broadcaster: Optional[Any] = None
        self._running_task: Optional[asyncio.Task] = None
        self._is_stepping: bool = False
        self.step_delay: float = 1.0  # Pace of execution in seconds for cinematic UI

        self.reset_all()

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._event_loop = loop

    def set_ws_broadcaster(self, broadcaster: Any) -> None:
        self._ws_broadcaster = broadcaster

    def _on_event(self, event: AgentEvent) -> None:
        """Callback invoked whenever an AgentEvent is emitted on EventBus."""
        event_dict = event.model_dump()
        # Also attach a snapshot of current grid state for seamless UI sync
        try:
            grid_snapshot = self.simulator.get_state()
            event_dict["grid_state"] = grid_snapshot
        except Exception:
            pass

        if self._ws_broadcaster and self._event_loop:
            if self._event_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    self._ws_broadcaster(event_dict),
                    self._event_loop
                )

    def reset_all(self, scripted_responses: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Resets the simulator, capabilities, agent, and event bus to initial state."""
        # Cancel any active running task
        if self._running_task and not self._running_task.done():
            self._running_task.cancel()
            self._running_task = None

        self.simulator = GridSimulator()
        self.event_bus = EventBus()
        self.event_bus.subscribe(self._on_event)

        self.registry = CapabilityRegistry()
        self.registry.register(RedistributionEngine())
        self.registry.register(PriorityLoadManager(simulator=self.simulator))
        self.registry.register(BatteryEngine())
        self.registry.register(GridAnalyzer())

        # Smart LLM client that demonstrates the demo flow and respects memory/failures
        default_scripted = scripted_responses or [
            {
                "action": "redistribution_engine",
                "arguments": {"target_substation": "S2"},
                "reason": "Attempting rerouting to restore isolated substation S2."
            },
            {
                "action": "priority_load_manager",
                "arguments": {"protect_critical": True},
                "reason": "Redistribution overloaded TL4; shedding non-critical industrial load to guarantee critical facilities."
            },
            {
                "action": "battery_engine",
                "arguments": {"power_mw": 25, "duration_minutes": 15},
                "reason": "Deploying energy storage reserve to stabilize grid deficit."
            }
        ]
        self.llm = FakeLLM(scripted_responses=default_scripted)

        self.planner = Planner(self.llm, self.event_bus)
        self.agent = AgentController(
            planner=self.planner,
            registry=self.registry,
            state_supplier=self.simulator.get_state,
            event_bus=self.event_bus,
            max_cycles=15
        )

        return {"status": "ok", "reset": True, "grid": self.simulator.get_state(), "mission": self.agent.state.mission.model_dump()}

    def get_grid_state(self) -> Dict[str, Any]:
        return self.simulator.get_state()

    def get_agent_state(self) -> Dict[str, Any]:
        return {
            "mission": self.agent.state.mission.model_dump(),
            "last_observation_id": self.agent.state.last_observation_id,
            "memory_context": self.agent.memory.get_context()
        }

    def get_events(self) -> List[Dict[str, Any]]:
        return [e.model_dump() for e in self.event_bus.get_history()]

    def get_capabilities(self) -> List[Dict[str, Any]]:
        return self.registry.describe_all()

    def inject_chaos(self, event_type: str, target: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Injects a chaos event into the grid simulator and notifies the agent."""
        params = params or {}
        event_type_upper = event_type.upper()

        if "SUBSTATION" in event_type_upper or event_type.lower() == "substation":
            self.simulator.inject_failure("substation", target)
            msg = f"Chaos Injected: Substation {target} offline. Downstream loads isolated."
        elif "WEATHER" in event_type_upper or event_type.lower() == "weather":
            # Weather deterioration: drop solar generation
            drop_mw = float(params.get("drop_mw", 30))
            for g in self.simulator.generators:
                if g.id == "G1":
                    g.available_mw = max(10.0, g.available_mw - drop_mw)
            self.simulator.failures.append(f"Severe storm: Solar generation reduced by {drop_mw}MW")
            msg = f"Chaos Injected: Weather deterioration causing {drop_mw}MW generation drop."
        elif "DEMAND" in event_type_upper or event_type.lower() == "demand":
            # Demand spike
            spike_mw = float(params.get("spike_mw", 25))
            for l in self.simulator.loads:
                if l.id == "RESIDENTIAL_1":
                    l.demand_mw += spike_mw
                    if l.connected:
                        l.supplied_mw += spike_mw
            self.simulator.failures.append(f"Demand Spike: +{spike_mw}MW sudden load surge")
            msg = f"Chaos Injected: Peak demand surge of +{spike_mw}MW on residential grid."
        elif "LINE" in event_type_upper or "TRANSMISSION" in event_type_upper:
            for tl in self.simulator.transmission_lines:
                if tl.id == target:
                    tl.online = False
                    self.simulator.failures.append(f"Transmission Line {target} tripped")
            msg = f"Chaos Injected: Transmission line {target} tripped offline."
        else:
            self.simulator.failures.append(f"Chaos event: {event_type} on {target}")
            msg = f"Chaos Injected: {event_type} on {target}"

        # Emit CHAOS_EVENT so agent observer and UI timeline receive immediate notice
        chaos_event = AgentEvent(
            type=AgentEventType.CHAOS_EVENT,
            message=msg,
            data={
                "event_type": event_type,
                "target": target,
                "params": params,
                "grid_state": self.simulator.get_state()
            }
        )
        self.event_bus.emit(chaos_event)

        return {
            "status": "ok",
            "message": msg,
            "grid_state": self.simulator.get_state()
        }

    async def _run_agent_loop(self) -> None:
        """Paced execution of agent steps so the UI experiences real-time reasoning."""
        try:
            while self.agent.state.mission.status == MissionStatus.RUNNING:
                await asyncio.sleep(self.step_delay)
                if self.agent.state.mission.status != MissionStatus.RUNNING:
                    break

                completed = self.agent.step()
                if completed:
                    break
        except asyncio.CancelledError:
            logger.info("Agent execution loop was cancelled.")
        except Exception as e:
            logger.exception("Error during agent execution loop: %s", e)
            self.event_bus.emit(AgentEvent(
                type=AgentEventType.MISSION_FAILED,
                message=f"Execution error: {str(e)}",
                data={"error": str(e)}
            ))

    def start_mission(self, goal: str = "Maintain power to critical facilities", pace_seconds: float = 1.0, auto_run: bool = True) -> Dict[str, Any]:
        """Starts a mission with the given goal."""
        self.step_delay = max(0.2, pace_seconds)

        # If already running, cancel previous loop
        if self._running_task and not self._running_task.done():
            self._running_task.cancel()

        self.agent.start_mission(goal)

        if auto_run:
            if self._event_loop and self._event_loop.is_running():
                self._running_task = self._event_loop.create_task(self._run_agent_loop())
            else:
                try:
                    loop = asyncio.get_event_loop()
                    self._running_task = loop.create_task(self._run_agent_loop())
                except Exception:
                    pass

        return {
            "status": "ok",
            "goal": goal,
            "mission_id": self.agent.state.mission.mission_id,
            "auto_run": auto_run
        }

    def step_mission(self) -> Dict[str, Any]:
        """Executes a single step in the agent cycle."""
        if self.agent.state.mission.status == MissionStatus.IDLE:
            self.agent.start_mission()

        completed = self.agent.step()
        return {
            "status": "ok",
            "completed": completed,
            "mission_status": self.agent.state.mission.status.value,
            "plan_id": self.agent.state.mission.plan_id,
            "grid_state": self.simulator.get_state()
        }

    def stop_mission(self) -> Dict[str, Any]:
        """Pauses or cancels active mission execution."""
        if self._running_task and not self._running_task.done():
            self._running_task.cancel()
            self._running_task = None

        if self.agent.state.mission.status == MissionStatus.RUNNING:
            self.agent.state.mission.status = MissionStatus.PAUSED

        return {
            "status": "ok",
            "mission_status": self.agent.state.mission.status.value
        }


# Singleton service instance
service = GridMindService()
