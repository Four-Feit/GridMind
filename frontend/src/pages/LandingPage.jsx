import React, { useEffect, useRef, useState } from 'react';
import { IconBrain, IconPlay, IconArrowRight, IconShield, IconZap, IconActivity } from '../components/ui/Icons';
import heroMicrogrid3D from '../assets/hero_microgrid_3d.jpg';

/* ── Scroll-reveal hook ── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

export const LandingPage = ({ onOpenDashboard, onOpenArchitecture }) => {
  const [stepsRef, stepsVisible] = useScrollReveal();
  const [principleRef, principleVisible] = useScrollReveal();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Actual GridMind Mission Control Physical Topology Entities
  const hotspots = [
    {
      id: 'g1',
      label: 'G1 PRIMARY GENERATION',
      detail: '140 / 150 MW · Online (Continuous Base)',
      x: '18%',
      y: '46%',
    },
    {
      id: 'g2_solar',
      label: 'G2 SOLAR FARM',
      detail: '40 / 50 MW · Weather-Adaptive Renewable',
      x: '31%',
      y: '42%',
    },
    {
      id: 'b1',
      label: 'B1 STORAGE RESERVE (BESS)',
      detail: '80 / 100 MWh · 40 MW Max Discharge',
      x: '36%',
      y: '68%',
    },
    {
      id: 's1_s2',
      label: 'SUBSTATIONS S1 & S2',
      detail: 'Transmission & Routing Hub · 180 MW Throughput',
      x: '50%',
      y: '50%',
    },
    {
      id: 'tl4',
      label: 'TL4 TRANSMISSION LINE',
      detail: 'S2 ➔ S3 Feeder · 40 / 60 MW Monitored',
      x: '64%',
      y: '30%',
    },
    {
      id: 's3_loads',
      label: 'S3 & CRITICAL LOADS',
      detail: 'Hospital (30MW) & Water Plant (25MW) Secured',
      x: '78%',
      y: '56%',
    },
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -(y * 10), y: x * 14 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setActiveHotspot(null);
  };

  const agentLoopSteps = [
    {
      step: '01', title: 'Observe',
      short: 'Physical grid telemetry ingestion.',
      detail: 'Live sensors read generators, line load capacities, substation telemetry, and unsupplied facility loads.',
      color: 'var(--brand-mind)',
    },
    {
      step: '02', title: 'Plan',
      short: 'LLM strategy synthesis.',
      detail: 'Synthesizes past failure memories, ground-truth constraints, and mission goals into a multi-step execution path.',
      color: 'var(--text-primary)',
    },
    {
      step: '03', title: 'Select Tool',
      short: 'Dynamic capability registry.',
      detail: 'Selects the exact required capability without hardcoded routing or brittle if/else chains.',
      color: 'var(--brand-mind)',
    },
    {
      step: '04', title: 'Validate',
      short: 'Pre-flight safety boundary check.',
      detail: 'Guarantees argument schemas and thermodynamic transmission constraints prior to simulator dispatch.',
      color: 'var(--accent-amber)',
    },
    {
      step: '05', title: 'Execute',
      short: 'Physical state actuation.',
      detail: 'Applies rerouting or battery injection to the simulator. Overloads and domain failures are trapped deterministically.',
      color: 'var(--accent-emerald)',
    },
    {
      step: '06', title: 'Recover',
      short: 'Failure as new context.',
      detail: 'Simulator failure feedback becomes fresh context for the reasoning loop to autonomously re-plan.',
      color: 'var(--accent-rose)',
    },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* ── 1. Hero Section (Cowboy Editorial Composition) ── */}
      <section style={{
        position: 'relative',
        minHeight: 'calc(100vh - 100px)',
        padding: '40px var(--page-padding) 36px',
        maxWidth: '1540px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Main 2-Column Hero Stage */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(360px, 1.25fr)',
          gap: '40px',
          alignItems: 'center',
          flex: 1,
          paddingTop: '20px',
        }}>
          {/* Left Column: Editorial Headline & Actions */}
          <div style={{ zIndex: 2 }}>
            {/* Eyebrow model category */}
            <div style={{
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
              marginBottom: '16px',
            }}>
              Autonomous Core 0.1
            </div>

            {/* Huge Headline (Matching Cowboy's "Go Dutch") */}
            <h1 style={{
              fontSize: 'clamp(3.8rem, 7.8vw, 6.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
              color: 'var(--text-primary)',
              marginBottom: '36px',
            }}>
              Go Autonomous
            </h1>

            {/* CTAs Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '36px',
            }}>
              <button
                onClick={onOpenDashboard}
                className="btn-pill btn-pill-primary"
                style={{
                  padding: '13px 36px',
                  fontSize: '0.96rem',
                  letterSpacing: '-0.01em',
                }}
              >
                <span>Explore</span>
              </button>

              <span style={{
                fontSize: '0.96rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '-0.01em',
              }}>
                From 0.2s replan
              </span>

              <button
                onClick={onOpenArchitecture}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.96rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  transition: 'opacity var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <span>Explore architecture</span>
                <span style={{ fontSize: '1.1rem' }}>›</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Interactive Microgrid Model Stage */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              perspective: '1200px',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Soft ambient studio glow behind 3D model */}
            <div style={{
              position: 'absolute',
              width: '90%',
              height: '90%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(245,241,233,0) 72%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />

            {/* 3D Transform Container */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              transition: 'transform 0.15s ease-out',
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transformStyle: 'preserve-3d',
            }}>
              {/* The 3D Rendered Model — Seamlessly blended into warm studio background */}
              <img
                src={heroMicrogrid3D}
                alt="GridMind 3D Autonomous Microgrid Ecosystem"
                style={{
                  width: '100%',
                  maxHeight: '560px',
                  objectFit: 'contain',
                  display: 'block',
                  border: 'none',
                  boxShadow: 'none',
                  maskImage: 'radial-gradient(ellipse 92% 86% at 50% 50%, black 62%, transparent 98%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 92% 86% at 50% 50%, black 62%, transparent 98%)',
                  mixBlendMode: 'multiply',
                }}
              />

              {/* Interactive Telemetry Hover Zones (Invisible Hit-Boxes with Smooth Tooltips) */}
              {hotspots.map((spot) => {
                const isHovered = activeHotspot === spot.id;
                return (
                  <div
                    key={spot.id}
                    style={{
                      position: 'absolute',
                      left: spot.x,
                      top: spot.y,
                      transform: 'translate(-50%, -50%)',
                      width: '110px',
                      height: '95px',
                      borderRadius: '50%',
                      zIndex: 20,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setActiveHotspot(spot.id)}
                    onMouseLeave={() => setActiveHotspot(null)}
                  >

                    {/* Interactive Telemetry Card Tooltip */}
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: `translateX(-50%) translateY(${isHovered ? '0' : '6px'})`,
                      backgroundColor: '#181818',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      opacity: isHovered ? 1 : 0,
                      transition: 'all 0.18s ease-out',
                      zIndex: 30,
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}>
                      <div style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        color: 'var(--accent-emerald)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginBottom: '2px',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                        {spot.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#E8E4DC', fontFamily: 'var(--font-mono)' }}>
                        {spot.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Feature Ticker (Exact 3-Column Cowboy Layout) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr)) 60px',
          gap: '30px',
          alignItems: 'flex-end',
          paddingTop: '32px',
          borderTop: '1px solid var(--border-color)',
          marginTop: '20px',
        }}>
          {/* Spec 1 */}
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Real-Time Telemetry
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px', letterSpacing: '-0.01em' }}>
              Zero-Human Self Healing
            </div>
          </div>

          {/* Spec 2 */}
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Custom AdaptivePower™
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px', letterSpacing: '-0.01em' }}>
              Automatic load balancing
            </div>
          </div>

          {/* Spec 3 */}
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
              Autonomous LLM Reasoning
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '3px', letterSpacing: '-0.01em' }}>
              Sub-second dynamic replan
            </div>
          </div>

          {/* Bottom-right floating beacon (Cowboy chat pill) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onOpenDashboard}
              title="Launch Live Mission"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'var(--text-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(24, 24, 24, 0.22)',
                cursor: 'pointer',
                border: 'none',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <IconPlay size={18} color="#ffffff" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. The 6-Stage Autonomous Loop Section ── */}
      <section
        ref={stepsRef}
        style={{
          padding: '100px var(--page-padding) 80px',
          maxWidth: '1540px',
          margin: '0 auto',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          marginBottom: '50px',
          opacity: stepsVisible ? 1 : 0,
          transform: stepsVisible ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--brand-mind)',
            marginBottom: '8px',
          }}>
            Autonomous Closed-Loop Engine
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            Engineered for Unbroken Continuity
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            maxWidth: '640px',
            marginTop: '12px',
            lineHeight: 1.6,
          }}>
            Every decision passes through an uncompromised closed feedback loop that balances generator constraints, storage reserves, and critical priority facilities.
          </p>
        </div>

        {/* 6 Clean Porcelain Step Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}>
          {agentLoopSteps.map((item, idx) => (
            <div
              key={item.step}
              className="glass-panel"
              style={{
                padding: '24px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-card)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '190px',
                opacity: stepsVisible ? 1 : 0,
                transform: stepsVisible ? 'none' : 'translateY(20px)',
                transition: `all 0.5s ease ${idx * 60}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'rgba(24, 24, 24, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-card)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: item.color,
                  }}>
                    {item.step}
                  </span>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.color }} />
                </div>
                <h4 style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}>
                  {item.title}
                </h4>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  {item.short}
                </p>
              </div>

              <div style={{
                fontSize: '0.73rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginTop: '14px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '10px',
              }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Core Principle Section (Editorial Split Banner) ── */}
      <section
        ref={principleRef}
        style={{
          padding: '40px var(--page-padding) 120px',
          maxWidth: '1540px',
          margin: '0 auto',
          opacity: principleVisible ? 1 : 0,
          transform: principleVisible ? 'none' : 'translateY(24px)',
          transition: 'opacity 0.65s ease, transform 0.65s ease',
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '52px 56px',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--brand-mind)',
              marginBottom: '16px',
            }}>
              <IconShield size={14} color="var(--brand-mind)" />
              <span>Fundamental Architecture</span>
            </div>

            <h3 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
              lineHeight: 1.12,
              marginBottom: '20px',
            }}>
              No Hardcoded Rules.<br />Pure Autonomous Recovery.
            </h3>

            <p style={{
              fontSize: '0.94rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: '24px',
            }}>
              When a transmission line trips or severe weather slashes solar yield, GridMind doesn’t execute predefined scripts. The agent experiences the domain violation, absorbs the physical feedback into memory, and synthesizes dynamic tool orchestrations.
            </p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span> Schema-verified capabilities
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span> Zero heuristic branching
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>✓</span> Real-time WebSocket streaming
              </span>
            </div>
          </div>

          {/* Minimalist Dark Syntax Terminal */}
          <div style={{
            backgroundColor: '#161616',
            color: '#E8E4DC',
            borderRadius: 'var(--radius-md)',
            padding: '28px 30px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            lineHeight: 1.75,
            boxShadow: '0 12px 32px rgba(24, 24, 24, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              <span style={{ color: '#888580', fontSize: '0.72rem', fontWeight: 600 }}>// TELEMETRY REPLAN DISPATCH</span>
              <span style={{ color: 'var(--accent-emerald)', fontSize: '0.7rem', fontWeight: 700 }}>VERIFIED</span>
            </div>
            <div><span style={{ color: '#888580' }}>1</span>  {'{'}</div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"event"</span>: <span style={{ color: 'var(--accent-rose)' }}>"TRANSMISSION_OVERLOAD"</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"target_line"</span>: <span style={{ color: '#FCD34D' }}>"TL4_S2_TO_S3"</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"measured_mw"</span>: <span style={{ color: 'var(--accent-rose)' }}>68.4</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"safety_ceiling_mw"</span>: <span>60.0</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"action_dispatched"</span>: <span style={{ color: 'var(--accent-emerald)' }}>"PRIORITY_LOAD_SHED"</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"shed_target"</span>: <span style={{ color: '#93C5FD' }}>"FACTORY_NON_CRITICAL"</span>,
            </div>
            <div style={{ paddingLeft: '20px' }}>
              <span style={{ color: '#E8E4DC' }}>"hospital_secured"</span>: <span style={{ color: 'var(--accent-emerald)' }}>true</span>
            </div>
            <div><span style={{ color: '#888580' }}>9</span>  {'}'}</div>
          </div>
        </div>
      </section>

      {/* ── 4. Bottom Launch Banner ── */}
      <section style={{
        padding: '60px var(--page-padding) 100px',
        maxWidth: '1540px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          backgroundColor: '#181818',
          color: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '60px 32px',
          boxShadow: '0 20px 50px rgba(24, 24, 24, 0.2)',
        }}>
          <h2 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            marginBottom: '16px',
            lineHeight: 1.1,
          }}>
            Ready to test autonomous grid intelligence?
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#B0ABA2',
            maxWidth: '560px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}>
            Experience real-time closed-loop decision making, automated chaos engineering, and physical simulator telemetry.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={onOpenDashboard}
              style={{
                backgroundColor: '#ffffff',
                color: '#181818',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '14px 36px',
                fontSize: '0.96rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <IconPlay size={16} color="#181818" />
              <span>Launch Mission Control</span>
            </button>

            <button
              onClick={onOpenArchitecture}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '14px 30px',
                fontSize: '0.96rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'; }}
            >
              <span>View Architecture Documentation ›</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
