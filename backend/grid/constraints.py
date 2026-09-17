"""
Grid Constraints (Owned by P2)
"""
from typing import Any, Dict, List


def check_transmission_limits(grid_state: Dict[str, Any]) -> List[str]:
    """Verify that transmission lines do not exceed thermal limits and offline lines carry no load."""
    violations = []
    for line in grid_state.get("transmission_lines", []):
        line_id = line.get("id")
        load_mw = float(line.get("load_mw", 0.0))
        capacity_mw = float(line.get("capacity_mw", 0.0))
        is_online = line.get("online", True)

        if load_mw > capacity_mw:
            violations.append(
                f"Line {line_id} overloaded: {load_mw:.1f}MW exceeds capacity of {capacity_mw:.1f}MW"
            )
        if not is_online and load_mw > 0.0:
            violations.append(
                f"Line {line_id} is offline but carrying {load_mw:.1f}MW load"
            )
    return violations


def check_critical_loads(grid_state: Dict[str, Any]) -> List[str]:
    """Verify that all critical loads have full power and are connected."""
    violations = []
    for load in grid_state.get("loads", []):
        if load.get("priority") == "critical":
            load_id = load.get("id")
            demand_mw = float(load.get("demand_mw", 0.0))
            supplied_mw = float(load.get("supplied_mw", 0.0))
            is_connected = load.get("connected", True)

            if not is_connected:
                violations.append(f"Critical facility {load_id} is disconnected")
            elif supplied_mw < demand_mw:
                deficit = demand_mw - supplied_mw
                violations.append(
                    f"Critical facility {load_id} has power deficit: supplied {supplied_mw:.1f}MW < demand {demand_mw:.1f}MW (deficit {deficit:.1f}MW)"
                )
    return violations


def check_battery_limits(grid_state: Dict[str, Any]) -> List[str]:
    """Verify that battery storage operates within physical and operational boundaries."""
    violations = []
    battery = grid_state.get("battery")
    if battery:
        remaining = float(battery.get("remaining_mwh", 0.0))
        capacity = float(battery.get("capacity_mwh", 0.0))

        if remaining < 0.0:
            violations.append(f"Battery remaining capacity negative: {remaining:.1f}MWh")
        elif remaining > capacity:
            violations.append(f"Battery storage overfilled: {remaining:.1f}MWh > {capacity:.1f}MWh")
    return violations


def check_all_constraints(grid_state: Dict[str, Any]) -> Dict[str, List[str]]:
    """Evaluates all physical and operational constraints, returning violations grouped by category."""
    return {
        "transmission_violations": check_transmission_limits(grid_state),
        "critical_load_violations": check_critical_loads(grid_state),
        "battery_violations": check_battery_limits(grid_state),
    }
