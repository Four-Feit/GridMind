import React from 'react';

export const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      padding: '24px 32px',
      marginTop: '48px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>GridMind</span>
        <span>•</span>
        <span>Build the Brain, Not the Puppet</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span><strong style={{ color: 'var(--accent-purple)' }}>P1</strong> Brain</span>
        <span><strong style={{ color: 'var(--accent-cyan)' }}>P2</strong> Simulator</span>
        <span><strong style={{ color: 'var(--accent-amber)' }}>P3</strong> Capabilities</span>
        <span><strong style={{ color: 'var(--accent-emerald)' }}>P4</strong> Integration & UI</span>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        FastAPI • WebSocket • React 19
      </div>
    </footer>
  );
};
