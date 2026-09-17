# GridMind Demo Scenario

> **Purpose**: A deterministic, rehearsed storyline to demonstrate autonomous planning, tool failure, recovery, and code-verified mission completion during the presentation.

---

## Complete Demo Sequence & Quantitative Checkpoints

```mermaid
journey
    title 6-Step Rehearsed Demo Sequence
    section 1. Mission Start
      Dashboard online: 5: Operator
      Mission initialized: 5: Agent
    section 2. Outage Injected
      Trigger Substation S2 Failure: 1: Operator
      Hospital disconnected: 1: Simulator
    section 3. Tool Failure
      Reroute power via Redistribution: 2: Agent
      TL4 Overload (71MW > 60MW): 1: Capability
    section 4. Dynamic Recovery
      Invalidate Plan #1: 4: Agent
      Shed Factory load (45MW) & restore Hospital (30MW): 5: Agent
    section 5. Weather Shock
      Solar drops (40MW to 10MW): 2: Operator
      Discharge Battery (20MW): 5: Agent
    section 6. Final Verification
      Verify all constraints: 5: Validator
      Mission Complete: 5: Dashboard
```

---

### Step 1: Mission Start
- **Operator Action**: Click "Start Mission" on Dashboard.
- **HTTP Request**:
  ```http
  POST /mission/start HTTP/1.1
  Content-Type: application/json

  {
    "goal": "Maintain power to critical facilities"
  }
  ```
- **Initial Grid State Checkpoint**:
  - Generation: `180.0 MW` (G1: 90MW, G2: 90MW)
  - Demand: `140.0 MW` (Hospital: 30MW, Water Plant: 25MW, Factory: 45MW, Residential: 40MW)
  - Battery: `80.0 MWh` remaining (max output: 40MW)
  - Status: Grid Stable, all loads supplied.

---

### Step 2: Chaos Event 1 — Substation Failure
- **Operator Action**: Click "Fail Substation S2" in Chaos Panel.
- **HTTP Request**:
  ```http
  POST /chaos/event HTTP/1.1
  Content-Type: application/json

  {
    "event_type": "SUBSTATION_FAILURE",
    "target": "S2"
  }
  ```
- **Quantitative Effect**:
  - `substations[S2].online = false`
  - `loads[HOSPITAL].connected = false`
  - Hospital Supplied Power drops: `30.0 MW -> 0.0 MW`
  - Agent observes critical load deficit.

---

### Step 3: Capability Selection & Realistic Failure
- **Agent Action**: Planner (LLM) selects `redistribution_engine`.
- **Tool Arguments**: `{"target_substation": "S2"}`
- **Capability Failure Response**:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "TRANSMISSION_OVERLOAD",
      "message": "Requested redistribution would exceed TL4 capacity.",
      "details": {
        "line": "TL4",
        "attempted_mw": 71.0,
        "capacity_mw": 60.0
      }
    }
  }
  ```
- **Events Emitted**:
  - `TOOL_FAILED` (tool: `redistribution_engine`)
  - `PLAN_INVALIDATED` (plan_id: 1)

---

### Step 4: Autonomous Recovery & Replanning
- **Agent Action**: Recovery engine injects failure into memory without hardcoded routing.
- **New Tool Selected**: `priority_load_manager`
- **Tool Arguments**: `{"protect_critical": true}`
- **Quantitative State Transition**:
  - `loads[FACTORY].connected = false` (Sheds 45.0 MW)
  - `loads[HOSPITAL].connected = true` (Supplies 30.0 MW)
  - Hospital power restored to `30.0 MW / 30.0 MW`.
  - Event Emitted: `TOOL_SUCCESS`

---

### Step 5: Chaos Event 2 — Weather Deterioration
- **Operator Action**: Click "Trigger Solar Storm / Weather Drop" in Chaos Panel.
- **HTTP Request**:
  ```http
  POST /chaos/event HTTP/1.1
  Content-Type: application/json

  {
    "event_type": "WEATHER_DETERIORATION",
    "target": "G2_SOLAR",
    "params": {
      "drop_mw": 30.0
    }
  }
  ```
- **Quantitative Effect**:
  - Generator `G2_SOLAR` output drops: `40.0 MW -> 10.0 MW` (Generation deficit of 30.0 MW)
  - Agent observes generation drop.
- **Agent Reaction**:
  - Planner selects `battery_engine`.
  - Arguments: `{"power_mw": 20.0, "duration_minutes": 15.0}`
  - Battery discharges `20.0 MW`, stabilizing the critical margin.

---

### Step 6: Code-Verified Mission Completion
- **Validator Execution**: Ground truth code confirms:
  $$\text{hospital.supplied} \ge \text{hospital.demand}$$
  $$\text{water\_plant.supplied} \ge \text{water\_plant.demand}$$
  $$\text{all active line loads} \le \text{capacities}$$
- **Final Event Emitted**: `MISSION_COMPLETED`
- **Dashboard Displays**:
  - Plans Created: `3`
  - Replans Triggered: `2`
  - Tool Failures Caught: `1`
  - Critical Loads Restored: `100%`
