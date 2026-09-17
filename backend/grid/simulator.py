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
            Generator(id="G1", capacity_mw=100, available_mw=90, online=True),
            Generator(id="G2", capacity_mw=100, available_mw=90, online=True)
        ]
        self.substations = [
            Substation(id="S1", online=True),
            Substation(id="S2", online=True),
            Substation(id="S3", online=True)
        ]
        self.transmission_lines = [
            TransmissionLine(**{"id": "TL1", "from": "S1", "to": "S2", "capacity_mw": 80, "load_mw": 50, "online": True}),
            TransmissionLine(**{"id": "TL4", "from": "S2", "to": "S3", "capacity_mw": 60, "load_mw": 40, "online": True})
        ]
        self.loads = [
            Load(id="HOSPITAL", type="hospital", demand_mw=30, supplied_mw=30, priority="critical", connected=True),
            Load(id="WATER_PLANT", type="water_plant", demand_mw=25, supplied_mw=25, priority="critical", connected=True),
            Load(id="RESIDENTIAL_1", type="residential", demand_mw=40, supplied_mw=40, priority="normal", connected=True),
            Load(id="FACTORY", type="industrial", demand_mw=45, supplied_mw=45, priority="normal", connected=True)
        ]
        self.battery = Battery(id="B1", capacity_mwh=100, remaining_mwh=80, max_output_mw=40, online=True)
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

    def inject_failure(self, target_type: str, target_id: str) -> None:
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
