"""
Grid Simulator (Owned by P2)
"""
import time
from typing import Any, Dict, List, Optional
from backend.grid.models import Battery, Generator, GridState, Load, Substation, TransmissionLine


class GridSimulator:
    """Simulates the physical power grid, failures, and constraints."""

    def __init__(self):
        self.reset()

    def reset(self) -> None:
        self.generators = [
            Generator(id="G1", type="conventional", capacity_mw=150.0, available_mw=140.0, online=True),
            Generator(id="G2_SOLAR", type="solar", capacity_mw=50.0, available_mw=40.0, online=True)
        ]
        self.substations = [
            Substation(id="S1", online=True),
            Substation(id="S2", online=True),
            Substation(id="S3", online=True)
        ]
        self.transmission_lines = [
            TransmissionLine(**{"id": "TL1", "from": "S1", "to": "S2", "capacity_mw": 80.0, "load_mw": 50.0, "online": True}),
            TransmissionLine(**{"id": "TL4", "from": "S2", "to": "S3", "capacity_mw": 60.0, "load_mw": 40.0, "online": True})
        ]
        self.loads = [
            Load(id="HOSPITAL", type="hospital", demand_mw=30.0, supplied_mw=30.0, priority="critical", connected=True),
            Load(id="WATER_PLANT", type="water_plant", demand_mw=25.0, supplied_mw=25.0, priority="critical", connected=True),
            Load(id="EMERGENCY_SERVICES", type="emergency", demand_mw=15.0, supplied_mw=15.0, priority="critical", connected=True),
            Load(id="RESIDENTIAL_ZONE", type="residential", demand_mw=40.0, supplied_mw=40.0, priority="normal", connected=True),
            Load(id="FACTORY", type="industrial", demand_mw=40.0, supplied_mw=40.0, priority="normal", connected=True)
        ]
        self.battery = Battery(id="B1", capacity_mwh=100.0, remaining_mwh=80.0, max_output_mw=40.0, online=True)
        self.failures: List[str] = []

    def get_state(self) -> Dict[str, Any]:
        total_gen = sum(g.available_mw for g in self.generators if g.online)
        total_demand = sum(l.demand_mw for l in self.loads if l.connected)
        state = GridState(
            timestamp=time.time(),
            generation_mw=total_gen,
            demand_mw=total_demand,
            generators=self.generators,
            substations=self.substations,
            transmission_lines=self.transmission_lines,
            loads=self.loads,
            battery=self.battery,
            failures=self.failures
        )
        return state.model_dump(by_alias=True)

    def inject_failure(self, target_type: str, target_id: str, params: Optional[Dict[str, Any]] = None) -> None:
        params = params or {}
        if target_type == "substation":
            for s in self.substations:
                if s.id == target_id:
                    s.online = False
                    self.failures.append(f"Substation {target_id} offline")
            # Disconnect loads dependent on target
            if target_id == "S2":
                for l in self.loads:
                    if l.id == "HOSPITAL":
                        l.connected = False
                        l.supplied_mw = 0.0

        elif target_type in ("generator", "weather", "WEATHER_DETERIORATION", "GENERATOR_FAILURE"):
            for g in self.generators:
                if g.id == target_id or (target_type in ("weather", "WEATHER_DETERIORATION") and g.id == "G2_SOLAR"):
                    drop = params.get("drop_mw", 30.0)
                    g.available_mw = max(0.0, g.available_mw - drop)
                    self.failures.append(f"Weather shock: {g.id} reduced to {g.available_mw}MW")

        elif target_type in ("transmission_line", "TRANSMISSION_FAILURE"):
            for t in self.transmission_lines:
                if t.id == target_id:
                    t.online = False
                    self.failures.append(f"Transmission line {target_id} tripped")

        elif target_type in ("demand_spike", "DEMAND_SPIKE"):
            spike = params.get("spike_mw", 20.0)
            for l in self.loads:
                if l.id == target_id or target_id == "ALL_LOADS":
                    l.demand_mw += spike
                    self.failures.append(f"Demand spike: {l.id} increased by {spike}MW")
