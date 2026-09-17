# GridMind Architecture

## High-Level Architecture

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
              |       (Owned by P1)  |
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
| FastAPI/WebSocket| (P4)
+--------+---------+
         |
         v
+------------------+
| Dashboard (P4)   |
+------------------+
```

## Module Ownership
- **P1**: `backend/core/`, `backend/llm/` (The Brain)
- **P2**: `backend/grid/` (The World)
- **P3**: `backend/capabilities/` (The Hands)
- **P4**: `backend/api/`, `frontend/` (The Window)
