import React from 'react';
import { IconBrain } from '../ui/Icons';

export const Footer = ({ activePage, setActivePage }) => {
  const navLinks = [
    { id: 'landing',      label: 'Home' },
    { id: 'dashboard',    label: 'Mission Control' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'events',       label: 'Event Log' },
  ];

  return (
    <footer style={{
      borderTop: '1px solid var(--border-card)',
      backgroundColor: 'var(--bg-secondary)',
      padding: '40px var(--page-padding) 32px',
      marginTop: '64px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconBrain size={17} color="#ffffff" />
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              GridMind
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: '260px' }}>
            A from-scratch autonomous agent framework operating inside a simulated power-grid environment.
          </p>
        </div>

        {/* Navigation column */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Navigate
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setActivePage && setActivePage(link.id)}
                style={{
                  fontSize: '0.85rem',
                  color: activePage === link.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: activePage === link.id ? 600 : 400,
                  textAlign: 'left',
                  transition: 'color var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = activePage === link.id ? 'var(--accent-cyan)' : 'var(--text-secondary)'}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tech column */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Built With
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Python 3.12 + FastAPI',
              'WebSocket real-time streaming',
              'React 19 + Vite',
              'From-scratch agent architecture',
            ].map((tech) => (
              <span key={tech} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', flexShrink: 0 }} />
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '36px',
        paddingTop: '20px',
        maxWidth: '1200px',
        margin: '36px auto 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          © 2024 GridMind. Hackathon project.
        </span>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          FastAPI • WebSocket • React 19
        </span>
      </div>
    </footer>
  );
};
