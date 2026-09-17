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
      {/* Pill tabs */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        gap: '2px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {modes.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '8px 18px',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                fontSize: '0.85rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? (
                  mode.id === 'chaos' ? 'var(--accent-rose)' :
                  mode.id === 'manual' ? 'var(--accent-purple)' :
                  'var(--accent-cyan)'
                ) : 'var(--text-secondary)',
                backgroundColor: isActive ? (
                  mode.id === 'chaos' ? 'var(--accent-rose-dim)' :
                  mode.id === 'manual' ? 'var(--accent-purple-dim)' :
                  'var(--accent-cyan-dim)'
                ) : 'transparent',
                border: isActive ? `1px solid ${
                  mode.id === 'chaos' ? 'rgba(225,29,72,0.25)' :
                  mode.id === 'manual' ? 'rgba(124,58,237,0.25)' :
                  'rgba(2,132,199,0.25)'
                }` : '1px solid transparent',
                transition: 'all var(--transition-normal)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{mode.icon}</span>
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Mode description */}
      <p style={{
        marginTop: '10px',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          backgroundColor: activeMode === 'chaos' ? 'var(--accent-rose)' : activeMode === 'manual' ? 'var(--accent-purple)' : 'var(--accent-cyan)',
        }} />
        {modes.find(m => m.id === activeMode)?.desc}
      </p>
    </div>
  );
};
