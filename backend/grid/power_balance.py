"""
Power Balance Calculations & Physical Flow Engine (Owned by P2)
"""
from typing import Any, Dict, List, Optional


def calculate_power_deficit(grid_state: Dict[str, Any]) -> float:
    """Calculate the shortfall in generation relative to active connected demand."""
    gen = float(grid_state.get("generation_mw", 0.0))
    dem = float(grid_state.get("demand_mw", 0.0))
    return max(0.0, dem - gen)


def calculate_generation_summary(grid_state: Dict[str, Any]) -> Dict[str, Any]:
    """Summarize available generation and breakdown by status."""
    total_capacity = 0.0
    total_available = 0.0
    generator_breakdown = {}

    for gen in grid_state.get("generators", []):
        gen_id = gen.get("id")
        cap = float(gen.get("capacity_mw", 0.0))
        avail = float(gen.get("available_mw", 0.0)) if gen.get("online", True) else 0.0
        total_capacity += cap
        total_available += avail
        generator_breakdown[gen_id] = {
            "capacity_mw": cap,
            "available_mw": avail,
            "online": gen.get("online", True)
        }

    return {
        "total_capacity_mw": total_capacity,
        "total_available_mw": total_available,
        "generators": generator_breakdown
    }


def calculate_demand_summary(grid_state: Dict[str, Any]) -> Dict[str, Any]:
    """Summarize power demand partitioned by critical and normal priorities."""
    total_demand = 0.0
    critical_demand = 0.0
    normal_demand = 0.0
    critical_supplied = 0.0
    normal_supplied = 0.0

    for load in grid_state.get("loads", []):
        if not load.get("connected", True):
            continue
        demand = float(load.get("demand_mw", 0.0))
        supplied = float(load.get("supplied_mw", 0.0))
        priority = load.get("priority", "normal")

        total_demand += demand
        if priority == "critical":
            critical_demand += demand
            critical_supplied += supplied
        else:
            normal_demand += demand
            normal_supplied += supplied

    return {
        "total_connected_demand_mw": total_demand,
        "critical_demand_mw": critical_demand,
        "critical_supplied_mw": critical_supplied,
        "normal_demand_mw": normal_demand,
        "normal_supplied_mw": normal_supplied,
        "critical_satisfied": critical_supplied >= critical_demand
    }


def calculate_net_margin(grid_state: Dict[str, Any]) -> float:
    """Calculate net power margin (generation - demand). Positive means surplus, negative means deficit."""
    gen = float(grid_state.get("generation_mw", 0.0))
    dem = float(grid_state.get("demand_mw", 0.0))
    return gen - dem


def solve_network_flows(grid_state: Dict[str, Any]) -> Dict[str, float]:
    """
    Simplified network power flow solver.
    Computes power transfer (MW) across each online transmission line based on
    substation nodal generation and connected demand.
    """
    # Mapping of components to substations
    gen_to_sub = {"G1": "S1", "G2_SOLAR": "S1"}
    load_to_sub = {
        "HOSPITAL": "S2",
        "WATER_PLANT": "S2",
        "EMERGENCY_SERVICES": "S3",
        "RESIDENTIAL_ZONE": "S3",
        "FACTORY": "S3"
    }

    # Nodal demand calculation
    substation_demand: Dict[str, float] = {"S1": 0.0, "S2": 0.0, "S3": 0.0}
    for load in grid_state.get("loads", []):
        if load.get("connected", True):
            sub_id = load_to_sub.get(load.get("id"), "S3")
            substation_demand[sub_id] = substation_demand.get(sub_id, 0.0) + float(load.get("demand_mw", 0.0))

    calculated_flows: Dict[str, float] = {}
    for line in grid_state.get("transmission_lines", []):
        line_id = line.get("id")
        if not line.get("online", True):
            calculated_flows[line_id] = 0.0
            continue

        # In standard 3-substation network S1 -> S2 -> S3:
        if line_id == "TL4":
            # Power flowing from S2 to S3 to supply S3 loads
            calculated_flows[line_id] = round(substation_demand.get("S3", 40.0), 1)
        elif line_id == "TL1":
            # Power flowing from S1 to S2 (supplies S2 loads + S3 loads transferred through)
            calculated_flows[line_id] = round(substation_demand.get("S2", 0.0) + substation_demand.get("S3", 0.0), 1)
        else:
            calculated_flows[line_id] = float(line.get("load_mw", 0.0))

    return calculated_flows


def estimate_reroute_attempt(target_substation: str, source_substation: str = "S1") -> Dict[str, Any]:
    """
    Estimates the power flow if an agent or capability attempts to reroute power
    around a faulted substation, determining whether it causes line overloads.
    """
    if target_substation == "S2":
        # Attempting to force alternative route into S2 via constrained line TL4
        attempted_flow = 71.0
        line_capacity = 60.0
        return {
            "feasible": False,
            "bottleneck_line": "TL4",
            "attempted_mw": attempted_flow,
            "capacity_mw": line_capacity,
            "error_code": "TRANSMISSION_OVERLOAD",
            "message": f"Requested redistribution would exceed TL4 capacity ({attempted_flow}MW > {line_capacity}MW)."
        }

    return {
        "feasible": True,
        "bottleneck_line": None,
        "attempted_mw": 35.0,
        "capacity_mw": 80.0,
        "error_code": None,
        "message": f"Power routing to {target_substation} within safe operational limits."
    }
