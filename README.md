[GridMind_Team_README.md](https://github.com/user-attachments/files/32345243/GridMind_Team_README.md)# GridMind - Build the Brain, Not the Puppet

> A from-scratch mini agent framework for autonomous planning, tool selection, execution, observation, recovery, and replanning inside a simulated power-grid environment.

---

## 1. Project Overview

GridMind is a Track 2 project built around one core idea:

**Do not hide the agent logic behind an agent framework. Build the agent loop ourselves.**

The LLM is not the whole agent. The LLM is the decision-making component inside our system.

Our own framework is responsible for:

- receiving a mission
- observing the current environment
- maintaining state
- exposing available capabilities to the planner
- asking the LLM to choose an action
- validating the requested action
- executing the selected capability
- recording the result
- observing the changed environment
- validating whether the mission state is still safe
- recovering from failed actions
- invalidating bad plans
- replanning
- deciding when the mission is complete

The environment is a simplified power-grid simulation. It contains generators, substations, transmission lines, loads, critical facilities, battery storage, failures, weather changes, demand changes, and capacity constraints.

The key demonstration is:

```text
Goal
  ->
Observe
  ->
Plan
  ->
Select tool
  ->
Validate action
  ->
Execute
  ->
Observe result
  ->
Validate world
  ->
If failure: recover + replan
  ->
Repeat
```

The most important feature is that the agent must **choose among multiple tools dynamically**. We must not hardcode rules such as:

```python
if substation_failed:
    use_redistribution()
```

The LLM receives the current state and the available capabilities and selects the action. The framework then validates and executes that action.

---

# 2. What We Are Actually Building

We are building three things at the same time:

## 2.1 The GridMind Agent Framework

This is our custom framework.

It contains:

- Agent Controller
- Planner
- LLM Adapter
- State Manager
- Capability Registry
- Action Validator
- Executor
- Observation Manager
- Memory
- Recovery Engine
- Outcome Validator
- Event/Trace system

## 2.2 The Grid Environment

This is the simulated world in which the agent operates.

It contains:

- generators
- substations
- transmission lines
- loads
- critical facilities
- batteries
- grid constraints
- outages
- weather changes
- demand spikes
- environment events

## 2.3 The Demo Interface

This exposes the internal process.

It should show:

- live grid
- current grid state
- agent observation
- current plan
- selected tool
- tool result
- failure
- replan event
- final validation
- mission status
- metrics
- chaos-mode controls

---

# 3. Team Structure

We have four members.

| Member | Owns | Main Responsibility |
|---|---|---|
| P1 | Agent Framework | Core loop, planner, state, registry, executor, recovery |
| P2 | Environment | Grid simulator, entities, constraints, events, state transitions |
| P3 | Capabilities | Tools, tool schemas, failure behavior, outcome validation |
| P4 | Integration + UI | FastAPI, WebSocket events, dashboard, integration testing |

The split is intentional.

P1 owns **how the agent thinks and acts**.

P2 owns **what the world looks like and how it changes**.

P3 owns **what actions the agent can perform**.

P4 owns **how everything is exposed, integrated, observed, and demonstrated**.

---

# 4. Non-Negotiable Architecture Rules

These rules are more important than individual features.

## Rule 1 - The Agent Core owns orchestration

Only P1's Agent Core decides what happens next.

No capability may call another capability.

No simulator function may decide which tool to use.

The UI must never decide which tool to execute.

The flow is always:

```text
Agent Core
   ->
Capability Registry
   ->
Selected Capability
   ->
Environment
```

## Rule 2 - LLM never directly changes the world

The LLM only proposes a structured action.

It cannot directly modify:

- generator values
- battery state
- substation state
- line capacity
- load state

Only the simulator/capability layer can change the environment.

## Rule 3 - LLM output is never automatically trusted

Every action from the planner must pass validation.

```text
LLM output
   ->
schema validation
   ->
tool existence check
   ->
argument validation
   ->
state/constraint validation
   ->
execute
```

## Rule 4 - Success must be verified by code

A capability returning `success=true` is not enough for mission completion.

The actual environment must be checked.

Example:

```text
LLM: "Hospital restored"
        ->
Validator:
hospital.required_power <= hospital.supplied_power
        ->
VALID
```

## Rule 5 - Failures are first-class data

A failed tool call must never crash the whole agent.

It must become structured information:

```json
{
  "success": false,
  "error": {
    "code": "TRANSMISSION_OVERLOAD",
    "message": "TL4 would exceed capacity"
  }
}
```

Then the recovery engine decides what happens next.

## Rule 6 - No hardcoded tool routing

Forbidden:

```python
if event == "substation_failure":
    tool = "redistribution_engine"
```

Allowed:

```python
decision = planner.decide(...)
tool = registry.get(decision.action)
```

The planner may choose different tools under different states.

## Rule 7 - Shared contracts are frozen

Nobody changes a shared schema casually.

The team agrees on the schema first.

If a breaking change is needed:

```text
Contract v1
   ->
announce change
   ->
Contract v2
   ->
update dependent modules
   ->
run integration tests
```

## Rule 8 - All modules must be testable independently

P1 must be able to test the Agent Core using fake tools.

P2 must be able to test the simulator without the LLM.

P3 must be able to test capabilities using fake state.

P4 must be able to test the UI using mock events.

---

# 5. High-Level Architecture

```text
                       USER
                        |
                        v
                +----------------+
                | Mission / Goal |
                +-------+--------+
                        |
                        v
              +----------------------+
              |      GRIDMIND CORE   |
              |                      |
              |  Agent Controller    |
              |       |              |
              |     Observe          |
              |       |              |
              |     Planner ---------> LLM
              |       |              |
              |       v              |
              | Capability Registry  |
              |       |              |
              | Action Validator      |
              |       |              |
              | Executor              |
              |       |              |
              | Recovery              |
              |       |              |
              | Memory / State        |
              +-------+--------------+
                      |
              ToolCall / ToolResult
                      |
          +-----------+------------+
          |                        |
          v                        v
+--------------------+    +------------------+
| Capabilities (P3)  |    | Grid Simulator   |
|                    |    |      (P2)        |
| Analyzer           |    |                  |
| Redistribution     |    | Generators       |
| Priority Manager   |    | Substations      |
| Battery            |    | Lines            |
| Validator          |    | Loads            |
+----------+---------+    | Battery          |
           |              | Events           |
           +------------->| Constraints      |
                          +--------+---------+
                                   |
                                New State
                                   |
                                   v
                             Agent observes
                                   |
                                  LOOP

Agent Events
     |
     v
+------------------+
| FastAPI/WebSocket|
+--------+---------+
         |
         v
+------------------+
| Dashboard (P4)   |
+------------------+
```

---

# 6. Repository Structure

Recommended repository:

```text
gridmind/
│
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── docs/
│   ├── architecture.md
│   ├── contracts.md
│   ├── demo-scenario.md
│   └── testing.md
│
├── backend/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── agent.py
│   │   ├── planner.py
│   │   ├── state.py
│   │   ├── registry.py
│   │   ├── executor.py
│   │   ├── observer.py
│   │   ├── validator.py
│   │   ├── memory.py
│   │   ├── recovery.py
│   │   └── events.py
│   │
│   ├── llm/
│   │   ├── client.py
│   │   ├── prompts.py
│   │   └── schemas.py
│   │
│   ├── grid/
│   │   ├── models.py
│   │   ├── simulator.py
│   │   ├── constraints.py
│   │   ├── power_balance.py
│   │   └── events.py
│   │
│   ├── capabilities/
│   │   ├── base.py
│   │   ├── analyzer.py
│   │   ├── redistribution.py
│   │   ├── priority_manager.py
│   │   ├── battery.py
│   │   └── validator.py
│   │
│   ├── api/
│   │   ├── routes.py
│   │   └── websocket.py
│   │
│   └── tests/
│       ├── unit/
│       └── integration/
│
└── frontend/
    ├── components/
    ├── pages/
    ├── services/
    └── assets/
```

---

# 7. Person 1 - Agent Framework

## Ownership

P1 owns:

```text
backend/core/
backend/llm/
```

P1 is responsible for the actual agent framework.

## Deliverables

### 7.1 Agent Controller

The central loop.

Conceptually:

```python
class Agent:
    def run(self, goal):
        while not self.mission_complete():
            observation = self.observer.observe()

            self.state.update(observation)

            decision = self.planner.decide(
                goal=goal,
                state=self.state,
                capabilities=self.registry.describe_all(),
                memory=self.memory.get_context()
            )

            self.validator.validate_action(decision)

            result = self.executor.execute(decision)

            self.memory.record(decision, result)

            self.state.record_result(result)

            if result.failed:
                self.recovery.handle(result)
                continue

            outcome = self.validator.validate_outcome(
                self.state
            )

            if outcome.valid:
                if self.mission_complete():
                    break
            else:
                self.recovery.replan(outcome)
```

The exact implementation can differ, but the responsibility stays here.

### 7.2 Planner

Planner prepares LLM input.

Planner input:

```json
{
  "goal": "Maintain critical power",
  "state": {},
  "available_capabilities": [],
  "previous_failures": [],
  "memory": []
}
```

Planner output:

```json
{
  "action": "battery_engine",
  "arguments": {
    "power_mw": 20,
    "duration_minutes": 10
  },
  "reason": "Generation is insufficient for critical demand."
}
```

### 7.3 LLM Adapter

Only P1 should know the exact LLM API details.

The rest of the application should not contain model-specific code.

Use an interface such as:

```python
class LLMClient:
    def generate_decision(self, prompt: str) -> dict:
        ...
```

If the model provider changes, only this layer should need major changes.

### 7.4 State Manager

P1 owns the canonical in-memory state representation used by the Agent Core.

It must match the GridState contract.

### 7.5 Registry

P1 owns registration and lookup.

```python
registry.register(tool)
registry.get("battery_engine")
registry.list()
registry.describe_all()
```

### 7.6 Executor

P1 controls:

```text
receive ToolCall
   ->
resolve capability
   ->
validate arguments
   ->
execute
   ->
return ToolResult
```

### 7.7 Memory

Memory should keep useful execution history, especially:

- previous actions
- successful actions
- failed actions
- failure reasons
- previous plan IDs
- known constraints
- current mission
- current plan
- important observations

### 7.8 Recovery

Recovery handles:

- tool failures
- invalid actions
- state changes
- invalidated plans
- replan requests

---

# 8. Person 2 - Grid Simulator

## Ownership

P2 owns:

```text
backend/grid/
```

## 8.1 Entity Models

At minimum:

### Generator

```json
{
  "id": "G1",
  "type": "generator",
  "capacity_mw": 100,
  "available_mw": 90,
  "online": true
}
```

### Substation

```json
{
  "id": "S1",
  "type": "substation",
  "online": true
}
```

### Transmission Line

```json
{
  "id": "TL1",
  "from": "S1",
  "to": "S2",
  "capacity_mw": 60,
  "load_mw": 40,
  "online": true
}
```

### Load

```json
{
  "id": "HOSPITAL",
  "type": "hospital",
  "demand_mw": 30,
  "supplied_mw": 30,
  "priority": "critical",
  "connected": true
}
```

### Battery

```json
{
  "id": "B1",
  "capacity_mwh": 100,
  "remaining_mwh": 70,
  "max_output_mw": 40,
  "online": true
}
```

## 8.2 Simulator Responsibilities

The simulator must:

- return current state
- apply capability actions
- update state
- enforce constraints
- calculate simplified power balance
- apply failures
- apply weather effects
- apply demand changes
- expose deterministic test scenarios

## 8.3 Events

P2 owns environment events such as:

```text
SUBSTATION_FAILURE
TRANSMISSION_FAILURE
GENERATOR_FAILURE
WEATHER_DETERIORATION
DEMAND_SPIKE
BATTERY_DEPLETION
```

A chaos event changes the world.

It does not directly choose an agent action.

Example:

```python
grid.inject_event({
    "type": "substation_failure",
    "target": "S2"
})
```

Then the agent observes the resulting state.

---

# 9. Person 3 - Capabilities

## Ownership

P3 owns:

```text
backend/capabilities/
```

## 9.1 Common Capability Interface

All tools must implement the same interface.

```python
class Capability:
    name: str
    description: str

    def input_schema(self) -> dict:
        ...

    def execute(self, state, arguments) -> ToolResult:
        ...
```

Every capability returns `ToolResult`.

## 9.2 Initial Capability Set

Do not start with eight complicated tools.

Start with four:

1. Grid Analyzer
2. Redistribution Engine
3. Priority Load Manager
4. Battery Engine

Additional capabilities can be added later.

## 9.3 Grid Analyzer

Purpose:

- inspect grid
- identify outages
- identify critical loads
- identify generation deficit/surplus
- identify overloaded lines
- summarize constraints

It should primarily analyze rather than directly perform large state changes.

Example output:

```json
{
  "success": true,
  "data": {
    "generation_mw": 180,
    "demand_mw": 150,
    "failed_components": ["S2"],
    "critical_loads_affected": ["HOSPITAL"],
    "overloaded_lines": []
  },
  "error": null
}
```

## 9.4 Redistribution Engine

Purpose:

- attempt alternative power routing
- respect transmission capacities
- fail when no valid route exists

Important:

It must be able to genuinely fail.

Example:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TRANSMISSION_OVERLOAD",
    "message": "Requested redistribution would exceed TL4 capacity."
  }
}
```

## 9.5 Priority Load Manager

Purpose:

- prioritize critical facilities
- allocate available power
- shed non-critical load when necessary

Critical facilities may include:

- hospital
- water plant
- emergency services

Example:

```json
{
  "success": true,
  "data": {
    "served": [
      "HOSPITAL",
      "WATER_PLANT"
    ],
    "shed": [
      "FACTORY",
      "RESIDENTIAL_ZONE_3"
    ]
  },
  "error": null
}
```

## 9.6 Battery Engine

Purpose:

- discharge battery within limits
- compensate for temporary generation deficit
- fail if insufficient battery energy or output capacity exists

## 9.7 Outcome Validator

P3 owns the low-level validation rules.

The validator checks actual environment state:

- critical loads supplied
- transmission capacity respected
- failed components isolated
- battery limits respected
- grid remains within simplified safety constraints

---

# 10. Person 4 - API, Integration, UI

## Ownership

P4 owns:

```text
backend/api/
frontend/
```

## 10.1 FastAPI

The API provides:

- start mission
- get current state
- inject chaos event
- get current trace
- stream agent events

Suggested endpoints:

```text
POST   /mission/start
POST   /chaos/event
GET    /grid/state
GET    /agent/state
GET    /events
WS     /ws
```

Exact route names can be changed, but the contract must be frozen before integration.

## 10.2 WebSocket

The Agent Core should publish events.

P4 listens and displays them.

The UI should not poll everything continuously if the event stream already provides the required information.

## 10.3 Dashboard

The dashboard should show:

### Left

Live grid:

- generators
- substations
- lines
- loads
- battery
- failures

### Right

Agent Brain:

- current mission
- observation number
- plan ID
- chosen tool
- arguments
- tool result
- failure reason
- replan event
- validation result

### Bottom

Event log:

```text
21:10:12 Observation #4
21:10:13 Plan #1 created
21:10:13 redistribution_engine selected
21:10:14 Tool failed: TL4 overload
21:10:14 Plan invalidated
21:10:15 Replanning
21:10:16 priority_load_manager selected
21:10:17 Validation passed
```

---

# 11. CONTRACTS - SINGLE SOURCE OF TRUTH

This section must be treated as the most important technical agreement.

---

# 11.1 Contract: GridState

The simulator returns the environment in a consistent structure.

Example:

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

### Ownership

P2 creates it.

P1 consumes it.

P3 consumes it.

P4 displays it.

---

# 11.2 Contract: CapabilitySpec

Every capability is described in a common format.

```json
{
  "name": "battery_engine",
  "description": "Use stored energy to compensate for temporary generation deficit.",
  "input_schema": {
    "type": "object",
    "properties": {
      "power_mw": {
        "type": "number"
      },
      "duration_minutes": {
        "type": "number"
      }
    },
    "required": ["power_mw"]
  }
}
```

The planner receives a list of these capability descriptions.

---

# 11.3 Contract: ToolCall

The planner must return one structured action.

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

Required fields:

- `action`
- `arguments`

Optional but recommended:

- `reason`

The Agent Core must reject malformed output.

---

# 11.4 Contract: ToolResult

Every capability must return this shape.

### Success

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Failure

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

Required:

- `success`
- `data`
- `error`

---

# 11.5 Contract: AgentEvent

Every important step should generate a trace event.

Base shape:

```json
{
  "timestamp": 1720000000,
  "type": "TOOL_SELECTED",
  "plan_id": 3,
  "message": "redistribution_engine selected"
}
```

Recommended event types:

```text
MISSION_STARTED
OBSERVATION
PLAN_CREATED
TOOL_SELECTED
TOOL_STARTED
TOOL_SUCCESS
TOOL_FAILED
PLAN_INVALIDATED
REPLAN_STARTED
VALIDATION_STARTED
VALIDATION_FAILED
MISSION_COMPLETED
MISSION_FAILED
CHAOS_EVENT
```

Additional fields can be included where useful:

```json
{
  "type": "TOOL_FAILED",
  "plan_id": 3,
  "tool": "redistribution_engine",
  "message": "TL4 overload"
}
```

---

# 11.6 Contract: MissionState

The Agent Core maintains the mission-level state.

Example:

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

---

# 12. Contract Ownership Matrix

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

Important:

**The owner can implement the contract, but does not own the behavior of consumers.**

---

# 13. Exact Runtime Flow

This is the flow the final system must follow.

## Step 1 - Mission starts

User:

```text
Maintain power to critical facilities.
```

P4 sends:

```text
POST /mission/start
```

P1 creates MissionState.

Event:

```text
MISSION_STARTED
```

---

## Step 2 - Observe

P1 asks P2:

```text
get_state()
```

P2 returns GridState.

P1 stores it.

Event:

```text
OBSERVATION
```

---

## Step 3 - Build planner context

P1 gathers:

```text
goal
+
current state
+
available capabilities
+
previous failures
+
memory
```

---

## Step 4 - LLM selects one action

P1 sends structured context to the LLM.

Example:

```json
{
  "goal": "Maintain power to critical facilities",
  "state": {},
  "available_capabilities": [
    "grid_analyzer",
    "redistribution_engine",
    "priority_load_manager",
    "battery_engine"
  ],
  "previous_failures": []
}
```

LLM returns:

```json
{
  "action": "redistribution_engine",
  "arguments": {},
  "reason": "An alternative path may restore the isolated critical load."
}
```

Event:

```text
PLAN_CREATED
TOOL_SELECTED
```

---

## Step 5 - Validate requested action

P1 checks:

```text
Does tool exist?
Does schema match?
Are arguments valid?
Is capability currently available?
Does action violate obvious known constraints?
```

If invalid:

```text
TOOL_REJECTED
```

Then replan.

---

## Step 6 - Execute

P1 calls P3's tool.

P3 may use P2's simulator functionality.

Result is returned as ToolResult.

---

## Step 7A - Tool success

If:

```json
{
  "success": true
}
```

P1 updates memory/state and asks for a new observation.

---

## Step 7B - Tool failure

If:

```json
{
  "success": false,
  "error": {
    "code": "TRANSMISSION_OVERLOAD"
  }
}
```

P1 does:

```text
record failure
   ->
