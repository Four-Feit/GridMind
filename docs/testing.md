# Testing Strategy

## Levels of Testing

### Level 1: Unit Tests
- **P1**: Planner parsing, tool lookup, action validation, recovery, state updates.
- **P2**: Generator state, line capacity, failure events, demand balance.
- **P3**: Capability executions, schema validations, realistic failure outputs.
- **P4**: API routes, WebSocket broadcasts, event serialization.

### Level 2: Integration Tests
1. **Agent + Simulator**: Agent observes simulator, receives valid `GridState`.
2. **Agent + Tool**: Agent selects tool, tool executes, returns `ToolResult`.
3. **Tool Failure + Recovery**: Capability fails $\rightarrow$ Agent records failure $\rightarrow$ Agent replans dynamically.
4. **State Change**: Chaos event $\rightarrow$ Agent observes new state $\rightarrow$ plans reaction.
5. **Final Validation**: Validator verifies ground truth environment state.

### Level 3: Non-Hardcoded Routing Test
Prove the LLM/Planner selects different capabilities when presented with different states or when tool availability changes.
