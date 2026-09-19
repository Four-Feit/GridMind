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
  const [showBanner, setShowBanner] = useState(true);

  const getStatusBadge = () => {
    const map = {
      RUNNING:   { bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', label: 'RUNNING' },
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
    { id: 'developed-by', label: 'Developed By' },
  ];

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      {/* Top Black Announcement Ribbon (Cowboy Style) */}
      {showBanner && (
        <div style={{
          backgroundColor: '#141414',
          color: '#E8E4DC',
          fontSize: '0.78rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <span>
            Which GridMind autonomous system is right for your grid?{' '}
            <span
              onClick={() => setActivePage('architecture')}
              style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
            >
              Explore the architecture
            </span>
          </span>
          <button
            onClick={() => setShowBanner(false)}
            style={{
              position: 'absolute',
              right: '24px',
              color: '#8A8680',
              cursor: 'pointer',
              fontSize: '0.9rem',
              lineHeight: 1,
              border: 'none',
              background: 'none',
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <header style={{
        height: 'var(--header-height)',
        borderBottom: '1px solid var(--border-card)',
        backgroundColor: 'rgba(245, 241, 233, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--page-padding)',
        boxShadow: '0 1px 0 0 var(--border-card)',
      }}>
      {/* Brand — Cowboy Inspired Minimalist Industrial Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => setActivePage('landing')}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: 'var(--brand-grid)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(24, 24, 24, 0.16)',
        }}>
          <IconBrain size={18} color="#ffffff" />
        </div>
        <span style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.035em',
          color: 'var(--brand-grid)',
        }}>
          Grid<span style={{ color: 'var(--brand-mind)' }}>Mind</span><span style={{ color: 'var(--brand-mind)' }}>.</span>
        </span>
      </div>

      {/* Center Nav — Cowboy Pill Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'rgba(236, 229, 216, 0.55)',
        padding: '3px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-color)',
      }}>
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
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'),
                backgroundColor: isActive ? 'var(--text-primary)' : (isHovered ? 'rgba(255,255,255,0.65)' : 'transparent'),
                border: 'none',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {getStatusBadge()}

        {/* Live / Mock mode indicator — Clear Red/Green signals */}
        <button
          onClick={toggleMockMode}
          title="Toggle between Live Backend and Mock Demo Mode"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-card)',
            backgroundColor: 'var(--bg-secondary)',
            fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.04em',
            color: isMockMode ? 'var(--accent-amber)' : (wsConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'),
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)',
            cursor: 'pointer',
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
    </div>
  );
};

