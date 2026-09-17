# GridMind Demo Scenario

## Rehearsed Deterministic Demo Flow

1. **Mission Start**
   - Goal: "Maintain power to critical facilities"
   - Dashboard shows: Initial stable grid (Generation: 180MW, Demand: 150MW, Battery: 80MWh).

2. **Chaos Event 1 - Substation Failure**
   - User triggers: `FAIL S2`
   - S2 offline, Hospital disconnected.
   - Agent observes affected critical hospital load.

3. **Tool Selection & Capability Failure**
   - Planner proposes: `redistribution_engine`
   - Capability execution fails: `TRANSMISSION_OVERLOAD` on TL4.
   - Event: `TOOL_FAILED`, `PLAN_INVALIDATED`.

4. **Agent Recovers & Replans**
   - Failure fed into planner context without hardcoded routing.
   - Planner proposes: `priority_load_manager`
   - Non-critical loads shed, hospital power restored.

5. **Chaos Event 2 - Weather Deterioration**
   - Solar drops from 40MW to 10MW.
   - Generation deficit detected.
   - Agent selects: `battery_engine`
   - Battery discharges to maintain hospital stability.

6. **Final Validation**
   - Deterministic verification of critical loads, line limits, isolated faults, battery limits.
   - Dashboard: `MISSION COMPLETE`.