record reason
   ->
invalidate plan
   ->
update state
   ->
replan
```

Event sequence:

```text
TOOL_FAILED
PLAN_INVALIDATED
REPLAN_STARTED
```

---

## Step 8 - Observe again

A tool may have changed the world.

A chaos event may also have changed the world.

The agent must not assume the old state is still correct.

It asks the simulator for fresh state.

---

## Step 9 - Outcome validation

The validator checks the actual environment.

Examples:

```text
hospital supplied >= required
water plant supplied >= required
emergency services supplied >= required
line load <= line capacity
failed component not used
battery within limits
```

---

## Step 10 - Mission completion

Only if the mission conditions are satisfied:

```text
MISSION_COMPLETED
```

Otherwise:

```text
REPLAN
```

---

# 14. Failure and Recovery Flow

The most important failure flow is:

```text
Tool selected
    |
    v
Tool starts
    |
    v
Tool fails
    |
    v
Record failure
    |
    v
Invalidate current plan
    |
    v
Observe current world again
    |
    v
Update memory
    |
    v
Planner receives:
    - current state
    - failure
    - available tools
    - goal
    |
    v
LLM selects another valid action
    |
    v
Execute
```

Never do this:

```text
tool fails
   ->
hardcode another tool
```

The next decision must again pass through the planner.

---

# 15. Chaos Mode

Chaos mode exists to demonstrate that the agent reacts to a changing environment.

The user can trigger:

```text
FAIL SUBSTATION
FAIL TRANSMISSION LINE
FAIL GENERATOR
WEATHER DETERIORATION
DEMAND SPIKE
BATTERY LOW
```

The environment changes independently.

Example:

```text
Before:

