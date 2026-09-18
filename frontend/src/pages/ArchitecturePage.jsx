import React, { useState, useEffect, useRef } from 'react';

/* ─── Theme ─────────────────────────────────────────────────────────────────── */
const C = {
  canvas: '#F5F1E9',
  card:   '#FCFAF6',
  white:  '#FFFFFF',
  ink:    '#181818',
  ink2:   '#3D3D3D',
  muted:  '#6B6660',
  faint:  '#9C9690',
  border: '#E2DBD0',
  mind:   '#16a34a',
  red:    '#dc2626',
  amber:  '#d97706',
};

/* ─── Stage Data ─────────────────────────────────────────────────────────────── */
const STAGES = [
  {
    num: '01',
    id:  'user',
    label: 'User / Goal',
    title: 'It all starts with a mission.',
    body: 'The operator defines the objective for GridMind — for example: keep critical facilities powered during a disruption. The goal, constraints, and priorities guide every downstream decision the agent makes.',
    quote: '"Keep the city running, even when things go wrong."',
    icon: '⬡',
    checklist: [
      'Define mission objective',
      'Set critical load priorities',
      'Optionally inject chaos faults',
      'Monitor agent progress live',
    ],
    bg: C.ink,
  },
  {
    num: '02',
    id:  'agent',
    label: 'Agent Core',
    title: 'The autonomous reasoning loop.',
    body: 'The Agent Core runs a closed loop: observe the grid physics, pass rich context to an LLM, validate the proposed action with code before executing it, and verify the outcome deterministically — never trusting the LLM\'s own assessment of success.',
    quote: '"No hardcoded rules. Pure closed-loop physical feedback."',
    icon: '◈',
    checklist: [
      'Observer reads raw grid physics',
      'Episodic memory adds failure context',
      'LLM selects best capability',
      'Outcome verified by Python code',
    ],
    bg: C.ink,
  },
  {
    num: '03',
    id:  'capabilities',
    label: 'Capabilities',
    title: 'Four sandboxed tools. Strict schemas.',
    body: 'The Capability Registry exposes four atomic actions to the LLM — each behind a strict Pydantic schema. The agent cannot invent arguments or call OS commands. Every tool either succeeds within physical limits or fails with a structured error the agent learns from.',
    quote: '"The LLM picks the tool. The schema enforces the rules."',
    icon: '⊕',
    checklist: [
      'Redistribution Engine — reroute power',
      'Priority Load Manager — shed factory first',
      'Battery Engine — dispatch reserve power',
      'Grid Analyzer — read-only inspection',
    ],
    bg: C.ink,
  },
  {
    num: '04',
    id:  'grid',
    label: 'Simulated Grid',
    title: 'Deterministic physics. Real constraints.',
    body: 'A digital twin of a real microgrid with two generators, a battery reserve, three substations, and five transmission lines with hard MW ceilings. The simulator enforces physical laws independently of the agent — overloaded lines trip automatically.',
    quote: '"Physics is immutable. It cannot be overridden by prompt."',
    icon: '◉',
    checklist: [
      'G1 Gas 150MW + G2 Solar 50MW',
      'B1 Battery Reserve — 100MWh',
      'Substations S1, S2, S3',
      'Transmission lines TL1–TL5',
    ],
    bg: C.ink,
  },
  {
    num: '05',
    id:  'validation',
    label: 'Validation & Recovery',
    title: 'The agent learns. Never repeats.',
    body: 'The Pre-Flight Validator blocks bad actions before they execute. The Outcome Validator checks that hospitals are powered — with Python code, not LLM assertion. When a tool fails, the Recovery Engine extracts a constraint from the error and feeds it back so the next plan is smarter.',
    quote: '"Success is proved by code. Failure is turned into knowledge."',
    icon: '⬟',
    checklist: [
      'Schema + bounds check before execution',
      'Code-verified critical load safety',
      'Learn constraints from failure payloads',
      'Autonomous replan with new context',
    ],
    bg: C.ink,
  },
  {
    num: '06',
    id:  'dashboard',
    label: 'Dashboard',
    title: 'Every decision. In real time.',
    body: 'A live WebSocket stream delivers every agent event — observation, plan, validation, execution, recovery — to Mission Control with sub-150ms latency. The Grid Visualizer, Agent Brain Panel, and Event Timeline give full transparency into every autonomous decision.',
    quote: '"Nothing hidden. Complete auditability for every action."',
    icon: '⬟',
    checklist: [
      'WebSocket stream — zero polling',
      'Live power flows and line states',
      'LLM reasoning chain exposed',
      'Full immutable audit trail',
    ],
    bg: C.ink,
  },
];

