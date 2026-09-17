# P4: Integration, FastAPI Layer, WebSocket Streaming & Cinematic UI

This document details the architecture, contracts, run instructions, and testing strategy for **P4 (The Window)** in GridMind.

---

## 1. P4 Ownership & Boundaries

In accordance with GridMind architectural contracts:
- **P4 Owns**:
  - `backend/api/` (API routes, WebSocket streaming manager, and integration service adapter)
  - `frontend/` (React 19 + Vite cinematic control-room user interface)
  - `backend/tests/integration/test_p4_api.py` (P4 integration test suite)
  - `docs/p4-integration.md` (Integration documentation)
- **P4 Does NOT Modify**:
  - P1 Agent Core, memory, planner, or decision-making logic.
  - P2 Grid Simulator models, physical law constraints, or power balance logic.
  - P3 Capability implementations or safety schemas.
  - No hardcoded routing rules or direct frontend-to-simulator state mutations.

---

## 2. Architecture & Real-Time Telemetry Bridge

```text
+-------------------------------------------------------------+
|                      Browser UI (P4)                        |
|  - Landing Page ("Build the Brain, Not the Puppet")         |
|  - PowerGridVisualizer (Topology, flow, fault highlights)   |
|  - AgentBrainPanel (Observe -> Plan -> Execute -> Recovery) |
|  - EventTimeline (Filterable chronological execution trace) |
|  - ChaosControlPanel (Substation trip, storm, surge)       |
+-------------------------------------------------------------+
            ▲ HTTP (REST)                  ▲ WebSocket (/ws)
            │                              │
+-------------------------------------------------------------+
|                     FastAPI Layer (P4)                      |
|  - backend/api/routes.py                                    |
|  - backend/api/websocket.py (ConnectionManager + Broadcast) |
|  - backend/api/service.py (GridMindService Adapter)         |
+-------------------------------------------------------------+
            │                              ▲
            ▼                              │
+-------------------------------------------------------------+
|                    GridMind Core (P1)                       |
|   AgentController -> Planner -> Registry -> EventBus        |
+-------------------------------------------------------------+
            │ ToolCall                     ▲ GridState
            ▼                              │
+-----------------------+      +------------------------------+
|   Capabilities (P3)   | ───> |      Grid Simulator (P2)     |
|  RedistributionEngine |      |  Generators, Lines (TL1,TL4) |
|  PriorityLoadManager  |      |  Substations, Critical Loads |
|  BatteryEngine        |      +------------------------------+
+-----------------------+
```

### Event Streaming
- Whenever any component emits an `AgentEvent` on `EventBus`, the P4 `GridMindService` callback intercepts the event, snapshots the physical `GridState`, and broadcasts it asynchronously to all connected WebSocket clients via `/ws`.
- Automatic reconnection and heartbeat ping/pong (`{"action": "ping"}`) ensure bulletproof connection stability.

---

## 3. Shared Contracts Used

1. **`GridState` (P2 Contract)**:
   - `generators`: `[{ id, capacity_mw, available_mw, online }]`
   - `substations`: `[{ id, online }]`
   - `transmission_lines`: `[{ id, from, to, capacity_mw, load_mw, online }]`
   - `loads`: `[{ id, demand_mw, supplied_mw, priority: 'critical'|'normal', connected }]`
   - `battery`: `{ id, capacity_mwh, remaining_mwh, max_output_mw, online }`
   - `failures`: List of active physical fault descriptions.

2. **`AgentEvent` (P1 Contract)**:
   - `timestamp`: Unix timestamp (float)
   - `type`: `MISSION_STARTED`, `OBSERVATION`, `PLAN_CREATED`, `TOOL_SELECTED`, `TOOL_SUCCESS`, `TOOL_FAILED`, `REPLAN_STARTED`, `VALIDATION_PASSED`, `MISSION_COMPLETED`, `CHAOS_EVENT`
   - `plan_id`: Integer plan version counter
   - `tool`: Capability name (e.g. `redistribution_engine`, `priority_load_manager`)
   - `message`: Human-readable explanation
   - `data`: Structured dictionary containing arguments, results, or error details

3. **`MissionState` (P1 Contract)**:
   - `mission_id`, `goal`, `status` (`IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`, `FAILED`), `plan_id`, `observation_count`, `previous_failures`, `known_constraints`, `critical_loads`

---

## 4. How to Run the Application

### A. Start the Backend API
```powershell
# From the repository root
py -3.12 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI server will be available at:
- HTTP API: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- WebSocket Feed: `ws://127.0.0.1:8000/ws`

### B. Start the Frontend
```powershell
# In a new terminal window
cd frontend
npm run dev
```
The cinematic control room will open at:
- Web App: `http://127.0.0.1:5173/`

---

## 5. Mock Mode for Development & Presentation

If running without the Python backend, the UI includes a **Mock Mode**:
- Toggle it anytime via the `LIVE STREAM` / `MOCK MODE` button in the top navbar.
- In Mock Mode, the UI plays out the complete deterministic demo flow:
  1. Initial stable grid (180MW Generation, 150MW Demand).
  2. S2 substation offline fault injection -> Hospital disconnected.
  3. LLM plans `redistribution_engine` -> Fails with `TRANSMISSION_OVERLOAD` on line TL4 (71MW > 60MW).
  4. Dynamic recovery triggered -> LLM learns TL4 constraint into memory.
  5. LLM replans to `priority_load_manager` -> Sheds Factory, restores Hospital.
  6. Final validation passes -> Mission completed.

---

## 6. How to Run Integration Tests

Run the full pytest suite:
```powershell
py -3.12 -m pytest
```
Run only P4 integration tests:
```powershell
py -3.12 -m pytest backend/tests/integration/test_p4_api.py -v
```

Tests verify:
1. `GET /`: API healthcheck.
2. `GET /grid/state`: Simulator state conforms to `GridState` contract.
3. `GET /agent/state`: Agent internal state and mission progress.
4. `GET /capabilities`: Tool registry schemas for all registered capabilities.
5. `POST /chaos/event`: Substation S2 fault injection and downstream hospital disconnection.
6. `POST /mission/start` & `POST /mission/step`: Step-by-step cycle execution, tool failure handling, and replan progression.
7. `POST /mission/stop` & `POST /mission/reset`: Clean state resets.
8. `WS /ws`: WebSocket handshake, ping/pong, and event streaming.