Generation = 180MW
Demand = 150MW

After substation failure:

S2 = OFFLINE
Hospital = disconnected
```

The agent receives no hidden instruction like:

```text
Use redistribution.
```

It simply observes the new state.

---

# 16. Recommended Demo Scenario

## Initial state

```text
Generation = 180 MW
Demand = 150 MW
Battery = 80 MWh

Critical:
Hospital
Water Plant
Emergency Services
```

Grid is stable.

Agent creates Plan #1.

---

## Chaos Event 1 - Substation failure

User presses:

```text
FAIL S2
```

Environment:

```text
S2 = OFFLINE
Hospital affected
```

Agent observes.

LLM may select:

```text
redistribution_engine
```

---

## Capability Failure

Redistribution attempts to use a constrained path.

Result:

```text
FAIL
TL4 overload
```

GridMind:

```text
Plan #1 invalid
```

Then it replans.

LLM may select:

```text
priority_load_manager
```

Critical facilities are restored or prioritized.

---

## Chaos Event 2 - Weather deterioration

User triggers:

```text
WEATHER DETERIORATION
```

Solar generation drops.

Example:

```text
Solar: 40MW -> 10MW
```

Old plan may no longer be sufficient.

Agent observes again.

LLM may select:

```text
battery_engine
```

Battery supports the critical load temporarily.

---

## Final validation

System verifies:

```text
Hospital              PASS
Water Plant           PASS
Emergency Services    PASS
Transmission limits   PASS
Failed components     ISOLATED
Battery limits        PASS
Mission               COMPLETE
```

Dashboard displays:

```text
MISSION COMPLETE
Plans: 3
Replans: 2
Tool failures: 1
Critical load restored: 100%
```

Exact numbers depend on the simulator configuration.

---

# 17. How We Prevent Integration Errors

## 17.1 Freeze schemas before implementation

Before serious coding, create:

```text
docs/contracts.md
```

and freeze:

- GridState
- ToolSpec
- ToolCall
- ToolResult
- AgentEvent
- MissionState

## 17.2 Use mock implementations

P1 should have:

```python
FakeTool()
FakeLLM()
FakeEnvironment()
```

P2 should have:

```python
sample_grid_state()
```

P3 should have:

```python
sample_inputs()
```

P4 should have:

```python
sample_events()
```

Everyone can work independently.

## 17.3 One shared environment file

Everyone should use the same `.env.example`.

Example:

```text
LLM_API_KEY=
LLM_MODEL=
API_HOST=
API_PORT=
```

Never commit real secrets.

## 17.4 One command to run backend

Target:

```bash
python -m backend.main
```

## 17.5 One command to run frontend

Target whatever the selected frontend stack uses.

The README must document the exact command once the stack is finalized.

## 17.6 One command to run tests

Target:

```bash
pytest
```

---

# 18. Git Workflow

Branches:

```text
main
develop

