import React, { useState, useRef, useEffect } from 'react';

const CHAOS_TYPES = [
  { id: 'SUBSTATION_FAILURE', label: 'Substation Trip', target: 'S2', params: {}, color: 'var(--accent-rose)', desc: 'Trips S2 substation, disconnecting downstream loads.' },
  { id: 'WEATHER_DETERIORATION', label: 'Weather Drop', target: 'G1', params: { drop_mw: 30 }, color: 'var(--accent-amber)', desc: 'Severe storm reduces generation by 30MW.' },
  { id: 'DEMAND_SPIKE', label: 'Demand Spike', target: 'RESIDENTIAL_1', params: { spike_mw: 25 }, color: 'var(--accent-cyan)', desc: '+25MW surge on residential sector.' },
  { id: 'LINE_TRIP', label: 'Line Trip TL4', target: 'TL4', params: {}, color: 'var(--accent-purple)', desc: 'Trips TL4 forcing the agent to reroute.' },
];

export const ChaosModePanel = ({ injectChaos, events, gridState, isLoading }) => {
  const [running, setRunning] = useState(false);
  const [intensity, setIntensity] = useState(2);
  const [selectedTypes, setSelectedTypes] = useState(new Set(['SUBSTATION_FAILURE', 'DEMAND_SPIKE']));
  const [lastEvent, setLastEvent] = useState(null);
  const [injectionCount, setInjectionCount] = useState(0);
  const intervalRef = useRef(null);

  // Intensity → delay mapping (seconds)
  const intensityDelays = { 1: 15, 2: 8, 3: 5, 4: 3, 5: 2 };
  const delaySeconds = intensityDelays[intensity];

  const fireRandomChaos = async () => {
    const eligible = CHAOS_TYPES.filter(ct => selectedTypes.has(ct.id));
    if (eligible.length === 0) return;
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    try {
      await injectChaos(pick.id, pick.target, pick.params);
      setLastEvent({ ...pick, timestamp: new Date().toLocaleTimeString() });
      setInjectionCount(c => c + 1);
    } catch (_) {}
  };

  const startChaos = () => {
    setRunning(true);
    setInjectionCount(0);
    fireRandomChaos();
    intervalRef.current = setInterval(fireRandomChaos, delaySeconds * 1000);
  };

  const stopChaos = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Cleanup on unmount or when settings change while running
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggleType = (id) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // Count recent agent reactions
  const recentChaosEvents = events.filter(e => e.type === 'CHAOS_EVENT').length;
  const agentReplans = events.filter(e => e.type === 'REPLAN_STARTED').length;
  const agentDetected = events.filter(e => ['TOOL_FAILED', 'PLAN_INVALIDATED', 'OBSERVATION'].includes(e.type)).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {/* Control Panel */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Chaos Controller</h3>
        </div>

        {/* Start/Stop */}
        <button
          onClick={running ? stopChaos : startChaos}
          disabled={selectedTypes.size === 0}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', fontWeight: 700,
            color: running ? 'var(--accent-rose)' : '#ffffff',
            backgroundColor: running ? 'var(--accent-rose-dim)' : '#dc2626',
            border: running ? '2px solid rgba(225,29,72,0.4)' : '2px solid #dc2626',
            cursor: selectedTypes.size === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedTypes.size === 0 ? 0.5 : 1,
            transition: 'all var(--transition-normal)',
            marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {running ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'var(--accent-rose)' }} />
              Stop Chaos
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Auto-Chaos
            </>
          )}
        </button>

        {/* Intensity Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Intensity</span>
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-rose)' }}>
              {intensity}/5 · event every {delaySeconds}s
            </span>
          </div>
          <input
            type="range" min={1} max={5} step={1} value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            disabled={running}
            style={{
              width: '100%', height: 5, appearance: 'none', outline: 'none',
              borderRadius: 'var(--radius-full)', cursor: running ? 'not-allowed' : 'pointer',
              background: `linear-gradient(to right, #dc2626 ${(intensity - 1) / 4 * 100}%, var(--border-card) ${(intensity - 1) / 4 * 100}%)`,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Calm</span>
            <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Extreme</span>
          </div>
        </div>

        {/* Event Type Selection */}
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
          Event Types
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {CHAOS_TYPES.map((ct) => {
            const checked = selectedTypes.has(ct.id);
            return (
              <label key={ct.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div
                  onClick={() => !running && toggleType(ct.id)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? ct.color : 'var(--border-card)'}`,
                    backgroundColor: checked ? ct.color : 'transparent',
                    cursor: running ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {checked && <svg width="9" height="9" viewBox="0 0 12 12" fill="white"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
                </div>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: checked ? 600 : 400, color: checked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {ct.label}
                  </span>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>{ct.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Live Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Events Fired', value: injectionCount, color: 'var(--accent-rose)' },
            { label: 'Agent Replans', value: agentReplans, color: 'var(--accent-amber)' },
            { label: 'Chaos in Log', value: recentChaosEvents, color: 'var(--accent-rose)' },
            { label: 'Agent Detects', value: agentDetected, color: 'var(--accent-emerald)' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Last event */}
        {lastEvent && (
          <div className="glass-panel animate-slide-in-down" style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Last Injected Event
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-rose-dim)', color: 'var(--accent-rose)',
                border: '1px solid rgba(225,29,72,0.25)',
              }}>
                CHAOS
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lastEvent.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
                {lastEvent.timestamp}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lastEvent.desc}</p>
          </div>
        )}

        {/* Running indicator */}
        {running && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-rose-dim)',
            border: '1px solid rgba(225,29,72,0.25)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '0.82rem', color: 'var(--accent-rose)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: 'var(--accent-rose)',
              animation: 'pulse-ring 1.4s infinite',
            }} />
            <span>Auto-chaos running · next event in ~{delaySeconds}s · intensity {intensity}/5</span>
          </div>
        )}

        {/* Grid active faults */}
        {gridState?.failures?.length > 0 && (
          <div className="glass-panel" style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent-rose)', marginBottom: '8px' }}>
              Active Grid Faults
            </p>
            {gridState.failures.map((f, i) => (
              <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '1px' }}>⚠</span>
                {f}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
