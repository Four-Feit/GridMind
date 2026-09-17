# GridMind Testing Strategy

> **Rule 8**: All modules must be testable independently.
> P1 tests the Agent Core with fake tools.
> P2 tests the simulator without LLM.
> P3 tests capabilities with mock states.
> P4 tests the UI with mock WebSocket events.

---

## 1. Test Levels & CLI Commands

### Level 1: Unit Tests

Run all unit tests:
```bash
python -m pytest backend/tests/unit -v
```

Run with coverage report:
```bash
python -m pytest --cov=backend backend/tests/unit
```

- **P1 Unit Tests (`backend/tests/unit/test_agent_core.py`)**:
  - Validates action parser, schema validator, plan invalidation, and recovery loop using `FakeLLM` and mock capabilities.
- **P2 Unit Tests (`backend/tests/unit/test_simulator.py`)**:
  - Validates power balance math, substation isolation, load disconnection, and line capacity constraints.
- **P3 Unit Tests (`backend/tests/unit/test_capabilities.py`)**:
  - Validates `GridAnalyzer`, `RedistributionEngine` (and its expected failure output), `PriorityLoadManager`, and `BatteryEngine`.
- **P4 Unit Tests (`backend/tests/unit/test_api.py`)**:
  - Validates FastAPI endpoint response schemas and WebSocket connection handshakes.

---

### Level 2: Integration Tests

Run cross-module integration tests:
```bash
python -m pytest backend/tests/integration -v
```

- **Milestone 1: Agent + Simulator (`test_agent_simulator.py`)**:
  - Verifies P1 `Observer` fetches and parses real P2 `GridSimulator` state.
- **Milestone 2: Agent + Capabilities + Simulator (`test_integration.py`)**:
  - Verifies full flow: Substation fails $\to$ Agent selects failing tool $\to$ catches failure $\to$ replans to Priority Manager $\to$ satisfies hospital load.

---

### Level 3: Non-Hardcoded Routing Test

Verifies Rule 6 (No hardcoded tool routing):
```bash
python -m pytest backend/tests/unit/test_agent_core.py -k "test_dynamic_routing"
```
- Tests that the same agent controller produces different actions under varying grid states and when certain tools are disabled/unavailable.

---

## 2. Frontend (P4) Testing & Mock WebSocket

Frontend tests ensure the dashboard behaves correctly under live event streams without needing the backend running.

### Testing with Mock WebSocket:
P4 can run a local test script or mock WebSocket feed:
```bash
python -c "
import asyncio, websockets, json, time

async def mock_feed():
    async with websockets.connect('ws://localhost:8000/ws') as ws:
        event = {
            'channel': 'agent_events',
            'timestamp': time.time(),
            'payload': {
                'type': 'TOOL_FAILED',
                'plan_id': 1,
                'tool': 'redistribution_engine',
                'message': 'TL4 overload'
            }
        }
        await ws.send(json.dumps(event))
asyncio.run(mock_feed())
"
```

### Component Testing:
- Verify Grid SVG renders offline substations in red.
- Verify Event Log auto-scrolls when new `AgentEvent` arrives.
- Verify Chaos buttons send correct REST payloads to `POST /chaos/event`.