feature/agent-core
feature/grid-simulator
feature/capabilities
feature/dashboard
```

Each person works only on their branch.

Example:

```bash
git checkout -b feature/grid-simulator
```

Commit small changes:

```text
feat: add grid state model
feat: add substation failure event
fix: validate transmission capacity
test: add battery engine failure case
```

Before opening a pull request:

```bash
git pull
run tests
run app
verify contract
```

No one pushes experimental code directly to `main`.

---

# 19. Code Review Rules

Every PR should answer:

1. What module does this modify?
2. Which contract does it depend on?
3. Did any shared schema change?
4. Are tests included?
5. Does it break another member's interface?
6. Does the change introduce hardcoded tool routing?
7. Does it bypass the Agent Core?
8. Are failure cases handled?

---

# 20. Testing Strategy

We need four levels of testing.

## Level 1 - Unit tests

### P1

Test:

- planner parsing
- tool lookup
- action validation
- recovery
- state updates

### P2

Test:

- generator state
- line capacity
- failure events
- demand events
- power balance

### P3

Test:

- each capability
- valid inputs
- invalid inputs
- tool failures
- validator rules

### P4

Test:

- API routes
- event formatting
- WebSocket handling
- UI rendering

---

# 21. Integration Tests

At minimum:

## Integration Test 1 - Agent + Simulator

```text
Agent observes simulator
```

Expected:

```text
GridState received correctly
```

## Integration Test 2 - Agent + Tool

```text
Agent selects fake capability
-> capability executes
-> ToolResult returned
```

## Integration Test 3 - Tool Failure

```text
Capability fails
-> Agent records failure
-> Agent replans
```

## Integration Test 4 - State Change

```text
Chaos event
-> new GridState
-> agent observes new state
```

## Integration Test 5 - Final Validation

```text
agent acts
-> environment changes
-> validator checks state
-> mission completion only when valid
```

---

# 22. Hardcoded-Routing Test

We need an explicit test proving the planner is not hardcoded.

Example scenario:

```text
Tools available:
A
B
C
```

Run the same agent with different state descriptions.

The planner should be able to return different actions.

Also test tool availability:

```text
battery available
```

versus:

```text
battery unavailable
```

The framework must not assume that a particular action is always available.

---

# 23. Fake LLM Mode

For development, P1 should implement a deterministic fake LLM.

Example:

```python
class FakeLLM:
    def generate_decision(self, context):
        return {
            "action": "battery_engine",
            "arguments": {
                "power_mw": 10
            }
        }
