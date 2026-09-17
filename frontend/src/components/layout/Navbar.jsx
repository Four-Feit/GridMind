import React from 'react';
import {
  IconBrain,
  IconSun,
  IconMoon,
  IconWifi,
  IconWifiOff
} from '../ui/Icons';

export const Navbar = ({
  activePage,
  setActivePage,
  theme,
  toggleTheme,
  isMockMode,
  toggleMockMode,
  wsConnected,
  missionStatus
}) => {
  const getStatusBadge = () => {
    switch (missionStatus) {
      case 'RUNNING':
        return <span className="badge" style={{ backgroundColor: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }}>RUNNING</span>;
      case 'COMPLETED':
        return <span className="badge" style={{ backgroundColor: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald)' }}>COMPLETED</span>;
      case 'FAILED':
        return <span className="badge" style={{ backgroundColor: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)' }}>FAILED</span>;
      case 'PAUSED':
        return <span className="badge" style={{ backgroundColor: 'var(--accent-amber-dim)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }}>PAUSED</span>;
      default:
        return <span className="badge" style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>IDLE</span>;
    }
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      {/* Brand & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => setActivePage('landing')}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-cyan)'
        }}>
          <IconBrain size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Grid<span style={{ color: 'var(--accent-cyan)' }}>Mind</span>
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              P4 UI
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Build the Brain, Not the Puppet
          </div>
        </div>
      </div>

      {/* Center Nav Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {[
          { id: 'landing', label: 'Welcome' },
          { id: 'dashboard', label: 'Mission Control' },
          { id: 'architecture', label: 'Architecture' },
          { id: 'events', label: 'Event Log' },
        ].map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                transition: 'all var(--transition-fast)'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Mission Status Badge */}
        {getStatusBadge()}

        {/* Live / Mock Mode Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          fontSize: '0.75rem'
        }}>
          <button
            onClick={toggleMockMode}
            title="Toggle between Live FastAPI Backend and Isolated Mock Demo Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: isMockMode ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              fontWeight: 600
            }}
          >
            {isMockMode ? (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
                <span>MOCK MODE</span>
              </>
            ) : (
              <>
                {wsConnected ? <IconWifi size={14} color="var(--accent-emerald)" /> : <IconWifiOff size={14} color="var(--status-danger)" />}
                <span>{wsConnected ? 'LIVE STREAM' : 'DISCONNECTED'}</span>
              </>
            )}
          </button>
        </div>

        {/* Light / Dark Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            transition: 'color var(--transition-fast)'
          }}
        >
          {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>
      </div>
    </header>
  );
};
