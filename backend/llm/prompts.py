"""
LLM Prompt Templates & Context Formatters (Owned by P1)
"""
import json
from typing import Any, Dict

SYSTEM_PROMPT = """You are the autonomous decision-making core of GridMind, operating an electrical power grid.
Your mission is to maintain uninterrupted power to critical facilities (hospitals, water plants, emergency services) while respecting line transmission capacities and physical constraints.

Rules of Engagement:
1. Review the current grid state: observe online generators, offline substations, line loads, and unserved critical loads.
2. Review available capabilities: you can ONLY select tools that appear in the 'available_capabilities' list.
3. Review previous failures & constraints: NEVER repeat an action that previously failed under the same conditions. Adapt your strategy.
4. Reason quantitatively:
   - If a critical facility is disconnected due to a substation failure, attempt alternative rerouting or priority load shedding.
   - If generation drops below demand (deficit), consider discharging the battery or shedding non-critical loads.
   - Respect known transmission limits (e.g., line capacities).
5. Output Format:
   Return ONLY a valid JSON object matching this exact schema:
   {
     "action": "<tool_name>",
     "arguments": { <key>: <value> },
     "reason": "<one sentence explaining why this tool was chosen>"
   }
Do NOT wrap your response with conversational text. Return only the JSON object.
"""


def format_planner_prompt(context: Dict[str, Any]) -> str:
    """
    Formats the dynamic prompt payload for the LLM planner.
    """
    grid = context.get("grid_state", {})
    gen_mw = grid.get("generation_mw", 0.0)
    dem_mw = grid.get("demand_mw", 0.0)
    margin = gen_mw - dem_mw

    loads_summary = []
    for l in grid.get("loads", []):
        status = "CONNECTED" if l.get("connected", True) else "DISCONNECTED"
        loads_summary.append(
            f"- {l.get('id')} ({l.get('priority')}): demand={l.get('demand_mw')}MW, supplied={l.get('supplied_mw')}MW [{status}]"
        )

    failures_summary = context.get("previous_failures", [])
    constraints_summary = context.get("known_constraints", [])

    return f"""MISSION GOAL: {context.get('goal', 'Maintain power to critical facilities')}

GRID TELEMETRY SNAPSHOT:
- Total Generation: {gen_mw:.1f} MW
- Total Demand: {dem_mw:.1f} MW
- Power Margin: {margin:+.1f} MW ({'Surplus' if margin >= 0 else 'DEFICIT'})
- Active Failures: {grid.get('failures', [])}

LOADS STATUS:
{chr(10).join(loads_summary) if loads_summary else "No loads listed."}

AVAILABLE CAPABILITIES:
{json.dumps(context.get('available_capabilities', []), indent=2)}

WORKING MEMORY & CONSTRAINTS:
- Past Failures in this Mission: {json.dumps(failures_summary)}
- Discovered Environmental Constraints: {json.dumps(constraints_summary)}
- Recent Actions: {json.dumps(context.get('recent_actions', []))}

Select the single best capability to execute next."""