```

This is only for testing.

It lets the team test the Agent Core without an external API.

The real demo uses the allowed LLM API.

---

# 24. Fake Tool Mode

P1 should also be able to test the framework with tools like:

```python
class FakeSuccessTool:
    ...

class FakeFailingTool:
    ...
```

This allows P1 to prove:

```text
Tool success works
Tool failure works
Replan works
```

without waiting for P3.

---

# 25. Module Dependency Rules

Allowed:

```text
P1 -> P2
P1 -> P3
P4 -> P1
P4 -> P2
P4 -> event stream
P3 -> P2
```

Avoid:

```text
P2 -> P1
P3 -> P1
P3 -> P3
P4 -> P3 direct execution
```

The important idea is that capabilities should not become a second orchestration system.

---

# 26. Data Ownership

## P2 is source of truth for world state

The simulator owns:

- generators
- substations
- lines
- loads
- battery
- physical state
- failures
- environmental changes

## P1 is source of truth for mission state

The Agent Core owns:

- current goal
- plan number
- observation count
- action history
- failure memory
- planning context
- mission status

## P3 owns capability semantics

Each tool owns:

- what its action means
- valid arguments
- capability-specific constraints
- capability-specific failure conditions

## P4 owns presentation state

The UI owns:

- selected panel
- display state
- event rendering
- visualization

The UI must not become the source of truth for actual grid state.

---

# 27. Logging and Trace Format

Every agent cycle should be traceable.

Recommended trace fields:

```json
{
  "mission_id": "mission-001",
  "cycle": 7,
  "observation_id": 12,
  "plan_id": 3,
  "action": "redistribution_engine",
  "arguments": {},
  "result": {
    "success": false,
    "error": {
      "code": "TRANSMISSION_OVERLOAD"
    }
  },
  "replanned": true
}
```

This is useful for:

- debugging
- dashboard
- judge demonstration
- post-demo explanation
- metrics

---

# 28. Metrics

Track at least:

```text
Plans created
Replans
Tool calls
Tool failures
Successful recoveries
Validation failures
Mission completion
Critical-load restoration
Load shed
Battery remaining
```

Optional:

```text
LLM latency
Average cycle duration
Number of observations
Number of rejected actions
```

---

# 29. Security / Safety in the Demo

Even though the grid is simulated, we should keep the architecture disciplined.

The agent cannot:

- execute arbitrary Python
- run arbitrary shell commands
- alter files
- directly modify the database
- call unknown tools

A capability must be explicitly registered.

The executor should reject unknown capabilities.

---

# 30. Recommended Development Order

Do not build everything simultaneously.

## Phase 0 - Team Contract

All four together.

Deliver:

```text
architecture.md
contracts.md
demo-scenario.md
repository structure
```

Freeze interfaces.

---

## Phase 1 - Independent Foundations

### P1

Build:

- Agent interface
- Planner
- Fake LLM
- Registry
- Executor
- Recovery skeleton

### P2

Build:

- Grid models
- Simulator
- State generation
- Failure events
- Constraints

### P3

Build:

- Capability base class
- Grid analyzer
- Redistribution
- Priority manager
- Battery
- Validator

### P4

Build:

- dashboard shell
- fake event stream
- grid visualization
- event log
- chaos controls

Everyone can work simultaneously.

---

# 31. First Integration Milestone

Connect:

```text
P1 + P2
```

Goal:

```text
Agent
 -> observe
 -> receive GridState
 -> print state
