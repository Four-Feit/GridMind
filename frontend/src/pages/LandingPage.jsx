import React from 'react';
import {
  IconBrain,
  IconPlay,
  IconShield,
  IconArrowRight
} from '../components/ui/Icons';

export const LandingPage = ({ onOpenDashboard, onOpenArchitecture }) => {
  const agentLoopSteps = [
    { step: '01', title: 'Observe', desc: 'Ingests physical telemetry from grid simulator (generators, line capacities, disconnected loads).', color: 'var(--accent-cyan)' },
    { step: '02', title: 'Plan', desc: 'LLM analyzes memory, previous failures, and ground-truth constraints to synthesize strategy.', color: 'var(--accent-purple)' },
    { step: '03', title: 'Select', desc: 'Dynamically chooses capability from registry without hardcoded if/else routing rules.', color: 'var(--accent-blue)' },
    { step: '04', title: 'Validate', desc: 'Pre-flight action validator checks argument schemas and safety boundaries prior to dispatch.', color: 'var(--accent-amber)' },
    { step: '05', title: 'Execute', desc: 'Simulator applies physical action. Catches domain failures (e.g. transmission line overload).', color: 'var(--accent-emerald)' },
    { step: '06', title: 'Recover & Replan', desc: 'Failure fed back into agent context. Evaluates alternatives autonomously until verified.', color: 'var(--accent-rose)' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px 80px 24px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '64px', position: 'relative' }}>
        {/* Glow badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--accent-cyan-dim)',
          border: '1px solid var(--accent-cyan)',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '24px'
        }}>
          <IconBrain size={14} color="var(--accent-cyan)" />
          <span>From-Scratch Mini Agent Framework</span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          color: 'var(--text-primary)',
          marginBottom: '20px'
        }}>
          Build the Brain, <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Not the Puppet.
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '740px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6
        }}>
          GridMind exposes the hidden reasoning of an autonomous AI agent operating a mission-critical power grid.
          Watch real-time observation, dynamic tool selection, failure recovery, and code-verified constraint validation.
        </p>

        {/* Call to Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-cyan)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: 'var(--glow-cyan)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <IconPlay size={18} color="#ffffff" />
            <span>Launch Mission Control</span>
          </button>

          <button
            onClick={onOpenArchitecture}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Explore Architecture</span>
            <IconArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Visual Representation of the Agent Loop */}
      <section style={{ marginBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            The Autonomous Agent Execution Cycle
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            A closed-loop control system operating strictly through dynamic planning and physical feedback.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          {agentLoopSteps.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel glass-panel-hover"
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: item.color, fontWeight: 700 }}>
                    {item.step}
                  </span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy Callout: Build the Brain, Not the Puppet */}
      <section className="glass-panel" style={{ padding: '36px 40px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              <IconShield size={14} />
              <span>Core Architectural Principle</span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '14px' }}>
              No Hardcoded Agent Routing.
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
              Most hackathon AI agents are brittle puppets with hardcoded if/else conditions.
              GridMind operates as an authentic autonomous brain: when a planned action causes a line overload (TL4), the LLM experiences the failure, incorporates physical constraints into memory, and selects an alternative tool dynamically.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div>✓ Schema-verified inputs</div>
              <div>✓ Deterministic ground truth</div>
              <div>✓ Live WebSocket telemetry</div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem'
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>// contracts/agent_event.json</div>
            <div style={{ color: 'var(--accent-purple)' }}>&#123;</div>
            <div style={{ paddingLeft: '16px', color: 'var(--accent-cyan)' }}>"type": "TOOL_FAILED",</div>
            <div style={{ paddingLeft: '16px', color: 'var(--text-secondary)' }}>"tool": "redistribution_engine",</div>
            <div style={{ paddingLeft: '16px', color: 'var(--accent-rose)' }}>"error": "TRANSMISSION_OVERLOAD",</div>
            <div style={{ paddingLeft: '16px', color: 'var(--accent-amber)' }}>"recovery": "REPLAN_TRIGGERED",</div>
            <div style={{ paddingLeft: '16px', color: 'var(--accent-emerald)' }}>"next_action": "priority_load_manager"</div>
            <div style={{ color: 'var(--accent-purple)' }}>&#125;</div>
          </div>
        </div>
      </section>
    </div>
  );
};
