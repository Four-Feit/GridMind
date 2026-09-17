import React from 'react';

export const ArchitecturePage = () => {
  const modules = [
    {
      id: 'P1',
      title: 'Agent Core (The Brain)',
      path: 'backend/core/, backend/llm/',
      color: 'var(--accent-purple)',
      desc: 'Orchestrates the autonomous loop: StateManager, Memory, Planner, RecoveryEngine, and ActionValidator. Prompts LLM for decisions.'
    },
    {
      id: 'P2',
      title: 'Grid Simulator (The World)',
      path: 'backend/grid/',
      color: 'var(--accent-cyan)',
      desc: 'Simulates physical power grid: generators, substations (S1, S2, S3), transmission line capacities (TL1, TL4), loads, and physical chaos events.'
    },
    {
      id: 'P3',
      title: 'Capabilities (The Hands)',
      path: 'backend/capabilities/',
      color: 'var(--accent-amber)',
      desc: 'Tool registry with JSON schema contracts: redistribution_engine, priority_load_manager, battery_engine, grid_analyzer, and outcome verification.'
    },
    {
      id: 'P4',
      title: 'API & Telemetry UI (The Window)',
      path: 'backend/api/, frontend/',
      color: 'var(--accent-emerald)',
      desc: 'FastAPI HTTP endpoints, real-time WebSocket event broadcaster, React 19 control room dashboard, and end-to-end integration test suite.'
    }
  ];

  const rules = [
    { num: 'Rule 1', title: 'The LLM Never Executes Tools Directly', desc: 'The LLM outputs structured decisions (ToolCall). The Python Executor dispatches and sandboxes capabilities.' },
    { num: 'Rule 2', title: 'The Simulator Does Not Decide Agent Policy', desc: 'Simulator only models physical grid laws and constraints. All strategy emerges from the agent brain.' },
    { num: 'Rule 3', title: 'Actions Must Be Validated Before Execution', desc: 'Pre-flight ActionValidator checks input types, arguments, and safety boundaries before passing to simulator.' },
    { num: 'Rule 4', title: 'Outcomes Must Be Verified By Code', desc: 'The LLM cannot declare its own success. A deterministic Python validator verifies critical load power and constraints.' },
    { num: 'Rule 5', title: 'Recovery Must Be Dynamic, Never Hardcoded', desc: 'When TL4 overloads, no static if/else router kicks in. The error is presented in memory context, allowing the LLM to replan.' },
    { num: 'Rule 6', title: 'Failure Is A First-Class Agent Event', desc: 'Exceptions and domain rejections are captured as structured AgentEvent records and broadcast over WebSocket.' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px 24px' }}>
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '12px' }}>
          GridMind System Architecture
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto' }}>
          Modular decoupling between The Brain (P1), The World (P2), The Hands (P3), and The Window (P4).
        </p>
      </div>

      {/* Visual System Flowchart Diagram */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textAlign: 'center' }}>
          Real-Time Closed-Loop Information Flow
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          {/* Node 1 */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>1. Trigger</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Mission Goal</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>Maintain critical loads</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>➔</div>

          {/* Node 2 */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-purple)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', textTransform: 'uppercase', fontWeight: 600 }}>2. P1 Agent Core</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Planner ↔ LLM</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Decides ToolCall</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>➔</div>

          {/* Node 3 */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-amber)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', textTransform: 'uppercase', fontWeight: 600 }}>3. P3 Capability</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Tool Registry</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Schema Checked</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>➔</div>

          {/* Node 4 */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>4. P2 Simulator</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>Grid Simulator</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Power Balance & Line Limits</div>
          </div>

          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>➔</div>

          {/* Node 5 */}
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-emerald)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', fontWeight: 600 }}>5. P4 Telemetry</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>FastAPI / WebSocket</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Live Browser Feed</div>
          </div>
        </div>
      </div>

      {/* Module Ownership Breakdown */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
          Module Ownership & Clean Contracts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {modules.map((m) => (
            <div key={m.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge" style={{ backgroundColor: `${m.color}22`, color: m.color, border: `1px solid ${m.color}` }}>
                  {m.id}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.title}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {m.path}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6 Golden Rules */}
      <section>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
          The 6 Golden Rules of the GridMind Framework
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {rules.map((r, i) => (
            <div key={i} className="glass-panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{r.num}</span>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.title}</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
