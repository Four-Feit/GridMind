import React, { useState } from 'react';
import { IconBrain, IconWifi, IconWifiOff } from '../ui/Icons';

export const Navbar = ({
  activePage,
  setActivePage,
  isMockMode,
  toggleMockMode,
  wsConnected,
  missionStatus
}) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const getStatusBadge = () => {
    const map = {
      RUNNING:   { bg: 'var(--accent-cyan-dim)',    color: 'var(--accent-cyan)',    label: 'RUNNING' },
      COMPLETED: { bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', label: 'COMPLETED' },
      FAILED:    { bg: 'var(--accent-rose-dim)',    color: 'var(--accent-rose)',    label: 'FAILED' },
      PAUSED:    { bg: 'var(--accent-amber-dim)',   color: 'var(--accent-amber)',   label: 'PAUSED' },
    };
    const s = map[missionStatus];
    if (!s) return null;
    return (
      <span className="badge" style={{
        backgroundColor: s.bg, color: s.color, border: `1px solid ${s.color}`
      }}>
        {s.label === 'RUNNING' && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color,
            display: 'inline-block', animation: 'pulse-ring 1.8s infinite'
          }} />
        )}
        {s.label}
      </span>
    );
  };

  const navItems = [
    { id: 'landing',      label: 'Home' },
    { id: 'dashboard',    label: 'Mission Control' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'events',       label: 'Event Log' },
  ];

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-card)',
      backgroundColor: 'rgba(248, 250, 252, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--page-padding)',
      boxShadow: '0 1px 0 0 var(--border-card)',
    }}>
      {/* Brand */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        onClick={() => setActivePage('landing')}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-cyan)',
        }}>
          <IconBrain size={19} color="#ffffff" />
        </div>
        <span style={{
          fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
        }}>
          Grid<span style={{ color: 'var(--accent-cyan)' }}>Mind</span>
        </span>
      </div>

      {/* Center Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const isHovered = hoveredItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-cyan)' : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'),
                backgroundColor: isActive ? 'var(--accent-cyan-dim)' : (isHovered ? 'var(--bg-tertiary)' : 'transparent'),
                border: isActive ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {getStatusBadge()}

        {/* Live / Mock mode indicator */}
        <button
          onClick={toggleMockMode}
          title="Toggle between Live Backend and Mock Demo Mode"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-card)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '0.75rem', fontWeight: 600,
            color: isMockMode ? 'var(--accent-amber)' : (wsConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'),
            transition: 'all var(--transition-fast)',
          }}
        >
          {isMockMode ? (
            <>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'var(--accent-amber)', flexShrink: 0 }} />
              <span>MOCK</span>
            </>
          ) : (
            <>
              {wsConnected
                ? <IconWifi size={13} color="var(--accent-emerald)" />
                : <IconWifiOff size={13} color="var(--accent-rose)" />}
              <span>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
