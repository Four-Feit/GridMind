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
      icon: <IconCpu size={15} />
    },
    {
      id: 'weather_solar',
      title: 'Weather Deterioration',
      desc: 'Severe storm reduces solar generation on G2 by 30MW.',
      type: 'WEATHER_DETERIORATION',
      target: 'G2_SOLAR',
      params: { drop_mw: 30 },
      icon: <IconSun size={15} />
    },
    {
      id: 'demand_spike',
      title: 'Peak Demand Spike',
      desc: 'Sudden +25MW surge on Residential sector, testing grid balance.',
      type: 'DEMAND_SPIKE',
      target: 'RESIDENTIAL_ZONE',
      params: { spike_mw: 25 },
      icon: <IconZap size={15} />
    },
    {
      id: 'line_overload',
      title: 'Trip Line TL4',
      desc: 'Trips transmission line TL4 to trigger rerouting recovery.',
      type: 'LINE_TRIP',
      target: 'TL4',
      params: {},
      icon: <IconAlertTriangle size={15} />
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
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-card)',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-rose-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconFlame size={16} color="var(--accent-rose)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Chaos Engineering
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Simulate grid disturbances & observe LLM recovery
            </span>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-rose-dim)',
            color: 'var(--accent-rose)',
            border: '1px solid var(--accent-rose)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          FAULT INJECTION
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.8rem',
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
                  — GridMind is IDLE. Trigger agent cycle:
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
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--accent-emerald)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Step Cycle
                </button>
              )}
              {onStart && (
                <button
                  onClick={() => onStart()}
                  disabled={isLoading}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--text-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Start Loop
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chaos Buttons Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        {chaosPresets.map((preset) => {
          const isBusy = activeInjecting === preset.id || isLoading;
          return (
            <div
              key={preset.id}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                transition: 'border-color var(--transition-fast)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{preset.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    {preset.title}
                  </span>
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  {preset.desc}
                </p>
              </div>

              <button
                onClick={() => handleTrigger(preset)}
                disabled={isBusy}
                style={{
                  padding: '7px 14px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--accent-rose)',
                  color: 'var(--accent-rose)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  opacity: isBusy ? 0.6 : 1,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <IconFlame size={12} color="var(--accent-rose)" />
                <span>{activeInjecting === preset.id ? 'Injecting...' : 'Inject Fault'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
