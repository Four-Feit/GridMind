# GridMind API & WebSocket Reference (Owned by P4)

This document provides the complete API specification for FastAPI and WebSocket communications.

---

## 1. REST API Endpoints

Base URL: `http://localhost:8000`

### 1.1 Start Mission
Starts a new autonomous agent mission.

- **Method**: `POST`
- **Path**: `/mission/start`
- **Request Body**:
  ```json
  {
    "goal": "Maintain power to critical facilities"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "status": "started",
    "goal": "Maintain power to critical facilities"
  }
  ```

---

### 1.2 Inject Chaos Event
Injects a manual disturbance into the simulated environment (operated via P4 Dashboard).

- **Method**: `POST`
- **Path**: `/chaos/event`
- **Request Body**:
  ```json
  {
    "event_type": "SUBSTATION_FAILURE",
    "target": "S2",
    "params": {}
  }
  ```
- **Supported Event Types**:
  - `SUBSTATION_FAILURE`: Disconnects target substation and downstream loads.
  - `TRANSMISSION_FAILURE`: Takes target transmission line offline.
  - `GENERATOR_FAILURE`: Reduces or cuts generator output.
  - `WEATHER_DETERIORATION`: Reduces solar / renewable generation.
  - `DEMAND_SPIKE`: Increases demand on a specific load zone.
  - `BATTERY_DEPLETION`: Drops battery remaining energy.
- **Response** (`200 OK`):
  ```json
  {
    "status": "injected",
    "event": {
      "event_type": "SUBSTATION_FAILURE",
      "target": "S2"
    }
  }
  ```

---

### 1.3 Query Grid State
Fetches the current physical state of the grid.

- **Method**: `GET`
- **Path**: `/grid/state`
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "state": {
      "timestamp": 1720000000.0,
      "generation_mw": 180.0,
      "demand_mw": 150.0,
      "generators": [],
      "substations": [],
      "transmission_lines": [],
      "loads": [],
      "battery": {},
      "failures": []
    }
  }
  ```

---

### 1.4 Query Agent State
Fetches the current mission state, active plan, and failure memory.

- **Method**: `GET`
- **Path**: `/agent/state`
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "agent": {
      "mission_id": "mission-001",
      "goal": "Maintain power to critical facilities",
      "status": "RUNNING",
      "plan_id": 3,
      "observation_count": 12,
      "previous_failures": ["redistribution_engine: TL4 overloaded"]
    }
  }
  ```

---

## 2. WebSocket Protocol

- **Endpoint**: `ws://localhost:8000/ws`
- **Protocol**: Bidirectional JSON stream

### Incoming Messages to Frontend (Server $\to$ Client)
All messages are wrapped in a standard JSON envelope:
```json
{
  "channel": "agent_events",
  "timestamp": 1720000000.123,
  "payload": {
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
}
```

### Channels:
1. `agent_events`: Real-time lifecycle events emitted by P1 (`PLAN_CREATED`, `TOOL_SELECTED`, `TOOL_SUCCESS`, `TOOL_FAILED`, `PLAN_INVALIDATED`, `REPLAN_STARTED`, `MISSION_COMPLETED`).
2. `grid_updates`: Environment snapshots emitted whenever simulator state updates.
