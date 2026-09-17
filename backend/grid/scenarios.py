"""
Pre-Packaged Grid Scenarios (Owned by P2)
Provides deterministic grid profiles for testing, training, and live demo presets.
"""
from typing import Any, Dict, List, Optional
from backend.grid.models import Battery, Generator, Load, Substation, TransmissionLine


def get_scenario_baseline() -> Dict[str, Any]:
    """Default standard demo baseline (180MW generation, 150MW demand, 80MWh battery)."""
    return {
        "id": "baseline",
        "name": "Standard Demo Baseline",
        "description": "Balanced stable grid operating with 180MW available generation and 150MW connected demand.",
        "generators": [
            Generator(id="G1", type="conventional", capacity_mw=150.0, available_mw=140.0, online=True),
            Generator(id="G2_SOLAR", type="solar", capacity_mw=50.0, available_mw=40.0, online=True),
        ],
        "substations": [
            Substation(id="S1", type="substation", online=True),
            Substation(id="S2", type="substation", online=True),
            Substation(id="S3", type="substation", online=True),
        ],
        "transmission_lines": [
            TransmissionLine(**{"id": "TL1", "from": "S1", "to": "S2", "capacity_mw": 80.0, "load_mw": 50.0, "online": True}),
            TransmissionLine(**{"id": "TL4", "from": "S2", "to": "S3", "capacity_mw": 60.0, "load_mw": 40.0, "online": True}),
        ],
        "loads": [
            Load(id="HOSPITAL", type="hospital", demand_mw=30.0, supplied_mw=30.0, priority="critical", connected=True),
            Load(id="WATER_PLANT", type="water_plant", demand_mw=25.0, supplied_mw=25.0, priority="critical", connected=True),
            Load(id="EMERGENCY_SERVICES", type="emergency", demand_mw=15.0, supplied_mw=15.0, priority="critical", connected=True),
            Load(id="RESIDENTIAL_ZONE", type="residential", demand_mw=40.0, supplied_mw=40.0, priority="normal", connected=True),
            Load(id="FACTORY", type="industrial", demand_mw=40.0, supplied_mw=40.0, priority="normal", connected=True),
        ],
        "battery": Battery(id="B1", capacity_mwh=100.0, remaining_mwh=80.0, max_output_mw=40.0, online=True),
        "failures": [],
    }


def get_scenario_heatwave() -> Dict[str, Any]:
    """Heatwave stress: demand spikes to 180MW while solar derates to 25MW."""
    base = get_scenario_baseline()
    base["id"] = "heatwave_stress"
    base["name"] = "Summer Heatwave Stress"
    base["description"] = "Industrial and residential cooling demand spikes by 30MW, solar output drops due to heat derating."
    base["generators"][1].available_mw = 25.0
    for l in base["loads"]:
        if l.id == "RESIDENTIAL_ZONE":
            l.demand_mw = 55.0
            l.supplied_mw = 55.0
        elif l.id == "FACTORY":
            l.demand_mw = 55.0
            l.supplied_mw = 55.0
    base["failures"] = ["Extreme weather alert: Solar derated by 15MW, high grid cooling demand"]
    return base


def get_scenario_islanded() -> Dict[str, Any]:
    """Severed transmission line: TL1 offline, isolating S1 from S2 and forcing local battery reliance."""
    base = get_scenario_baseline()
    base["id"] = "islanded_grid"
    base["name"] = "Islanded Substation Outage"
    base["description"] = "Main transmission line TL1 is severed, cutting main conventional generation from S2 and S3."
    base["transmission_lines"][0].online = False
    base["transmission_lines"][0].load_mw = 0.0
    base["failures"] = ["Transmission line TL1 severed: S2/S3 operating as islanded sub-grid"]
    return base


def get_scenario_cascade() -> Dict[str, Any]:
    """Cascade failure scenario: Substation S2 offline and hospital disconnected."""
    base = get_scenario_baseline()
    base["id"] = "cascade_failure"
    base["name"] = "Cascade Substation Collapse"
    base["description"] = "Central substation S2 tripped, isolating critical hospital facilities and stressing TL4."
    base["substations"][1].online = False
    for l in base["loads"]:
        if l.id == "HOSPITAL":
            l.connected = False
            l.supplied_mw = 0.0
    base["failures"] = ["Substation S2 offline", "Critical facility HOSPITAL disconnected"]
    return base


def get_scenario_renewable_dusk() -> Dict[str, Any]:
    """Renewable dusk scenario: Solar drops to 0MW, testing generation deficit handling."""
    base = get_scenario_baseline()
    base["id"] = "renewable_dusk"
    base["name"] = "Renewable Solar Dusk"
    base["description"] = "Solar generation ramps down to zero at sunset, leaving a 10MW generation deficit."
    base["generators"][1].available_mw = 0.0
    base["failures"] = ["Solar dusk: G2_SOLAR generation at 0MW (10MW net deficit)"]
    return base


SCENARIO_BUILDERS = {
    "baseline": get_scenario_baseline,
    "heatwave_stress": get_scenario_heatwave,
    "heatwave": get_scenario_heatwave,
    "islanded_grid": get_scenario_islanded,
    "islanded": get_scenario_islanded,
    "cascade_failure": get_scenario_cascade,
    "cascade": get_scenario_cascade,
    "renewable_dusk": get_scenario_renewable_dusk,
    "dusk": get_scenario_renewable_dusk,
}


def list_available_scenarios() -> List[Dict[str, str]]:
    """Returns a list of scenario descriptors for dashboard selectors or CLI."""
    unique_keys = ["baseline", "heatwave_stress", "islanded_grid", "cascade_failure", "renewable_dusk"]
    res = []
    for k in unique_keys:
        data = SCENARIO_BUILDERS[k]()
        res.append({
            "id": data["id"],
            "name": data["name"],
            "description": data["description"]
        })
    return res


def get_scenario(scenario_id: str) -> Optional[Dict[str, Any]]:
    """Fetches full scenario initialization dictionary by ID or alias."""
    builder = SCENARIO_BUILDERS.get(scenario_id.lower().strip())
    if builder:
        return builder()
    return None