/* ─── Perspective Card Stack (right panel) ────────────────────────────────── */
function CardStack({ activeIdx }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: '1100px',
      perspectiveOrigin: '40% 50%',
    }}>
      <div style={{
        position: 'relative',
        width: 260,
        height: 340,
        transformStyle: 'preserve-3d',
      }}>
        {STAGES.map((stage, i) => {
          const offset = i - activeIdx;
          const isActive = offset === 0;
          const isBehind = offset > 0;

          // Compute 3D transform: active card is front-centre,
          // future cards recede in perspective, past cards disappear
          let tx = offset * 72;
          let tz = offset * -90;
          let scale = Math.max(0.62, 1 - Math.abs(offset) * 0.1);
          let opacity = isActive ? 1 : isBehind ? Math.max(0.18, 0.72 - offset * 0.18) : 0;
          let ry = offset * 6;
          let zIndex = 100 - Math.abs(offset) * 10;

          if (offset < 0) return null; // hide past stages

          return (
            <div
              key={stage.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity,
                zIndex,
                transform: `translateX(${tx}px) translateZ(${tz}px) scale(${scale}) rotateY(${ry}deg)`,
                transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transformOrigin: 'center center',
                borderRadius: 18,
                backgroundColor: isActive ? C.white : 'rgba(252,250,246,0.8)',
                border: `${isActive ? 2 : 1}px solid ${isActive ? C.ink : C.border}`,
                boxShadow: isActive
                  ? '0 16px 48px rgba(24,24,24,0.16), 0 4px 16px rgba(0,0,0,0.08)'
                  : '0 4px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                padding: '22px 24px',
                gap: 12,
                pointerEvents: 'none',
              }}
            >
              {/* Stage number + icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: isActive ? C.mind : C.faint,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}>
                  STAGE {stage.num}
                </span>
                <span style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: isActive ? C.ink : 'rgba(24,24,24,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                  color: isActive ? '#fff' : C.faint,
                }}>
                  {stage.icon}
                </span>
              </div>

              {/* Label */}
              <div style={{
                fontSize: isActive ? '0.92rem' : '0.8rem',
                fontWeight: 800,
                color: isActive ? C.ink : C.muted,
                letterSpacing: '-0.01em',
              }}>
                {stage.label}
              </div>

              {/* Checklist — only on active card */}
              {isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {stage.checklist.map((item, ci) => (
                    <div key={ci} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%',
                        backgroundColor: C.mind,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        <span style={{ color: '#fff', fontSize: '0.6rem', fontWeight: 900 }}>✓</span>
                      </span>
                      <span style={{ fontSize: '0.76rem', color: C.ink2, lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtle label text on behind cards */}
              {!isActive && isBehind && (
                <div style={{ fontSize: '0.7rem', color: C.faint, lineHeight: 1.4, marginTop: 4 }}>
                  {stage.checklist[0]}
                </div>
              )}

              {/* Footer tag */}
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: isActive ? C.mind : C.faint,
                }}>
                  GridMind Architecture
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Horizontal Stepper ─────────────────────────────────────────────────────── */
function Stepper({ activeIdx, onStep }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0,
      marginBottom: 40,
      overflowX: 'auto',
      paddingBottom: 4,
    }}>
      {STAGES.map((stage, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;

        return (
          <React.Fragment key={stage.id}>
            {/* Step */}
            <button
              onClick={() => onStep(i)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                flexShrink: 0,
                minWidth: 80,
              }}
            >
              {/* Circle */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: isActive ? C.mind : isDone ? C.ink : 'transparent',
                border: `2px solid ${isActive ? C.mind : isDone ? C.ink : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: isActive ? `0 0 0 4px ${C.mind}25` : 'none',
              }}>
                {isDone ? (
                  <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 900 }}>✓</span>
                ) : (
                  <span style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    color: isActive ? '#fff' : C.faint,
                  }}>{stage.num}</span>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? C.ink : C.faint,
                textAlign: 'center',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                transition: 'color 0.3s ease',
              }}>
                {stage.label}
              </span>

              {/* Active underline */}
              <div style={{
                width: '100%', height: 2,
                backgroundColor: isActive ? C.mind : 'transparent',
                borderRadius: 99,
                transition: 'all 0.3s ease',
              }} />
            </button>

            {/* Connector line between steps */}
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 15,
                backgroundColor: i < activeIdx ? C.ink : C.border,
                transition: 'background-color 0.4s ease',
                minWidth: 20,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Left Content Panel ─────────────────────────────────────────────────────── */
function LeftPanel({ stage, onNext, onPrev, activeIdx, total }) {
  const [visible, setVisible] = useState(true);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      height: '100%',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {/* Stage badge */}
      <div style={{ marginBottom: 16 }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: C.mind,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          STAGE {stage.num}
        </span>
      </div>

      {/* Big title */}
      <h2 style={{
        fontSize: 'clamp(1.9rem, 3.2vw, 2.8rem)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        lineHeight: 1.1,
        color: C.ink,
        marginBottom: 6,
      }}>
        {stage.label}
      </h2>

      {/* Subtitle */}
      <p style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: C.mind,
        marginBottom: 18,
        letterSpacing: '-0.01em',
      }}>
        {stage.title}
      </p>

      {/* Body */}
      <p style={{
        fontSize: '0.88rem',
        color: C.ink2,
        lineHeight: 1.7,
        marginBottom: 20,
      }}>
        {stage.body}
      </p>

      {/* Quote block */}
      <div style={{
        borderLeft: `3px solid ${C.mind}`,
        paddingLeft: 16,
        marginBottom: 28,
        backgroundColor: 'rgba(22,163,74,0.05)',
        padding: '10px 14px 10px 16px',
        borderRadius: '0 8px 8px 0',
      }}>
        <p style={{
          fontSize: '0.84rem',
          fontStyle: 'italic',
          color: C.muted,
          lineHeight: 1.55,
          margin: 0,
        }}>
          {stage.quote}
        </p>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        {activeIdx > 0 && (
          <button
            onClick={onPrev}
            style={{
              padding: '10px 20px',
              borderRadius: 99,
              fontSize: '0.82rem',
              fontWeight: 700,
              border: `1.5px solid ${C.border}`,
              backgroundColor: 'transparent',
              color: C.ink,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}
          >
            ← Prev
          </button>
        )}

        {activeIdx < total - 1 ? (
          <button
            onClick={onNext}
            style={{
              padding: '10px 24px',
              borderRadius: 99,
              fontSize: '0.82rem',
              fontWeight: 800,
              border: 'none',
              backgroundColor: C.ink,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
              boxShadow: '0 3px 12px rgba(24,24,24,0.18)',
            }}
          >
            Next →
          </button>
        ) : (
          <span style={{ fontSize: '0.78rem', color: C.mind, fontWeight: 700 }}>
            ✓ Tour complete
          </span>
        )}

        {/* Progress counter */}
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.7rem',
          color: C.faint,
          fontWeight: 700,
        }}>
          {activeIdx + 1} / {total}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export const ArchitecturePage = ({ onOpenDashboard }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [panelKey, setPanelKey] = useState(0); // forces left panel re-mount for animation

  const goTo = (idx) => {
    if (idx < 0 || idx >= STAGES.length) return;
    setPanelKey(k => k + 1);
    setActiveIdx(idx);
  };

  const stage = STAGES[activeIdx];

  return (
    <div style={{
      backgroundColor: C.canvas,
      minHeight: '100vh',
      padding: '40px 40px 60px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 12px', borderRadius: 99,
              backgroundColor: 'rgba(236,229,216,0.8)', border: `1px solid ${C.border}`,
              fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: C.mind }} />
              System Architecture
            </div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              color: C.ink,
              margin: 0,
            }}>
              How <span style={{ color: C.mind }}>GridMind</span> Works
            </h1>
            <p style={{ fontSize: '0.85rem', color: C.muted, marginTop: 6 }}>
              A guided tour through the autonomous microgrid architecture.
            </p>
          </div>
          <p style={{
            fontSize: '0.7rem', color: C.faint, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'right',
          }}>
            Explore. Understand.<br />See the bigger picture.
          </p>
        </div>

        {/* ── Stepper ── */}
        <Stepper activeIdx={activeIdx} onStep={goTo} />

        {/* ── Main Stage Area ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          minHeight: 460,
          alignItems: 'center',
        }}>

          {/* Left: text content */}
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: '36px 36px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          }}>
            <LeftPanel
              key={panelKey}
              stage={stage}
              activeIdx={activeIdx}
              total={STAGES.length}
              onNext={() => goTo(activeIdx + 1)}
              onPrev={() => goTo(activeIdx - 1)}
            />
          </div>

          {/* Right: 3D card stack */}
          <div style={{
            backgroundColor: C.canvas,
            borderRadius: 20,
            height: 420,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Subtle dot grid */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: 0.6,
              pointerEvents: 'none',
            }} />

            {/* Gradient vignette edges */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse 80% 80% at 40% 50%, transparent 40%, ${C.canvas} 100%)`,
              pointerEvents: 'none',
              zIndex: 10,
            }} />

            <CardStack activeIdx={activeIdx} />
          </div>
        </div>

        {/* ── Bottom strip ── */}
        <div style={{
          marginTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14,
          backgroundColor: C.ink,
          borderRadius: 14,
          padding: '18px 26px',
        }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>See it run live. </span>
            <span style={{ fontSize: '0.83rem', color: '#A8A29E' }}>Inject a fault, watch the agent recover autonomously.</span>
          </div>
          <button
            onClick={onOpenDashboard}
            style={{
              padding: '9px 22px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 800,
              backgroundColor: '#fff', color: C.ink, border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Launch Mission Control →
          </button>
        </div>

      </div>
    </div>
  );
};
