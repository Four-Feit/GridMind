import React, { useState } from 'react';
import { IconBrain } from '../components/ui/Icons';

const TEAM_MEMBERS = [
  {
    id: 'om',
    name: 'Om',
    role: 'Power Grid Simulation & Physics',
    bio: 'Engineered the core power flow solver, topology network models, and real-time physical simulation dynamics.',
    avatar: '/avatars/om.jpg',
    tags: ['Grid Simulation', 'Physics Engine', 'Power Flow'],
    tooltipX: 26,
    tooltipY: 22,
  },
  {
    id: 'himanshu',
    name: 'Himanshu',
    role: 'Agent Architecture & System Integration',
    bio: 'Engineered the autonomous agent decision loops, LLM reasoning pipelines, heuristic fail-safes, and end-to-end full-system integration.',
    avatar: '/avatars/himanshu.jpg',
    tags: ['Agent Framework', 'System Integration', 'FastAPI', 'System Design'],
    tooltipX: 39,
    tooltipY: 8,
  },
  {
    id: 'daksh',
    name: 'Daksh',
    role: 'Chaos Engineering & Frontend',
    bio: 'Engineered the chaos injection engine, cascading failure testing suite, and contributed to frontend interface components.',
    avatar: '/avatars/daksh.jpg',
    tags: ['Chaos Engineering', 'Frontend UI', 'Fault Injection'],
    tooltipX: 56,
    tooltipY: 8,
  },
  {
    id: 'arpit',
    name: 'Arpit',
    role: 'Agent Capabilities & Frontend UI',
    bio: 'Implemented agent capability extensions, action dispatch controls, and built the responsive frontend telemetry UI.',
    avatar: '/avatars/arpit.jpg',
    tags: ['Agent Capabilities', 'Frontend UI', 'React 19', 'Action Dispatch'],
    tooltipX: 73,
    tooltipY: 18,
  },
];

