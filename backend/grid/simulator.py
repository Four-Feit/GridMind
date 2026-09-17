import copy
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from backend.grid.events import ChaosEvent, ChaosEventType
from backend.grid.models import Battery, Generator, GridState, Load, Substation, TransmissionLine
from backend.grid.power_balance import solve_network_flows
from backend.grid.scenarios import get_scenario, list_available_scenarios


class GridSimulator:
    """Simulates the physical power grid, failures, and constraints."""

    def __init__(self):
        self._snapshots: Dict[str, Dict[str, Any]] = {}
        self.battery_discharge_rate_mw: float = 0.0
        self.sim_timestamp: float = time.time()
        self.reset()

    def reset(self) -> None:
        """Resets the simulator to the deterministic demo baseline."""
        self.sim_timestamp = time.time()
        self.battery_discharge_rate_mw = 0.0
        self.load_scenario("baseline")

    def load_scenario(self, scenario_id: str) -> bool:
        """
        Loads a pre-packaged grid scenario (e.g. baseline, heatwave_stress, islanded_grid).
        Returns True if loaded, False if scenario is unknown.
        """
        data = get_scenario(scenario_id)
        if not data:
            return False

        self.current_scenario_id = data.get("id", scenario_id)
        self.generators: List[Generator] = data["generators"]
        self.substations: List[Substation] = data["substations"]
        self.transmission_lines: List[TransmissionLine] = data["transmission_lines"]
        self.loads: List[Load] = data["loads"]
        self.battery: Optional[Battery] = data["battery"]
        self.failures: List[str] = list(data["failures"])
        return True

    def list_scenarios(self) -> List[Dict[str, str]]:
        """Returns metadata for all available pre-packaged grid scenarios."""
        return list_available_scenarios()

    def create_snapshot(self, label: Optional[str] = None) -> str:
        """
        Captures an in-memory deep copy of the current simulation world.
        Returns a unique snapshot_id for time-machine rollback.
        """
        snapshot_id = f"snap_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        self._snapshots[snapshot_id] = {
            "label": label or f"Snapshot at {time.strftime('%H:%M:%S')}",
            "timestamp": self.sim_timestamp,
            "generators": copy.deepcopy(self.generators),
            "substations": copy.deepcopy(self.substations),
            "transmission_lines": copy.deepcopy(self.transmission_lines),
            "loads": copy.deepcopy(self.loads),
            "battery": copy.deepcopy(self.battery),
            "failures": list(self.failures),
            "battery_discharge_rate_mw": self.battery_discharge_rate_mw,
            "sim_timestamp": self.sim_timestamp,
        }
        return snapshot_id

    def restore_snapshot(self, snapshot_id: str) -> bool:
        """
        Rolls back the physical simulation state to an exact earlier snapshot.
        Returns True if restored, False if snapshot_id is not found.
        """
        if snapshot_id not in self._snapshots:
            return False

        snap = self._snapshots[snapshot_id]
        self.generators = copy.deepcopy(snap["generators"])
        self.substations = copy.deepcopy(snap["substations"])
        self.transmission_lines = copy.deepcopy(snap["transmission_lines"])
        self.loads = copy.deepcopy(snap["loads"])
        self.battery = copy.deepcopy(snap["battery"])
        self.failures = list(snap["failures"])
        self.battery_discharge_rate_mw = snap.get("battery_discharge_rate_mw", 0.0)
        self.sim_timestamp = snap.get("sim_timestamp", time.time())
        return True

    def list_snapshots(self) -> List[Dict[str, Any]]:
        """Returns metadata for all saved state checkpoints."""
        return [
            {
                "snapshot_id": sid,
                "label": sdata["label"],
                "timestamp": sdata["timestamp"],
            }
            for sid, sdata in self._snapshots.items()
        ]

    def delete_snapshot(self, snapshot_id: str) -> bool:
        """Removes a snapshot checkpoint from memory."""
        if snapshot_id in self._snapshots:
            del self._snapshots[snapshot_id]
            return True
        return False

    def step(self, dt_seconds: float = 60.0) -> Dict[str, Any]:
        """
        Advances the physical simulation clock by dt_seconds.
        Drains battery energy based on active discharge rate and updates power flows.
        """
        self.sim_timestamp += dt_seconds

        # Continuous battery discharge physics
        if self.battery and self.battery.online and self.battery_discharge_rate_mw > 0:
            energy_consumed_mwh = (self.battery_discharge_rate_mw * dt_seconds) / 3600.0
            if energy_consumed_mwh >= self.battery.remaining_mwh:
                self.battery.remaining_mwh = 0.0
                self.battery.online = False
                self.battery_discharge_rate_mw = 0.0
                msg = f"Battery {self.battery.id} depleted and automatically disconnected"
                if msg not in self.failures:
                    self.failures.append(msg)
            else:
                self.battery.remaining_mwh = round(self.battery.remaining_mwh - energy_consumed_mwh, 3)

        self.update_flows()
        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        """Returns the current state conforming strictly to the GridState contract."""
        total_gen = sum(g.available_mw for g in self.generators if g.online)
        total_demand = sum(l.demand_mw for l in self.loads if l.connected)

        state = GridState(
            timestamp=round(self.sim_timestamp, 2),
            generation_mw=round(total_gen, 2),
            demand_mw=round(total_demand, 2),
            generators=self.generators,
            substations=self.substations,
            transmission_lines=self.transmission_lines,
            loads=self.loads,
            battery=self.battery,
            failures=list(self.failures),
        )
        return state.model_dump(by_alias=True)

    def update_flows(self) -> Dict[str, float]:
        """Runs the network power flow solver and updates line loading."""
        state = self.get_state()
        flows = solve_network_flows(state)
        for line in self.transmission_lines:
            if line.id in flows:
                line.load_mw = flows[line.id]
        return flows

    def inject_event(self, event: Union[ChaosEvent, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Applies a chaos event to alter physical environment state.
        Supports SUBSTATION_FAILURE, TRANSMISSION_FAILURE, GENERATOR_FAILURE,
        WEATHER_DETERIORATION, DEMAND_SPIKE, and BATTERY_DEPLETION.
        """
        if isinstance(event, dict):
            event = ChaosEvent(**event)

        event_type_str = event.event_type.upper()
        target = event.target
        params = event.params or {}
        message = ""

        if event_type_str in (ChaosEventType.SUBSTATION_FAILURE, "SUBSTATION_FAILURE", "SUBSTATION"):
            matched = False
            for s in self.substations:
                if s.id == target:
                    s.online = False
                    matched = True
            if matched:
                msg = f"Substation {target} offline"
                if msg not in self.failures:
                    self.failures.append(msg)
                # If S2 fails, disconnect dependent loads (e.g. Hospital)
                if target == "S2":
                    for l in self.loads:
                        if l.id == "HOSPITAL":
                            l.connected = False
                            l.supplied_mw = 0.0
                message = f"Substation {target} tripped offline"
            else:
                message = f"Substation {target} not found"

        elif event_type_str in (ChaosEventType.TRANSMISSION_FAILURE, "TRANSMISSION_FAILURE", "TRANSMISSION_LINE", "TRANSMISSION", "LINE", "LINE_TRIP"):
            matched = False
            for line in self.transmission_lines:
                if line.id == target:
                    line.online = False
                    line.load_mw = 0.0
                    matched = True
            if matched:
                msg = f"Transmission line {target} tripped"
                if msg not in self.failures:
                    self.failures.append(msg)
                # If TL4 is severed, downstream loads connected via S3 lose incoming power
                if target == "TL4":
                    for l in self.loads:
                        l.supplied_mw = 0.0
                        l.connected = False
                message = f"Transmission line {target} tripped offline"
            else:
                message = f"Transmission line {target} not found"

        elif event_type_str in (ChaosEventType.GENERATOR_FAILURE, "GENERATOR_FAILURE", "GENERATOR"):
            matched = False
            for gen in self.generators:
                if gen.id == target:
                    gen.online = False
                    gen.available_mw = 0.0
                    matched = True
            if matched:
                msg = f"Generator {target} tripped offline"
                if msg not in self.failures:
                    self.failures.append(msg)
                message = f"Generator {target} shut down"
            else:
                message = f"Generator {target} not found"

        elif event_type_str in (ChaosEventType.WEATHER_DETERIORATION, "WEATHER_DETERIORATION", "WEATHER"):
            drop = float(params.get("drop_mw", params.get("drop", 30.0)))
            matched_gen = None
            for gen in self.generators:
                is_target = (gen.id == target) or (target in ("", "SOLAR", "ALL", "G2_SOLAR") and (gen.id == "G2_SOLAR" or gen.type == "solar"))
                if is_target:
                    gen.available_mw = max(0.0, gen.available_mw - drop)
                    matched_gen = gen
                    if target != "ALL":
                        break
            new_avail = matched_gen.available_mw if matched_gen else 0.0
            msg = f"Weather shock: {matched_gen.id if matched_gen else 'Solar'} reduced to {new_avail:.1f}MW"
            if msg not in self.failures:
                self.failures.append(msg)
            message = msg

        elif event_type_str in (ChaosEventType.DEMAND_SPIKE, "DEMAND_SPIKE"):
            spike = float(params.get("spike_mw", params.get("additional_mw", 20.0)))
            matched = False
            for load in self.loads:
                if load.id == target or target == "ALL_LOADS":
                    load.demand_mw += spike
                    matched = True
                    msg = f"Demand spike: {load.id} increased by {spike:.1f}MW"
                    if msg not in self.failures:
                        self.failures.append(msg)
            if matched:
                message = f"Demand spike applied (+{spike:.1f}MW)"
            else:
                message = f"Load {target} not found for demand spike"

        elif event_type_str in (ChaosEventType.BATTERY_DEPLETION, "BATTERY_DEPLETION", "BATTERY"):
            remaining = float(params.get("remaining_mwh", 5.0))
            if self.battery:
                self.battery.remaining_mwh = max(0.0, remaining)
                msg = f"Battery depletion: remaining storage {self.battery.remaining_mwh:.1f}MWh"
                if msg not in self.failures:
                    self.failures.append(msg)
                message = msg
            else:
                message = "No battery system available"

        else:
            message = f"Unknown chaos event type: {event.event_type}"

        return {
            "status": "APPLIED",
            "event_type": event_type_str,
            "target": target,
            "message": message,
            "timestamp": time.time(),
        }

    def inject_failure(self, target_type: str, target_id: str, params: Optional[Dict[str, Any]] = None) -> None:
        """Backward-compatible helper for P4 API and integration tests."""
        self.inject_event({"event_type": target_type, "target": target_id, "params": params or {}})

    def set_line_load(self, line_id: str, load_mw: float) -> bool:
        """Updates load flow on a transmission line. Fails if line is offline."""
        for line in self.transmission_lines:
            if line.id == line_id:
                if not line.online:
                    return False
                line.load_mw = load_mw
                return True
        return False

    def set_load_status(self, load_id: str, connected: bool, supplied_mw: Optional[float] = None) -> bool:
        """Used by Priority Load Manager or simulator to shed/restore loads."""
        for load in self.loads:
            if load.id == load_id:
                load.connected = connected
                if supplied_mw is not None:
                    load.supplied_mw = supplied_mw
                else:
                    load.supplied_mw = load.demand_mw if connected else 0.0
                return True
        return False

    def discharge_battery(self, power_mw: float, duration_hours: float = 1.0) -> Tuple[bool, str]:
        """
        Discharges battery energy by power_mw over duration_hours.
        Returns (success: bool, message: str).
        """
        if not self.battery:
            return False, "No battery installed in grid."
        if not self.battery.online:
            return False, "Battery system is offline."
        if power_mw > self.battery.max_output_mw:
            return False, f"Requested {power_mw:.1f}MW exceeds max output {self.battery.max_output_mw:.1f}MW."

        needed_mwh = power_mw * duration_hours
        if needed_mwh > self.battery.remaining_mwh:
            return False, f"Insufficient energy: {needed_mwh:.1f}MWh needed, {self.battery.remaining_mwh:.1f}MWh remaining."

        if duration_hours > 0:
            self.battery.remaining_mwh = round(self.battery.remaining_mwh - needed_mwh, 2)
        self.battery_discharge_rate_mw = power_mw
        return True, f"Discharged {power_mw:.1f}MW ({needed_mwh:.1f}MWh). Remaining: {self.battery.remaining_mwh:.1f}MWh."
