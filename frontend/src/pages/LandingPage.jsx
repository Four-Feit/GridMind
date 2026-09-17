import React, { useEffect, useRef, useState } from 'react';
import { IconBrain, IconPlay, IconArrowRight } from '../components/ui/Icons';

/* ── Scroll-reveal hook ── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

/* ── Animated grid-dot background ── */
const GridBackground = () => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
      <defs>
        <pattern id="grid-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#0284c7" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dots)" />
    </svg>
    {/* Subtle gradient overlay so dots fade towards bottom */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to bottom, transparent 30%, var(--bg-primary) 100%)'
    }} />
  </div>
);

/* ── Step connector arrow ── */
const StepArrow = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, color: 'var(--text-muted)', fontSize: '1.1rem',
    padding: '0 4px',
  }}>
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
      <path d="M0 8h16M12 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const LandingPage = ({ onOpenDashboard, onOpenArchitecture }) => {
  const [stepsRef, stepsVisible] = useScrollReveal();
  const [principleRef, principleVisible] = useScrollReveal();

  const agentLoopSteps = [
    {
      step: '01', title: 'Observe',
      short: 'Ingest physical grid telemetry.',
      detail: 'Reads live generators, line capacities, substation states, and disconnected loads from the simulator.',
      color: '#0284c7',
    },
    {
      step: '02', title: 'Plan',
      short: 'LLM synthesises a strategy.',
      detail: 'Analyzes memory, previous failures, and ground-truth constraints to choose the best next action.',
      color: '#7c3aed',
    },
    {
      step: '03', title: 'Select Tool',
      short: 'Dynamically picks a capability.',
      detail: 'Chooses from the registered capability registry with no hardcoded routing rules.',
      color: '#2563eb',
    },
    {
      step: '04', title: 'Validate',
      short: 'Pre-flight safety check.',
      detail: 'Validates argument schemas and safety boundaries before the action is dispatched.',
      color: '#d97706',
    },
    {
      step: '05', title: 'Execute',
      short: 'Simulator applies the action.',
      detail: 'Physical changes are applied. Domain failures (e.g. transmission overload) are caught and structured.',
      color: '#059669',
    },
    {
      step: '06', title: 'Recover',
      short: 'Failure becomes new context.',
      detail: 'The failure is fed back into agent memory. The agent re-evaluates and picks an alternative autonomously.',
      color: '#e11d48',
    },
  ];

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* ── Hero Section ──────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '100px var(--page-padding) 120px',
        textAlign: 'center',
        minHeight: '76vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <GridBackground />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          {/* Badge */}
          <div
            className="animate-fade-in-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-cyan-dim)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.77rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
              marginBottom: '28px',
            }}
          >
            <IconBrain size={13} color="var(--accent-cyan)" />
            <span>Autonomous Agent Framework</span>
          </div>

          {/* Main Heading */}
          <h1
            className="animate-fade-in-up delay-100"
            style={{
              fontSize: 'clamp(3.2rem, 8vw, 6rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              color: 'var(--text-primary)',
              marginBottom: '24px',
            }}
          >
            Grid<span style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Mind</span>
          </h1>

          {/* Description */}
          <p
            className="animate-fade-in-up delay-200"
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: '620px',
              margin: '0 auto 44px',
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            A from-scratch autonomous agent operating inside a simulated power-grid. 
            It observes, plans, selects tools dynamically, recovers from failures, 
            and verifies outcomes — entirely through real-time reasoning.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-in-up delay-300"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}
          >
            <button
              onClick={onOpenDashboard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(2, 132, 199, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--glow-cyan)';
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#ffffff',
                fontWeight: 700, fontSize: '0.95rem',
                boxShadow: 'var(--glow-cyan)',
                transition: 'all var(--transition-normal)',
              }}
            >
              <IconPlay size={17} color="#ffffff" />
              <span>Launch Mission Control</span>
            </button>

            <button
              onClick={onOpenArchitecture}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-card)';
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '14px 24px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.95rem',
                transition: 'all var(--transition-normal)',
              }}
            >
              <span>View Architecture</span>
              <IconArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          color: 'var(--text-muted)', fontSize: '0.72rem',
          animation: 'fadeInUp 0.6s 1s both',
        }}>
          <span style={{ letterSpacing: '0.07em', textTransform: 'uppercase' }}>Scroll to explore</span>
          <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
            <rect x="5.5" y="0.5" width="5" height="9" rx="2.5" stroke="currentColor" />
            <circle cx="8" cy="5" r="1.5" fill="currentColor" style={{ animation: 'dash-flow 1.5s linear infinite' }} />
            <path d="M5 15l3 4 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── Agent Execution Cycle ─────────────────────────── */}
      <section
        ref={stepsRef}
        style={{
          padding: '80px var(--page-padding)',
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-card)',
          borderBottom: '1px solid var(--border-card)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: '52px',
            opacity: stepsVisible ? 1 : 0,
            transform: stepsVisible ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'var(--text-primary)', marginBottom: '10px',
            }}>
              The Autonomous Agent Execution Cycle
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A closed-loop control system operating strictly through dynamic planning and physical feedback.
            </p>
          </div>

          {/* Horizontal step sequence */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            overflowX: 'auto',
            paddingBottom: '8px',
          }}>
            {agentLoopSteps.map((item, idx) => (
              <React.Fragment key={item.step}>
                <div
                  className="step-card"
                  style={{
                    flex: '1 1 150px',
                    minWidth: '145px',
                    padding: '24px 18px',
                    borderRadius: idx === 0 ? 'var(--radius-md) 0 0 var(--radius-md)' : (idx === agentLoopSteps.length - 1 ? '0 var(--radius-md) var(--radius-md) 0' : '0'),
                    border: '1px solid var(--border-card)',
                    borderLeft: idx === 0 ? '1px solid var(--border-card)' : 'none',
                    backgroundColor: 'var(--bg-card)',
                    position: 'relative',
                    cursor: 'default',
                    transition: 'background-color var(--transition-normal), box-shadow var(--transition-normal)',
                    opacity: stepsVisible ? 1 : 0,
                    transform: stepsVisible ? 'none' : 'translateY(24px)',
                    transitionDelay: stepsVisible ? `${idx * 70}ms` : '0ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.boxShadow = `inset 0 2px 0 ${item.color}`;
                    e.currentTarget.style.zIndex = 2;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.zIndex = 'auto';
                  }}
                >
                  {/* Top accent bar on hover */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    backgroundColor: item.color, borderRadius: 'inherit',
                    opacity: 0, transition: 'opacity var(--transition-fast)',
                  }} className="step-accent-bar" />

                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    color: item.color, fontWeight: 700, display: 'block', marginBottom: '10px',
                  }}>
                    {item.step}
                  </span>

                  <h4 style={{
                    fontSize: '0.95rem', fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: '8px',
                  }}>
                    {item.title}
                  </h4>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {item.short}
                  </p>

                  {/* Hover-reveal detail */}
                  <div className="hover-reveal-detail" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {item.detail}
                  </div>

                  {/* Bottom color indicator */}
                  <div style={{
                    position: 'absolute', bottom: 10, right: 12,
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: item.color, opacity: 0.6,
                  }} />
                </div>

                {/* Arrow connector between steps */}
                {idx < agentLoopSteps.length - 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, width: '28px', zIndex: 1,
                    color: 'var(--text-muted)',
                    opacity: stepsVisible ? 1 : 0,
                    transition: `opacity 0.5s ${idx * 70 + 100}ms`,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Loop back indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '10px', marginTop: '20px', color: 'var(--text-muted)',
            fontSize: '0.78rem', fontWeight: 500,
            opacity: stepsVisible ? 1 : 0, transition: 'opacity 0.6s 500ms',
          }}>
            <div style={{ width: 32, height: 1, backgroundColor: 'var(--border-card)' }} />
            <span>Continuous closed loop — repeats until mission objective verified</span>
            <div style={{ width: 32, height: 1, backgroundColor: 'var(--border-card)' }} />
          </div>
        </div>
      </section>

      {/* ── Core Principle Card ───────────────────────────── */}
      <section
        ref={principleRef}
        style={{
          padding: '80px var(--page-padding)',
          opacity: principleVisible ? 1 : 0,
          transform: principleVisible ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.65s ease, transform 0.65s ease',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px', alignItems: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '44px 48px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: 'var(--accent-purple)', fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Core Principle
              </div>
              <h3 style={{
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: 1.2,
              }}>
                No Hardcoded<br />Routing Rules.
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '18px' }}>
                When a planned action causes a transmission line overload, the agent experiences the failure,
                incorporates the physical constraint into memory, and selects an alternative tool dynamically —
                without any if/else branching in the source code.
              </p>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {['Schema-verified inputs', 'Deterministic ground truth', 'Live WebSocket telemetry'].map((f) => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>✓</span>{f}
                  </span>
                ))}
              </div>
            </div>

            {/* Code sample */}
            <div style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              padding: '22px 24px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              lineHeight: 1.7,
            }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '10px', fontSize: '0.68rem' }}>// agent_event.json</div>
              <div style={{ color: '#7c3aed' }}>{'{'}</div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#0284c7' }}>"type"</span>
                <span style={{ color: 'var(--text-secondary)' }}>: </span>
                <span style={{ color: '#e11d48' }}>"TOOL_FAILED"</span><span style={{ color: 'var(--text-muted)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#0284c7' }}>"tool"</span>
                <span style={{ color: 'var(--text-secondary)' }}>: </span>
                <span style={{ color: '#059669' }}>"redistribution_engine"</span><span style={{ color: 'var(--text-muted)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#0284c7' }}>"error"</span>
                <span style={{ color: 'var(--text-secondary)' }}>: </span>
                <span style={{ color: '#e11d48' }}>"TRANSMISSION_OVERLOAD"</span><span style={{ color: 'var(--text-muted)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#0284c7' }}>"recovery"</span>
                <span style={{ color: 'var(--text-secondary)' }}>: </span>
                <span style={{ color: '#d97706' }}>"REPLAN_TRIGGERED"</span><span style={{ color: 'var(--text-muted)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '16px' }}>
                <span style={{ color: '#0284c7' }}>"next_action"</span>
                <span style={{ color: 'var(--text-secondary)' }}>: </span>
                <span style={{ color: '#059669' }}>"priority_load_manager"</span>
              </div>
              <div style={{ color: '#7c3aed' }}>{'}'}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
