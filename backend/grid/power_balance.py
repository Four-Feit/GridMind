"""
Power Balance Calculations (Owned by P2)
"""
from typing import Any, Dict


def calculate_power_deficit(grid_state: Dict[str, Any]) -> float:
    gen = grid_state.get("generation_mw", 0.0)
    dem = grid_state.get("demand_mw", 0.0)
    return max(0.0, dem - gen)
