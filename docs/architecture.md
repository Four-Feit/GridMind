# GridMind Architecture

## System Flow & Component Diagram

```mermaid
flowchart TD
    User([User / Operator]) -->|Start Mission / Chaos Event| P4_API[P4: FastAPI REST Endpoints]
    
    subgraph P1_Brain [P1: Agent Core - The Brain]
        AgentController[Agent Controller]
        Observer[Observer]
        Planner[Planner]
        LLM[LLM Adapter / FakeLLM]
        Validator[Action & Outcome Validator]
        Registry[Capability Registry]
        Executor[Executor]
        Memory[Memory & Context]
        Recovery[Recovery Engine]
        EventBus[EventBus]
    end

    subgraph P2_World [P2: Grid Simulator - The World]
        GridSim[Grid Simulator]
        GridState[(Grid State)]
        Constraints[Physics & Constraints]
    end

    subgraph P3_Hands [P3: Capabilities - The Hands]
        Analyzer[Grid Analyzer]
        Redistribution[Redistribution Engine]
        PriorityMgr[Priority Load Manager]
        BatteryEng[Battery Engine]
        OutcomeVal[Grid Outcome Validator]
    end

    subgraph P4_Window [P4: Integration & UI - The Window]
        P4_WS[WebSocket Stream]
        Dashboard[Live Dashboard UI]
    end

    %% Flow interactions
    P4_API -->|Initialize Mission| AgentController
    AgentController --> Observer
    Observer -->|Query State| GridSim
    GridSim --> GridState
    GridState -->|Fresh Snapshot| Observer
    
    AgentController --> Planner
    Planner <--> LLM
    Planner -->|ToolCall| AgentController
    
    AgentController --> Validator
    Validator -->|Lookup Schema| Registry
    Validator -->|Validated Action| Executor
    
    Executor -->|Execute Tool| P3_Hands
    P3_Hands -->|Alter State| GridSim
    P3_Hands -->|ToolResult| Executor
    
    Executor --> Memory
    Executor -->|Failure detected| Recovery
    Recovery -->|Invalidate & Replan| Planner
    
    AgentController -->|Emit AgentEvents| EventBus
    EventBus -->|Publish| P4_WS
    P4_WS --> Dashboard
    P4_API -->|Inject Chaos| GridSim
```

---

## Agent Execution Loop

The agent strictly follows an 8-stage autonomous lifecycle:

```mermaid
sequenceDiagram
    autonumber
    participant Obs as Observer
    participant Brain as Agent Controller
    participant Plan as Planner (LLM)
    participant Val as Validator
    participant Exec as Executor
    participant Tool as Capability (P3)
    participant Sim as Simulator (P2)
    participant Rec as Recovery Engine
    participant Bus as EventBus (P4)

    Brain->>Obs: Observe World
    Obs->>Sim: Query GridState
    Sim-->>Obs: Return GridState
    Obs-->>Brain: Update StateManager
    
    Brain->>Plan: Formulate Plan Context
    Plan-->>Brain: Return ToolCall
    
    Brain->>Val: Validate ToolCall
    alt Action Invalid
        Val-->>Brain: Rejected
        Brain->>Rec: Handle Invalid Action
        Rec-->>Plan: Request Immediate Replan
    else Action Valid
        Brain->>Exec: Execute ToolCall
        Exec->>Tool: Invoke execute()
        Tool->>Sim: Update environment state
        Tool-->>Exec: Return ToolResult
        
        alt Tool Failed (e.g. TL4 Overload)
            Exec->>Rec: Handle Tool Failure
            Rec->>Bus: Emit PLAN_INVALIDATED & REPLAN_STARTED
            Rec-->>Plan: Replan with Failure in Context
        else Tool Succeeded
            Exec->>Bus: Emit TOOL_SUCCESS
            Brain->>Obs: Re-observe Environment
            Brain->>Val: Validate Ground Truth
            alt Ground Truth Satisfied
                Val->>Bus: Emit MISSION_COMPLETED
            else Unresolved
                Val->>Rec: Request Replan
            end
        end
    end
```

---

## P4 $\leftrightarrow$ P1 Communication Protocol

1. **REST Endpoints (`backend/api/routes.py`)**:
   - P4 exposes HTTP endpoints (`/mission/start`, `/chaos/event`) that trigger actions in P1's `AgentController` and P2's `GridSimulator`.
2. **EventBus $\leftrightarrow$ WebSocket Pipeline (`backend/api/websocket.py`)**:
   - P1's `EventBus` notifies registered listeners whenever an `AgentEvent` is emitted.
   - P4 registers a listener on startup that converts `AgentEvent` objects into WebSocket JSON envelopes and broadcasts them live to connected dashboard clients.

---

## LLM Client Architecture & Switching

- All LLM interactions are decoupled behind the `LLMClient` protocol in `backend/llm/client.py`.
- **`FakeLLM`**: Deterministic mock provider that plays scripted sequences for unit testing, offline development, and zero-token CI/CD runs.
- **`OpenAILikeClient` / Live Adapters**: Invokes live APIs (Gemini, OpenAI) using the environment variable `LLM_API_KEY` and `LLM_MODEL`.
- The planner switch between Mock and Live API is controlled via configuration without modifying a single line of agent orchestration logic.