export const DevelopedByPage = () => {
  const [hoveredPhotoId, setHoveredPhotoId] = useState(null);
  const [hoveredTileId, setHoveredTileId] = useState(null);
  const [suppressedTileId, setSuppressedTileId] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [alwaysShowNames, setAlwaysShowNames] = useState(false);

  // Handle tile click: toggles selection; if already selected, releases the tile and clears its name
  const handleTileClick = (memberId) => {
    if (selectedMemberId === memberId) {
      // Releasing the tile
      setSelectedMemberId(null);
      setHoveredTileId(null);
      setSuppressedTileId(memberId); // Suppress hover so the name doesn't stay on the picture while cursor is still on the tile
    } else {
      // Selecting the tile
      setSelectedMemberId(memberId);
      setHoveredTileId(memberId);
      setSuppressedTileId(null);
    }
  };

  // Track cursor position across the 4 teammates dynamically on the photo
  const handleMouseMovePhoto = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;

    if (xPct < 33) {
      setHoveredPhotoId('om');
    } else if (xPct < 48) {
      setHoveredPhotoId('himanshu');
    } else if (xPct < 64) {
      setHoveredPhotoId('daksh');
    } else {
      setHoveredPhotoId('arpit');
    }
  };

  // When mouse leaves photo, clear hover immediately so it does not get stuck
  const handleMouseLeavePhoto = () => {
    setHoveredPhotoId(null);
  };

  const handleClickPhoto = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    let targetId = 'om';
    if (xPct >= 64) targetId = 'arpit';
    else if (xPct >= 48) targetId = 'daksh';
    else if (xPct >= 33) targetId = 'himanshu';

    if (selectedMemberId === targetId) {
      // Releasing via photo click
      setSelectedMemberId(null);
      setHoveredPhotoId(null);
    } else {
      setSelectedMemberId(targetId);
      const cardEl = document.getElementById(`member-card-${targetId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px var(--page-padding) 72px' }}>
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }} className="animate-fade-in-up">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--brand-mind-dim)',
          color: 'var(--brand-mind)',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-mind)' }} />
          The Builders
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 3.8vw, 3rem)',
          fontWeight: 800,
          letterSpacing: '-0.035em',
          color: 'var(--text-primary)',
          lineHeight: 1.15,
          marginBottom: '14px',
        }}>
          Developed by the Grid<span style={{ color: 'var(--brand-mind)' }}>Mind</span> Team
        </h1>

        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Hover over the photo or tiles below to reveal names. Click any tile or person to lock their view, and click again to release.
        </p>

        {/* Action Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
          <button
            onClick={() => setAlwaysShowNames(!alwaysShowNames)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: alwaysShowNames ? 'var(--text-primary)' : 'var(--bg-secondary)',
              color: alwaysShowNames ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span>{alwaysShowNames ? '✓ All Names Visible' : '👁️ Show All Names'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          maxWidth: '960px',
          margin: '0 auto 48px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: '#0F1115',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-xl)',
          userSelect: 'none',
        }}
      >
        {/* Helper Hint Ribbon */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 40,
          backgroundColor: 'rgba(20, 20, 20, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: '#E8E4DC',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', animation: 'pulse-ring 1.8s infinite' }} />
          Point to any person or hover on their tile to view • Click to lock/release
        </div>

        {/* Base Team Photo with Dynamic Mouse Tracking */}
        <div
          onMouseMove={handleMouseMovePhoto}
          onMouseLeave={handleMouseLeavePhoto}
          onClick={handleClickPhoto}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1024 / 768',
            display: 'block',
            cursor: 'pointer',
          }}
        >
          <img
            src="/team.jpg"
            alt="GridMind Development Team"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />

          {/* Soft Gradient Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.15) 100%)',
          }} />

          {/* Floating Name Badges */}
          {TEAM_MEMBERS.map((member) => {
            let showTooltip = false;
            let isPrimary = false;

            if (alwaysShowNames) {
              showTooltip = true;
              isPrimary = hoveredPhotoId === member.id || hoveredTileId === member.id || selectedMemberId === member.id;
            } else if (hoveredPhotoId !== null) {
              showTooltip = hoveredPhotoId === member.id;
              isPrimary = true;
            } else if (hoveredTileId !== null) {
              showTooltip = hoveredTileId === member.id;
              isPrimary = true;
            } else if (selectedMemberId !== null) {
              showTooltip = selectedMemberId === member.id;
              isPrimary = true;
            }

            if (!showTooltip) return null;

            return (
              <div
                key={member.id}
                style={{
                  position: 'absolute',
                  left: `${member.tooltipX}%`,
                  top: `${member.tooltipY}%`,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 35,
                  pointerEvents: 'none',
                  animation: 'fadeInUp 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(18, 18, 18, 0.94)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: isPrimary ? '1.5px solid #10B981' : '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#FFFFFF',
                  }}>
                    {member.name}
                  </span>
                </div>

                {/* Downward pointing arrow */}
                <div style={{
                  width: 0,
                  height: 0,
                  margin: '0 auto',
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: isPrimary ? '6px solid #10B981' : '6px solid rgba(18, 18, 18, 0.94)',
                }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Profiles & Descriptions Section */}
      <div style={{ marginBottom: '56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
          }}>
            Team Profiles & Contributions
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Hover to preview on photo • Click to lock / release
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {TEAM_MEMBERS.map((member) => {
            const isHovered = (hoveredTileId === member.id) || (hoveredPhotoId === member.id);
            const isSelected = selectedMemberId === member.id;
            const isHighlighted = isHovered || isSelected;

            return (
              <div
                key={member.id}
                id={`member-card-${member.id}`}
                onMouseEnter={() => {
                  if (suppressedTileId !== member.id) {
                    setHoveredTileId(member.id);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredTileId(null);
                  setSuppressedTileId(null);
                }}
                onClick={() => handleTileClick(member.id)}
                className="glass-panel"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected
                    ? '2px solid var(--brand-mind)'
                    : isHovered
                    ? '1.5px solid var(--border-focus)'
                    : '1px solid var(--border-card)',
                  boxShadow: isSelected
                    ? '0 12px 32px rgba(22, 163, 74, 0.2), var(--shadow-lg)'
                    : isHovered
                    ? 'var(--shadow-md)'
                    : 'var(--shadow-sm)',
                  transform: isHighlighted ? 'translateY(-4px)' : 'none',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#FFFFFF' : (isHovered ? '#FFFFFF' : 'var(--bg-card)'),
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active "Selected" Badge */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#ffffff',
                    backgroundColor: 'var(--brand-mind)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    Viewing
                  </div>
                )}

                {/* Avatar & Name Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: isSelected
                      ? '2.5px solid var(--brand-mind)'
                      : isHovered
                      ? '2px solid var(--text-primary)'
                      : '2px solid var(--border-card)',
                    boxShadow: isSelected ? '0 0 12px rgba(22, 163, 74, 0.35)' : 'var(--shadow-sm)',
                    flexShrink: 0,
                    transition: 'all var(--transition-fast)',
                  }}>
                    <img
                      src={member.avatar}
                      alt={member.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.2,
                    }}>
                      {member.name}
                    </h3>
                  </div>
                </div>

                {/* Role */}
                <p style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  marginBottom: '10px',
                }}>
                  {member.role}
                </p>

                {/* Bio / Description — highlighted when clicked */}
                <div style={{
                  backgroundColor: isSelected ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                  padding: isSelected ? '10px 12px' : '0',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  flex: 1,
                  transition: 'all var(--transition-normal)',
                  borderLeft: isSelected ? '3px solid var(--brand-mind)' : 'none',
                }}>
                  <p style={{
                    fontSize: '0.84rem',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 500 : 400,
                    lineHeight: 1.55,
                  }}>
                    {member.bio}
                  </p>
                </div>

                {/* Tech Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected
                          ? 'rgba(22, 163, 74, 0.08)'
                          : 'var(--bg-tertiary)',
                        color: isSelected ? 'var(--brand-mind)' : 'var(--text-secondary)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Project Heritage Banner */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--brand-grid)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconBrain size={22} color="#ffffff" />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Autonomous Electrical Grid Intelligence
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '560px' }}>
              Built from scratch by Om, Himanshu, Daksh, and Arpit. Combining agent reasoning,
              real-time physics flow simulation, and self-healing power grid topologies.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-card)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Team Four-Feit
          </span>
        </div>
      </div>
    </div>
  );
};