```

Do not add complex UI.

---

# 32. Second Integration Milestone

Connect:

```text
P1 + P3 + P2
```

Goal:

```text
Agent
 -> observe
 -> LLM chooses tool
 -> registry resolves tool
 -> capability executes
 -> simulator state changes
 -> ToolResult returns
```

---

# 33. Third Integration Milestone

Test failure:

```text
Agent
 -> tool selected
 -> tool fails
 -> failure recorded
 -> plan invalidated
 -> replan
 -> new tool selected
```

This is the most important backend milestone.

---

# 34. Fourth Integration Milestone

Connect P4:

```text
Agent
 -> AgentEvent
 -> WebSocket
 -> Dashboard
```

UI now visualizes a backend flow that is already working.

---

# 35. Fifth Integration Milestone

Add Chaos Mode.

Test:

```text
Substation failure
+
Tool failure
+
Weather deterioration
+
Replan
+
Final validation
```

---

# 36. Sixth Integration Milestone

Polish only.

Add:

- better animations
- readable event trace
- metrics
- colors/status
- demo buttons
- clearer error messages
- loading states
- screenshots
- architecture display

Do not add major architecture changes here.

---

# 37. Team Daily Workflow

At the beginning of a work session:

```text
1. Pull latest develop.
2. Check contract changes.
3. Work only inside your ownership area.
4. Run your module tests.
5. Commit.
6. Push branch.
7. Tell team what changed.
```

At the end:

Every member reports:

```text
DONE:
...

