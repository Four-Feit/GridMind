"""
Grid Constraints (Owned by P2)
"""
from typing import Any, Dict, List


def check_transmission_limits(grid_state: Dict[str, Any]) -> List[str]:
    violations = []
    for line in grid_state.get("transmission_lines", []):
        if line.get("load_mw", 0) > line.get("capacity_mw", 0):
            violations.append(f"Line {line.get('id')} overloaded: {line.get('load_mw')}MW > {line.get('capacity_mw')}MW")
    return violations
