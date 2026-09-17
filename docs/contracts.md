# GridMind Shared Contracts (Single Source of Truth)

> **Important**: This document represents the frozen contract across all 4 team members.
> No individual member may change field names or schemas without team agreement.

---

## Contract Matrix & Ownership

| Contract | Owner | Consumers | Description |
|---|---|---|---|
| **GridState** | P2 | P1, P3, P4 | Current world snapshot from simulator |
| **CapabilitySpec** | P3 / P1 | P1, P4 | Capability metadata and JSON Schema |
| **ToolCall** | P1 | P1, P3 | Structured action output from Planner / LLM |
| **ToolResult** | P3 | P1, P4 | Execution outcome returned by each capability |
| **AgentEvent** | P1 | P4 | Event stream for dashboard and WebSocket |
| **MissionState** | P1 | P4 | Current mission progress and lineage |
| **ValidationResult**| P3 | P1, P4 | Ground truth safety verification output |
| **ChaosEvent** | P2 / P4 | P2, P1 | Outage and environmental stress events |

---

## 1. Contract: GridState (Owner: P2)
Returned by `simulator.get_state()`.

```json
{
  "timestamp": 1720000000.0,
  "generation_mw": 180.0,
  "demand_mw": 150.0,
  "generators": [
    {
      "id": "G1",
      "type": "generator",
      "capacity_mw": 100.0,
      "available_mw": 90.0,
      "online": true
    },
    {
      "id": "G2",
      "type": "generator",
      "capacity_mw": 100.0,
      "available_mw": 90.0,
      "online": true
    }
  ],
  "substations": [
    {
      "id": "S1",
      "type": "substation",
      "online": true
    },
    {
      "id": "S2",
      "type": "substation",
      "online": false
    }
  ],
  "transmission_lines": [
    {
      "id": "TL4",
      "from": "S2",
      "to": "S3",
      "capacity_mw": 60.0,
      "load_mw": 40.0,
      "online": true
    }
  ],
  "loads": [
    {
      "id": "HOSPITAL",
      "type": "hospital",
      "demand_mw": 30.0,
      "supplied_mw": 30.0,
      "priority": "critical",
      "connected": true
    },
    {
      "id": "FACTORY",
      "type": "industrial",
      "demand_mw": 45.0,
      "supplied_mw": 45.0,
      "priority": "normal",
      "connected": true
    }
  ],
  "battery": {
    "id": "B1",
    "capacity_mwh": 100.0,
    "remaining_mwh": 70.0,
    "max_output_mw": 40.0,
    "online": true
  },
  "failures": ["Substation S2 offline"]
}
```

---

## 2. Contract: CapabilitySpec (Owner: P3 / P1)
Returned by `capability.input_schema()` and `registry.describe_all()`.

```json
{
  "name": "battery_engine",
  "description": "Use stored energy to compensate for temporary generation deficit.",
  "input_schema": {
    "type": "object",
    "properties": {
      "power_mw": {
        "type": "number",
        "description": "Megawatts of power to discharge"
      },
      "duration_minutes": {
        "type": "number",
        "description": "Discharge duration in minutes"
      }
    },
    "required": ["power_mw"]
  }
}
```

---

## 3. Contract: ToolCall (Owner: P1)
Produced by the LLM Planner and validated by `ActionValidator`.

```json
{
  "action": "battery_engine",
  "arguments": {
    "power_mw": 20.0,
    "duration_minutes": 10.0
  },
  "reason": "Current generation is insufficient to maintain critical loads."
}
```

---

## 4. Contract: ToolResult (Owner: P3)
Returned by `capability.execute(state, arguments)`.

### 4A. Success Case:
```json
{
  "success": true,
  "data": {
    "served": ["HOSPITAL", "WATER_PLANT"],
    "shed": ["FACTORY"]
  },
  "error": null
}
```

### 4B. Failure Case (Must be structured, never uncaught exceptions):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TRANSMISSION_OVERLOAD",
    "message": "TL4 exceeds its maximum capacity.",
    "details": {
      "line": "TL4",
      "attempted_mw": 71.0,
      "capacity_mw": 60.0
    }
  }
}
```

---

## 5. Contract: AgentEvent (Owner: P1)
Emitted by `EventBus` and broadcast via WebSocket to P4's Dashboard.

```json
{
  "timestamp": 1720000000.123,
  "type": "TOOL_FAILED",
  "plan_id": 3,
  "tool": "redistribution_engine",
  "message": "Tool redistribution_engine failed: TL4 overload",
  "data": {
    "line": "TL4",
    "attempted_mw": 71.0,
    "capacity_mw": 60.0
  }
}
```

### Standard Event Types:
- `MISSION_STARTED`
- `OBSERVATION`
- `PLAN_CREATED`
- `TOOL_SELECTED`
- `TOOL_STARTED`
- `TOOL_SUCCESS`
- `TOOL_FAILED`
- `TOOL_REJECTED`
- `PLAN_INVALIDATED`
- `REPLAN_STARTED`
- `VALIDATION_STARTED`
- `VALIDATION_PASSED`
- `VALIDATION_FAILED`
- `MISSION_COMPLETED`
- `MISSION_FAILED`
- `CHAOS_EVENT`

---

## 6. Contract: MissionState (Owner: P1)
Maintained by P1's `StateManager`. Source of truth for mission progress.

```json
{
  "mission_id": "mission-001",
  "goal": "Maintain power to critical facilities",
  "status": "RUNNING",
  "plan_id": 3,
  "observation_count": 12,
  "previous_failures": [
    "redistribution_engine: TL4 overloaded"
  ],
  "known_constraints": [
    "TL4 capacity 60MW"
  ],
  "critical_loads": [
    "HOSPITAL",
    "WATER_PLANT",
    "EMERGENCY_SERVICES"
  ]
}
```

---

## 7. Contract: ValidationResult (Owner: P3)
Returned by `validator.validate(grid_state)`. Verified by deterministic code, not LLM.

```json
{
  "valid": false,
  "reason": "Critical loads not fully supplied: ['HOSPITAL']",
  "details": {
    "failed_critical_loads": ["HOSPITAL"]
  }
}
```

---

## 8. Contract: ChaosEvent (Owner: P2 / P4)
Injected via API `/chaos/event` to alter the environment independently.

```json
{
  "event_type": "SUBSTATION_FAILURE",
  "target": "S2",
  "params": {}
}
```
Supported event types:
- `SUBSTATION_FAILURE`
- `TRANSMISSION_FAILURE`
- `GENERATOR_FAILURE`
- `WEATHER_DETERIORATION`
- `DEMAND_SPIKE`
- `BATTERY_DEPLETION`