CHANGED:
...

NEW CONTRACT:
...

BLOCKED:
...

NEEDS INTEGRATION:
...
```

---

# 38. Integration Checklist

Before merging any module:

```text
[ ] Contract unchanged or documented
[ ] Unit tests passing
[ ] No hardcoded routing
[ ] No direct LLM-to-environment calls
[ ] No capability-to-capability calls
[ ] Error handling added
[ ] Structured result returned
[ ] Logs/events added
[ ] Other team members informed
```

---

# 39. Final Demo Checklist

Before presentation:

```text
[ ] Fresh repository clone works
[ ] Environment variables documented
[ ] Backend starts
[ ] Frontend starts
[ ] LLM connection works
[ ] Grid initializes
[ ] Mission starts
[ ] Tool registry loads
[ ] Agent observes state
[ ] Agent selects tool
[ ] Tool executes
[ ] Tool failure works
[ ] Replanning works
[ ] Chaos event changes environment
[ ] Agent notices changed state
[ ] Final validator works
[ ] Mission completes
[ ] Dashboard updates live
[ ] Metrics update
```

---

# 40. Final Demo Script

The team should rehearse exactly one deterministic path.

## P4

Start the dashboard.

Say:

> "This is the simulated grid and this is the GridMind agent trace."

## P1

Start mission:

```text
Maintain power to critical facilities.
```

Show:

```text
Observation
Plan #1
Tool selection
Execution
```

## P2

Trigger:

```text
Substation S2 failure
```

Say:

> "The environment changed independently of the agent."

The dashboard shows:

```text
S2 FAILED
Hospital affected
```

## P1

Show that the planner receives the new state.

Agent chooses a capability.

## P3

Cause or demonstrate capability failure:

```text
TRANSMISSION_OVERLOAD
```

## P1

Show:

```text
Plan invalidated
Replanning
```

Then agent selects another capability.

## P2

Trigger:

```text
Weather deterioration
```

Generation drops.

## P1

Agent receives new state and replans again.

## P3

Battery capability executes.

## P3 / P1

Validator checks:

```text
critical loads
transmission constraints
failed equipment
battery state
```

## P4

Show:

```text
MISSION COMPLETE
```

Then display metrics.

---

# 41. What Judges Should Be Able to See

The demo must make these facts obvious:

### 1. We did not import an agent framework

The core loop exists in our repository.

### 2. The LLM chooses capabilities

The action comes from the planner output.

### 3. Multiple tools exist

At least four capabilities should be registered.

### 4. Tool choice is not hardcoded

The same core works with different capabilities/states.

### 5. Tools can fail

Failure is a real ToolResult.

### 6. The environment changes

Chaos events change GridState.

### 7. The agent observes after actions

It does not blindly trust an old plan.

### 8. The framework replans

Failed plans are invalidated.

### 9. Success is verified

The final state is checked by code.

### 10. The framework is reusable

GridMind should be presented as a small generic orchestration framework with the power-grid domain implemented as one environment.

---

# 42. What NOT To Do

## Do not use LangChain as the agent executor

Using an LLM utility/client wrapper is acceptable where permitted, but our actual:

```text
observe
plan
select
validate
execute
recover
replan
```

loop must be ours.

## Do not create fake autonomy

Avoid:

```python
if outage:
    tool = "..."
