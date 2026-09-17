# GridMind Shared Contracts (Single Source of Truth)

## Contract Matrix

| Contract | Owner | Consumers |
|---|---|---|
| GridState | P2 | P1, P3, P4 |
| CapabilitySpec | P3/P1 | P1, P4 |
| ToolCall | P1 | P1, P3 |
| ToolResult | P3 | P1, P4 |
| AgentEvent | P1 | P4 |
| MissionState | P1 | P4 |
| ChaosEvent | P2/P4 | P2, P1 |
| ValidationResult | P3 | P1, P4 |

---

## 1. GridState (Owner: P2)
```json
{
  "timestamp": 1720000000,
  "generation_mw": 180,
  "demand_mw": 150,
  "generators": [
    {
      "id": "G1",
      "capacity_mw": 100,
      "available_mw": 90,
      "online": true
    }
  ],
  "substations": [
    {
      "id": "S1",
      "online": true
    },
    {
      "id": "S2",
      "online": false
    }
  ],
  "transmission_lines": [
    {
      "id": "TL4",
      "capacity_mw": 60,
      "load_mw": 40,
      "online": true
    }
  ],
  "loads": [
    {
      "id": "HOSPITAL",
      "demand_mw": 30,
      "supplied_mw": 30,
      "priority": "critical",
      "connected": true
    }
  ],
  "battery": {
    "id": "B1",
    "capacity_mwh": 100,
    "remaining_mwh": 70,
    "max_output_mw": 40,
    "online": true
  },
  "failures": []
}
```

---

## 2. ToolCall (Owner: P1)
```json
{
  "action": "battery_engine",
  "arguments": {
    "power_mw": 20,
    "duration_minutes": 10
  },
  "reason": "Current generation is insufficient to maintain critical loads."
}
```

---

## 3. ToolResult (Owner: P3)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TRANSMISSION_OVERLOAD",
    "message": "TL4 exceeds its maximum capacity.",
    "details": {
      "line": "TL4",
      "load_mw": 71,
      "capacity_mw": 60
    }
  }
}
```

---

## 4. AgentEvent (Owner: P1)
```json
{
  "timestamp": 1720000000.123,
  "type": "TOOL_FAILED",
  "plan_id": 3,
  "tool": "redistribution_engine",
  "message": "TL4 overload",
  "data": {}
}
```

---

## 5. MissionState (Owner: P1)
```json
{
  "mission_id": "mission-001",
  "goal": "Maintain power to critical facilities",
  "status": "RUNNING",
  "plan_id": 3,
  "observation_count": 12,
  "previous_failures": [
    "redistribution_engine"
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
