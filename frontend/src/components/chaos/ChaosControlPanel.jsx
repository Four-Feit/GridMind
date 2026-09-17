import React, { useState } from 'react';
import {
  IconFlame,
  IconAlertTriangle,
  IconCpu,
  IconZap,
  IconSun,
  IconCheckCircle
} from '../ui/Icons';

export const ChaosControlPanel = ({ onInjectChaos, isLoading, onStep, onStart, missionStatus }) => {
  const [activeInjecting, setActiveInjecting] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const chaosPresets = [
    {
      id: 'substation_s2',
      title: 'Substation S2 Trip',
      desc: 'Trips substation S2 offline. Disconnects downstream Hospital load.',
      type: 'SUBSTATION_FAILURE',
      target: 'S2',
      params: {},
      accent: 'var(--accent-rose)',
      icon: <IconCpu size={16} />
    },
    {
      id: 'weather_solar',
      title: 'Weather Deterioration',
      desc: 'Severe storm reduces solar generation on G1 by 30MW.',
      type: 'WEATHER_DETERIORATION',
      target: 'G1',
      params: { drop_mw: 30 },
      accent: 'var(--accent-amber)',
      icon: <IconSun size={16} />
    },
    {
      id: 'demand_spike',
      title: 'Peak Demand Spike',
      desc: 'Sudden +25MW surge on Residential sector, testing grid balance.',
      type: 'DEMAND_SPIKE',
      target: 'RESIDENTIAL_1',
      params: { spike_mw: 25 },
      accent: 'var(--accent-cyan)',
      icon: <IconZap size={16} />
    },
    {
      id: 'line_overload',
      title: 'Trip Line TL4',
      desc: 'Trips transmission line TL4 to trigger rerouting recovery.',
      type: 'LINE_TRIP',
      target: 'TL4',
      params: {},
      accent: 'var(--accent-purple)',
      icon: <IconAlertTriangle size={16} />
    }
  ];

  const handleTrigger = async (preset) => {
    setActiveInjecting(preset.id);
    setFeedback(null);
    try {
      await onInjectChaos(preset.type, preset.target, preset.params);
      setFeedback({ success: true, message: `Injected: ${preset.title}` });
    } catch (err) {
      setFeedback({ success: false, message: `Failed: ${err.message}` });
    } finally {
      setActiveInjecting(null);
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconFlame size={18} color="var(--accent-rose)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chaos Engineering Injection Zone
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Tests LLM failure recovery & replanning capabilities
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '14px',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: feedback.success ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
          color: feedback.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          border: `1px solid ${feedback.success ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.success ? <IconCheckCircle size={15} /> : <IconAlertTriangle size={15} />}
            <span>
              <strong>{feedback.message}</strong>
              {feedback.success && missionStatus !== 'RUNNING' && (
                <span style={{ marginLeft: '6px', opacity: 0.9 }}>
                  — GridMind is currently IDLE. Activate agent to respond:
                </span>
              )}
            </span>
          </div>

          {feedback.success && missionStatus !== 'RUNNING' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {onStep && (
                <button
                  onClick={onStep}
                  disabled={isLoading}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--accent-emerald)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Step Agent Cycle
                </button>
              )}
              {onStart && (
                <button
                  onClick={() => onStart()}
                  disabled={isLoading}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--accent-emerald)',
                    border: '1px solid var(--accent-emerald)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Start Autonomous Loop
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chaos Buttons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '12px'
      }}>
        {chaosPresets.map((preset) => {
          const isBusy = activeInjecting === preset.id || isLoading;
          return (
            <div
              key={preset.id}
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: preset.accent }}>{preset.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {preset.title}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {preset.desc}
                </p>
              </div>

              <button
                onClick={() => handleTrigger(preset)}
                disabled={isBusy}
                style={{
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${preset.accent}`,
                  color: preset.accent,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy ? 0.6 : 1,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <IconFlame size={13} color={preset.accent} />
                <span>{activeInjecting === preset.id ? 'Injecting...' : 'Inject Fault'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