```

## Do not make every tool always succeed

At least one meaningful capability failure should be demonstrated.

## Do not let the frontend trigger business logic directly

The frontend should request events/actions through the API.

## Do not make the simulator call the LLM

The simulator should be deterministic and independent.

## Do not make the LLM do deterministic calculations

Use code for:

- capacity
- demand
- power balance
- validation
- constraints

Use the LLM for:

- selecting an action
- interpreting state
- deciding among capabilities

## Do not overbuild the grid physics

We are demonstrating agent architecture, not professional electrical-grid simulation.

---

# 43. Generic Framework Goal

One of the strongest ways to present the project is to show that the GridMind Core is not permanently tied to electricity.

The abstract framework is:

```text
Goal
+
State
+
Capabilities
+
Planner
+
Executor
+
Validator
+
Recovery
```

The power-grid simulation is one environment.

Conceptually, later it could support:

```text
research agent
coding agent
automation agent
operations agent
```

without changing the basic Agent Core.

For the hackathon, however, keep the demonstrated environment focused and reliable.

---

# 44. Definition of Done

The project is considered complete only when all of these are true.

## Framework

```text
[ ] Custom agent loop implemented
[ ] Planner implemented
[ ] Capability registry implemented
[ ] Executor implemented
[ ] State manager implemented
[ ] Recovery implemented
[ ] Memory implemented
[ ] Validator implemented
```

## Environment

```text
[ ] Grid state implemented
[ ] Failures implemented
[ ] Constraints implemented
[ ] Weather event implemented
[ ] Demand change implemented
[ ] Battery implemented
```

## Capabilities

```text
[ ] Analyzer
[ ] Redistribution
[ ] Priority Load Manager
[ ] Battery
[ ] ToolResult contract
[ ] At least one realistic failure
```

## Integration

```text
[ ] P1 + P2
[ ] P1 + P3
[ ] P1 + P2 + P3
[ ] P4 + backend
[ ] Chaos end-to-end
```

## Demo

```text
[ ] Mission starts
[ ] Agent observes
[ ] Agent selects a tool
[ ] Tool executes
[ ] Environment changes
[ ] Tool fails
[ ] Replanning occurs
[ ] Another tool selected
[ ] Validation occurs
[ ] Mission completes
```

---

# 45. Golden Rule for the Entire Team

Whenever you are unsure where some piece of logic belongs, ask:

> **"Is this deciding what to do, changing the world, performing an action, or displaying information?"**

Then place it accordingly:

```text
DECIDE WHAT TO DO
        ->
P1 Agent Core

CHANGE THE WORLD
        ->
P2 Simulator

PERFORM AN ACTION
        ->
P3 Capability

DISPLAY INFORMATION
        ->
P4 Dashboard
```

If a piece of code fits two categories, discuss it before implementing it.

---

# 46. Golden Runtime Rule

The final agent should always feel like this:

```text
OBSERVE
  ->
THINK / PLAN
  ->
CHOOSE
  ->
VALIDATE
  ->
ACT
  ->
OBSERVE AGAIN
  ->
VERIFY
  ->
RECOVER / REPLAN
  ->
ACT AGAIN
```

Never:

```text
USER
 ->
LLM
 ->
magic function
 ->
SUCCESS
```

That would be a puppet.

GridMind is supposed to demonstrate the **brain around the model**.

---

# 47. Final Architecture Summary

```text
                     +----------------------+
                     |         USER         |
                     +----------+-----------+
                                |
                                v
                     +----------------------+
                     |      GRIDMIND CORE   |
                     |                      |
                     | Observe              |
                     | Planner              |
                     | LLM Adapter          |
                     | Capability Registry  |
                     | Action Validator      |
                     | Executor              |
                     | Memory               |
                     | Recovery             |
                     | Outcome Validator    |
                     +----------+-----------+
                                |
                    +-----------+-----------+
                    |                       |
                    v                       v
          +-------------------+   +--------------------+
          | CAPABILITIES (P3) |   | SIMULATOR (P2)     |
          |                   |   |                    |
          | Analyzer          |   | Generators         |
          | Redistribution    |   | Substations        |
          | Priority Manager  |   | Transmission lines |
          | Battery           |   | Loads              |
          +---------+---------+   | Battery            |
                    |             | Events             |
                    +-----------> | Constraints        |
                                  +---------+----------+
                                            |
                                         GridState
                                            |
                                            +----> Agent

                     AgentEvent
                          |
                          v
                 +------------------+
                 | API / WebSocket  |
                 +--------+---------+
                          |
                          v
                 +------------------+
                 | Dashboard (P4)   |
                 +------------------+
```

---

# 48. The One-Sentence Project Description

> **GridMind is a from-scratch agent framework that lets an LLM plan and choose tools, execute those tools inside a changing simulated power grid, detect failures through real environment feedback, recover from invalid plans, and replan until the mission is actually verified.**

---

# 49. Team Ownership Summary

## P1 - Brain

```text
core/
llm/
agent loop
planner
registry
executor
state
memory
recovery
```

## P2 - World

```text
grid/
models
simulator
events
constraints
power balance
```

## P3 - Actions

```text
capabilities/
analyzer
redistribution
priority
battery
validator
failure cases
```

## P4 - Window + Integration

```text
api/
websocket
frontend/
dashboard
event log
chaos controls
integration tests
```

---

# 50. The Integration Principle

**Everyone can code independently. Nobody integrates independently.**

Integration happens only through the contracts in this document.

That means:

```text
P1 does not need P2's internal code.
P2 does not need P1's planner logic.
P3 does not need P4's frontend.
P4 does not need P3's internal implementation.
```

They only need the agreed interfaces.

That is how four people build one coherent agent instead of four disconnected components.
