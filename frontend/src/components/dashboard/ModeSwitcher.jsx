import React from 'react';

const modes = [
  {
    id: 'livestream',
    label: 'Livestream',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M20.49 3.51a12 12 0 0 1 0 16.97M3.51 20.49a12 12 0 0 1 0-16.97" />
      </svg>
    ),
    desc: 'Real-time agent telemetry and mission monitoring',
  },
  {
    id: 'manual',
    label: 'Manual Mode',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    desc: 'Directly adjust grid state: generation, loads, battery, lines',
  },
  {
    id: 'chaos',
    label: 'Chaos Mode',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    desc: 'Automated disturbance scenarios — watch the agent respond',
  },
];

export const ModeSwitcher = ({ activeMode, setActiveMode }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Cowboy Capsule Switcher */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'rgba(236, 229, 216, 0.65)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-full)',
        padding: '4px',
        gap: '4px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                border: 'none',
                boxShadow: isActive ? '0 2px 8px rgba(24, 24, 24, 0.2)' : 'none',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              <span style={{
                display: 'flex', alignItems: 'center',
                color: isActive ? (
                  mode.id === 'chaos' ? '#fca5a5' :
                  mode.id === 'manual' ? '#fde047' :
                  '#86efac'
                ) : 'inherit',
                opacity: isActive ? 1 : 0.65
              }}>
                {mode.icon}
              </span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode description with clear signal dots */}
      <p style={{
        marginTop: '10px',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          backgroundColor: activeMode === 'chaos' ? 'var(--accent-rose)' : activeMode === 'manual' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
          boxShadow: activeMode === 'chaos' ? '0 0 6px var(--accent-rose)' : activeMode === 'manual' ? '0 0 6px var(--accent-amber)' : '0 0 6px var(--accent-emerald)',
        }} />
        {modes.find(m => m.id === activeMode)?.desc}
      </p>
    </div>
  );
};
