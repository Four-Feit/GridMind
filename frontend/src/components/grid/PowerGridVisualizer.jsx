import React, { useState, useEffect } from 'react';
import {
  IconHospital,
  IconDroplet,
  IconFactory,
  IconBattery,
  IconAlertTriangle,
  IconCheckCircle,
  IconXCircle,
  IconZap
} from '../ui/Icons';

// SVG Viewport coordinate configuration (Guarantees zero clipping across all screen sizes)
const SVG_W = 980;
const SVG_H = 470;

export const PowerGridVisualizer = ({ gridState, onSelectEntity }) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMaximized) setIsMaximized(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized]);

  // Extract simulator entities safely
  const generators = gridState?.generators || [];
  const substations = gridState?.substations || [];
  const lines = gridState?.transmission_lines || [];
  const loads = gridState?.loads || [];
  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80, max_output_mw: 40, online: true };
  const failures = gridState?.failures || [];

  const g1 = generators.find((g) => g.id === 'G1') || { id: 'G1', capacity_mw: 150, available_mw: 140, online: true };
  const g2 = generators.find((g) => g.id === 'G2_SOLAR' || g.id === 'G2') || { id: 'G2_SOLAR', capacity_mw: 50, available_mw: 40, online: true };

  const s1 = substations.find((s) => s.id === 'S1') || { id: 'S1', online: true };
  const s2 = substations.find((s) => s.id === 'S2') || { id: 'S2', online: true };
  const s3 = substations.find((s) => s.id === 'S3') || { id: 'S3', online: true };

  const tl1 = lines.find((l) => l.id === 'TL1') || { id: 'TL1', capacity_mw: 80, load_mw: 50, online: true };
  const tl4 = lines.find((l) => l.id === 'TL4') || { id: 'TL4', capacity_mw: 60, load_mw: 40, online: true };

  const isTl4Overloaded = (tl4.load_mw || 0) > (tl4.capacity_mw || 60);

  const hospital = loads.find((l) => l.id === 'HOSPITAL') || { id: 'HOSPITAL', demand_mw: 30, supplied_mw: 30, connected: true, priority: 'critical' };
  const waterPlant = loads.find((l) => l.id === 'WATER_PLANT') || { id: 'WATER_PLANT', demand_mw: 25, supplied_mw: 25, connected: true, priority: 'critical' };
  const emergency = loads.find((l) => l.id === 'EMERGENCY_SERVICES') || { id: 'EMERGENCY_SERVICES', demand_mw: 15, supplied_mw: 15, connected: true, priority: 'critical' };
  const residential = loads.find((l) => l.id === 'RESIDENTIAL_ZONE' || l.id === 'RESIDENTIAL_1') || { id: 'RESIDENTIAL', demand_mw: 40, supplied_mw: 40, connected: true, priority: 'normal' };
  const factory = loads.find((l) => l.id === 'FACTORY') || { id: 'FACTORY', demand_mw: 40, supplied_mw: 40, connected: true, priority: 'normal' };

  // Dynamic Outage & Distress checks based on actual power supplied to each load
  const isHospitalDistressed = !hospital.connected || (hospital.supplied_mw || 0) < (hospital.demand_mw || 30);
  const isWaterDistressed = !waterPlant.connected || (waterPlant.supplied_mw || 0) < (waterPlant.demand_mw || 25);
  const isEmergencyDistressed = !emergency.connected || (emergency.supplied_mw || 0) < (emergency.demand_mw || 15);
  const isResidentialShed = !residential.connected || (residential.supplied_mw || 0) === 0;
  const isFactoryShed = !factory.connected || (factory.supplied_mw || 0) === 0;

  // S2 Degraded / Bypass state: S2 is tripped offline, but downstream loads are receiving power
  const criticalSuppliedMw = (hospital.supplied_mw || 0) + (waterPlant.supplied_mw || 0) + (emergency.supplied_mw || 0);
  const isDownstreamSupplied = criticalSuppliedMw > 0;
  const isS2Degraded = !s2.online && isDownstreamSupplied;
  const isS2Faulted = !s2.online && !isDownstreamSupplied;

  // Active inspected entity
  const inspectedId = selectedNodeId || hoveredNodeId;

  // Node connection relationships for line highlighting
  const nodeConnections = {
    'G1': ['G1-S1'],
    'G2_SOLAR': ['G2-S1'],
    'G2': ['G2-S1'],
    'S1': ['G1-S1', 'G2-S1', 'TL1'],
    'S2': ['TL1', 'TL4', 'B1-S2'],
    'B1': ['B1-S2'],
    'S3': ['TL4', 'S3-HOSPITAL', 'S3-WATER', 'S3-EMERGENCY', 'S3-RESIDENTIAL', 'S3-FACTORY'],
    'HOSPITAL': ['S3-HOSPITAL'],
    'WATER_PLANT': ['S3-WATER'],
    'EMERGENCY_SERVICES': ['S3-EMERGENCY'],
    'RESIDENTIAL_ZONE': ['S3-RESIDENTIAL'],
    'RESIDENTIAL': ['S3-RESIDENTIAL'],
    'FACTORY': ['S3-FACTORY'],
  };

  const isLineActiveForInspection = (lineKey) => {
    if (!inspectedId) return true; // default normal
    const connections = nodeConnections[inspectedId] || [];
    return connections.includes(lineKey);
  };

  // Node details dictionary for inspection drawer
  const getNodeDetails = (id) => {
    if (id === 'G1') return { title: 'Conventional Generator (G1)', type: 'Generation Source', status: g1.online ? 'Online' : 'Offline', stat: `${g1.available_mw} / ${g1.capacity_mw} MW`, note: 'Primary thermal dispatch generator' };
    if (id === 'G2_SOLAR' || id === 'G2') return { title: 'Solar Array (G2)', type: 'Renewable Generation', status: g2.online ? 'Online' : 'Offline', stat: `${g2.available_mw} / ${g2.capacity_mw} MW`, note: 'Subject to weather fluctuation chaos' };
    if (id === 'S1') return { title: 'Substation S1', type: 'Primary Generation Bus', status: s1.online ? 'Online' : 'Tripped', stat: 'Bus Voltage: 230kV', note: 'Aggregates generator output to transmission grid' };
    if (id === 'S2') {
      if (s2.online) {
        return { title: 'Substation S2', type: 'Transmission Switching Hub', status: 'Online', stat: `TL1 Load: ${tl1.load_mw}MW`, note: 'Normal routing through TL1 & TL4' };
      } else if (isS2Degraded) {
        return { title: 'Substation S2 (Degraded)', type: 'Emergency Bypass Mode', status: 'DEGRADED / RUNNING LOW', stat: `Bypass Flow: ${criticalSuppliedMw}MW`, note: 'Operating under emergency bypass routing; critical loads protected' };
      } else {
        return { title: 'Substation S2', type: 'Transmission Switching Hub', status: 'OFFLINE (FAULT)', stat: `TL1 Load: ${tl1.load_mw}MW`, note: 'Outage causing critical load disconnection' };
      }
    }
    if (id === 'B1') return { title: 'B1 Battery Storage', type: 'Grid Energy Storage', status: battery.online ? 'Online' : 'Offline', stat: `${battery.remaining_mwh} / ${battery.capacity_mwh} MWh`, note: `Max output capacity: ${battery.max_output_mw} MW` };
    if (id === 'S3') return { title: 'Substation S3', type: 'Distribution Feed Hub', status: s3.online ? 'Online' : 'Offline', stat: `Fed via TL4 (${tl4.load_mw}MW)`, note: 'Feeds hospital, water plant, emergency services, residential & industrial loads' };
    if (id === 'HOSPITAL') return { title: 'Metropolitan Hospital', type: 'Critical Priority Load', status: isHospitalDistressed ? 'DEFICIT / OUTAGE' : 'Protected', stat: `${hospital.supplied_mw} / ${hospital.demand_mw} MW`, note: 'Non-sheddable high-priority emergency facility' };
    if (id === 'WATER_PLANT') return { title: 'Municipal Water Plant', type: 'Critical Priority Load', status: isWaterDistressed ? 'DEFICIT / OUTAGE' : 'Protected', stat: `${waterPlant.supplied_mw} / ${waterPlant.demand_mw} MW`, note: 'Critical municipal water treatment & pumping' };
    if (id === 'EMERGENCY_SERVICES') return { title: 'Emergency Services Node', type: 'Critical Priority Load', status: isEmergencyDistressed ? 'DEFICIT / OUTAGE' : 'Protected', stat: `${emergency.supplied_mw} / ${emergency.demand_mw} MW`, note: 'First responders, 911 dispatch & communication towers' };
    if (id === 'RESIDENTIAL' || id === 'RESIDENTIAL_ZONE') return { title: 'Residential Zone', type: 'Standard Priority Load', status: isResidentialShed ? 'LOAD SHED' : 'Supplied', stat: `${residential.supplied_mw} / ${residential.demand_mw} MW`, note: 'Urban residential feeder' };
    if (id === 'FACTORY') return { title: 'Industrial Factory', type: 'Normal Priority Load', status: isFactoryShed ? 'LOAD SHED' : 'Connected', stat: `${factory.supplied_mw} / ${factory.demand_mw} MW`, note: isFactoryShed ? 'Shed to protect critical facilities' : 'Standard manufacturing demand' };
    return null;
  };

  const inspectedDetails = inspectedId ? getNodeDetails(inspectedId) : null;

  const handleNodeClick = (id, entity, entityType) => {
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(id);
      if (onSelectEntity) onSelectEntity({ id, ...entity, entityType });
    }
  };

  const handleCanvasClick = (e) => {
    // If clicking SVG background directly, clear selection
    if (e.target.tagName === 'svg' || e.target.id === 'svg-bg') {
      setSelectedNodeId(null);
    }
  };

  const renderContent = (fullscreen = false) => (
    <div
      className={fullscreen ? '' : 'glass-panel'}
      style={{
        padding: fullscreen ? '28px 32px' : '20px 24px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backgroundColor: fullscreen ? 'var(--bg-secondary)' : 'var(--bg-card)',
        borderRadius: fullscreen ? 'var(--radius-lg)' : 'var(--radius-md)',
        height: fullscreen ? '100%' : 'auto',
      }}
      onClick={handleCanvasClick}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Physical Grid Topology & Dynamic Power Flow
            </h3>
            <span style={{
              fontSize: '0.67rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4,
              backgroundColor: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)'
            }}>
              4-STAGE ARCHITECTURE
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Generation ➔ Transmission ➔ Distribution/Storage ➔ Connected Loads · Hover or click nodes to inspect
          </p>
        </div>

        {/* Legend & Maximize Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
              <span>Active Flow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
              <span>Overloaded / Degraded</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }} />
              <span>Fault / Offline</span>
            </div>
          </div>

          <button
            onClick={() => setIsMaximized((v) => !v)}
            title={fullscreen ? 'Close fullscreen' : 'Expand full topology'}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 11px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)', fontSize: '0.73rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            {fullscreen ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3" />
                </svg>
                <span>Collapse</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Outage Banner if Failures Exist */}
      {(failures.length > 0 || isHospitalDistressed) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          backgroundColor: isS2Degraded && !isHospitalDistressed ? 'var(--accent-amber-dim)' : 'var(--accent-rose-dim)',
          border: `1px solid ${isS2Degraded && !isHospitalDistressed ? 'var(--accent-amber)' : 'var(--accent-rose)'}`,
          fontSize: '0.78rem',
          color: isS2Degraded && !isHospitalDistressed ? 'var(--accent-amber)' : 'var(--accent-rose)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlertTriangle size={15} color={isS2Degraded && !isHospitalDistressed ? 'var(--accent-amber)' : 'var(--accent-rose)'} />
            <span style={{ fontWeight: 700 }}>
              {isS2Degraded && !isHospitalDistressed ? 'Grid Degraded Event:' : 'Grid Fault Event:'}
            </span>
            <span>
              {isS2Degraded && !isHospitalDistressed
                ? 'Substation S2 offline • Emergency Bypass active (Running Low / Critical Loads Protected)'
                : (failures.length > 0 ? failures.join(' • ') : 'Substation disturbance detected')}
            </span>
          </div>
          {isHospitalDistressed ? (
            <span style={{
              fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              backgroundColor: 'var(--accent-rose)', color: '#ffffff', fontSize: '0.7rem'
            }}>
              CRITICAL LOAD AT RISK
            </span>
          ) : isS2Degraded ? (
            <span style={{
              fontWeight: 700, padding: '2px 8px', borderRadius: 4,
              backgroundColor: 'var(--accent-amber)', color: '#ffffff', fontSize: '0.7rem'
            }}>
              DEGRADED BYPASS ACTIVE
            </span>
          ) : null}
        </div>
      )}

      {/* Responsive SVG Grid Canvas */}
      <div style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-card)',
        padding: '12px 0',
        overflow: 'hidden',
      }}>
        <svg
          id="grid-svg"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: fullscreen ? '70vh' : '460px',
            display: 'block',
            userSelect: 'none',
          }}
          onClick={handleCanvasClick}
        >
          {/* Background capture for deselect */}
          <rect id="svg-bg" x="0" y="0" width={SVG_W} height={SVG_H} fill="transparent" />

          {/* 4 Zone Header Labels in SVG */}
          <g opacity="0.65">
            <text x="95" y="32" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
              1. GENERATION
            </text>
            <text x="280" y="32" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
              2. TRANSMISSION (S1)
            </text>
            <text x="460" y="32" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
              3. ROUTING & STORAGE (S2 / B1)
            </text>
            <text x="645" y="32" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
              4. DISTRIBUTION (S3)
            </text>
            <text x="860" y="32" textAnchor="middle" fill="var(--text-muted)" fontSize="10.5" fontWeight="700" letterSpacing="0.08em">
              5. CONNECTED LOADS
            </text>

            {/* Subtle column guide dividers */}
            <line x1="185" y1="42" x2="185" y2="445" stroke="var(--border-subtle)" strokeDasharray="3 4" />
            <line x1="370" y1="42" x2="370" y2="445" stroke="var(--border-subtle)" strokeDasharray="3 4" />
            <line x1="550" y1="42" x2="550" y2="445" stroke="var(--border-subtle)" strokeDasharray="3 4" />
            <line x1="740" y1="42" x2="740" y2="445" stroke="var(--border-subtle)" strokeDasharray="3 4" />
          </g>

          {/* ─── Transmission & Flow Lines ─── */}
          {/* Base lines & Animated Flow Overlays */}
          {(() => {
            const linesData = [
              // G1 -> S1
              {
                id: 'G1-S1',
                d: 'M 155 155 C 195 155, 205 235, 225 240',
                online: g1.online && s1.online,
                color: 'var(--accent-cyan)',
                active: isLineActiveForInspection('G1-S1'),
              },
              // G2 -> S1
              {
                id: 'G2-S1',
                d: 'M 155 330 C 195 330, 205 255, 225 250',
                online: g2.online && s1.online,
                color: 'var(--accent-cyan)',
                active: isLineActiveForInspection('G2-S1'),
              },
              // TL1: S1 -> S2
              {
                id: 'TL1',
                d: 'M 335 245 L 400 245',
                online: tl1.online && s1.online && (s2.online || isS2Degraded),
                color: isS2Degraded ? 'var(--accent-amber)' : (tl1.online && s2.online ? 'var(--accent-cyan)' : 'var(--accent-rose)'),
                active: isLineActiveForInspection('TL1'),
                label: isS2Degraded ? `TL1: BYPASS (${criticalSuppliedMw}MW)` : `TL1: ${tl1.load_mw}/${tl1.capacity_mw}MW`,
                labelX: 367,
                labelY: 235,
              },
              // TL4: S2 -> S3 (Critical Overload Target)
              {
                id: 'TL4',
                d: 'M 520 245 L 585 245',
                online: tl4.online && (s2.online || isS2Degraded) && s3.online,
                overloaded: isTl4Overloaded || isS2Degraded,
                color: isS2Degraded || isTl4Overloaded ? 'var(--accent-amber)' : (s2.online && tl4.online ? 'var(--accent-cyan)' : 'var(--accent-rose)'),
                active: isLineActiveForInspection('TL4'),
                label: !tl4.online ? 'TL4: TRIPPED (0MW)' : (isS2Degraded ? `TL4: BYPASS (${criticalSuppliedMw}MW)` : `TL4: ${tl4.load_mw}/${tl4.capacity_mw}MW${isTl4Overloaded ? ' ⚠' : ''}`),
                labelX: 552,
                labelY: 235,
              },
              // B1 Storage Feed -> S2
              {
                id: 'B1-S2',
                d: 'M 460 365 L 460 295',
                online: battery.online && (s2.online || isS2Degraded),
                color: 'var(--accent-purple)',
                active: isLineActiveForInspection('B1-S2'),
              },
              // S3 -> Hospital
              {
                id: 'S3-HOSPITAL',
                d: 'M 705 225 C 745 225, 745 69, 785 69',
                online: hospital.connected && (hospital.supplied_mw > 0),
                color: !isHospitalDistressed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                active: isLineActiveForInspection('S3-HOSPITAL'),
              },
              // S3 -> Water Plant
              {
                id: 'S3-WATER',
                d: 'M 705 235 C 745 235, 745 147, 785 147',
                online: waterPlant.connected && (waterPlant.supplied_mw > 0),
                color: !isWaterDistressed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                active: isLineActiveForInspection('S3-WATER'),
              },
              // S3 -> Emergency Services
              {
                id: 'S3-EMERGENCY',
                d: 'M 705 245 C 745 245, 745 225, 785 225',
                online: emergency.connected && (emergency.supplied_mw > 0),
                color: !isEmergencyDistressed ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                active: isLineActiveForInspection('S3-EMERGENCY'),
              },
              // S3 -> Residential
              {
                id: 'S3-RESIDENTIAL',
                d: 'M 705 255 C 745 255, 745 303, 785 303',
                online: residential.connected && (residential.supplied_mw > 0),
                color: !isResidentialShed ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                active: isLineActiveForInspection('S3-RESIDENTIAL'),
              },
              // S3 -> Factory (Load Shed Target)
              {
                id: 'S3-FACTORY',
                d: 'M 705 265 C 745 265, 745 381, 785 381',
                online: factory.connected && (factory.supplied_mw > 0),
                color: !isFactoryShed ? 'var(--accent-cyan)' : 'var(--accent-amber)',
                active: isLineActiveForInspection('S3-FACTORY'),
              },
            ];

            return linesData.map((l) => {
              const opacity = inspectedId ? (l.active ? 1.0 : 0.12) : 0.8;
              const strokeWidth = l.active && inspectedId ? 3.5 : (l.overloaded ? 4 : 2.5);

              return (
                <g key={l.id} opacity={opacity} style={{ transition: 'opacity 0.2s ease' }}>
                  {/* Underlay trace */}
                  <path
                    d={l.d}
                    fill="none"
                    stroke={l.online ? 'var(--border-card)' : 'rgba(225,29,72,0.2)'}
                    strokeWidth={strokeWidth + 2}
                  />

                  {/* Flow animation path */}
                  <path
                    d={l.d}
                    fill="none"
                    stroke={l.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={l.online ? (l.overloaded ? '5 4' : '6 5') : '4 6'}
                    className={l.online ? (l.overloaded ? 'flow-overload' : 'flow-active') : 'flow-offline'}
                  />

                  {/* Optional Transmission Line Label */}
                  {l.label && (
                    <text
                      x={l.labelX}
                      y={l.labelY}
                      textAnchor="middle"
                      fill={l.overloaded ? 'var(--accent-amber)' : 'var(--text-muted)'}
                      fontSize="9.5"
                      fontFamily="var(--font-mono)"
                      fontWeight="700"
                    >
                      {l.label}
                    </text>
                  )}
                </g>
              );
            });
          })()}

          {/* ─── Grid Nodes ─── */}

          {/* 1. Generator G1 */}
          {(() => {
            const isHovered = hoveredNodeId === 'G1';
            const isSelected = selectedNodeId === 'G1';
            return (
              <g
                transform="translate(45, 115)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('G1')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('G1', g1, 'Generator'); }}
              >
                <rect
                  width="110" height="78" rx="8"
                  fill="var(--bg-card)"
                  stroke={isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)')}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill={g1.online ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="700">G1 Primary</text>
                <text x="14" y="42" fill="var(--text-muted)" fontSize="9.5" fontWeight="500">Thermal Plant</text>
                <text x="14" y="62" fill="var(--accent-cyan)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
                  {g1.available_mw} MW
                </text>
                <text x="80" y="62" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  /{g1.capacity_mw}
                </text>
              </g>
            );
          })()}

          {/* 2. Generator G2 (Solar) */}
          {(() => {
            const isHovered = hoveredNodeId === 'G2_SOLAR' || hoveredNodeId === 'G2';
            const isSelected = selectedNodeId === 'G2_SOLAR' || selectedNodeId === 'G2';
            return (
              <g
                transform="translate(45, 290)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('G2_SOLAR')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('G2_SOLAR', g2, 'Generator'); }}
              >
                <rect
                  width="110" height="78" rx="8"
                  fill="var(--bg-card)"
                  stroke={isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)')}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill={g2.online ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="700">G2 Solar</text>
                <text x="14" y="42" fill="var(--text-muted)" fontSize="9.5" fontWeight="500">Renewable Farm</text>
                <text x="14" y="62" fill="var(--accent-cyan)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
                  {g2.available_mw} MW
                </text>
                <text x="80" y="62" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  /{g2.capacity_mw}
                </text>
              </g>
            );
          })()}

          {/* 3. Substation S1 */}
          {(() => {
            const isHovered = hoveredNodeId === 'S1';
            const isSelected = selectedNodeId === 'S1';
            return (
              <g
                transform="translate(225, 205)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('S1')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('S1', s1, 'Substation'); }}
              >
                <rect
                  width="110" height="80" rx="8"
                  fill="var(--bg-card)"
                  stroke={isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)')}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill="var(--accent-emerald)" />
                <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="700">Substation S1</text>
                <text x="14" y="42" fill="var(--text-muted)" fontSize="9.5">Gen Aggregate Bus</text>
                <text x="14" y="64" fill="var(--accent-cyan)" fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="600">
                  230 kV Online
                </text>
              </g>
            );
          })()}

          {/* 4. Substation S2 (Primary Fault/Chaos Node) */}
          {(() => {
            const isHovered = hoveredNodeId === 'S2';
            const isSelected = selectedNodeId === 'S2';
            const isFaulted = isS2Faulted;
            const isDegraded = isS2Degraded;
            const s2Color = isFaulted ? 'var(--accent-rose)' : (isDegraded ? 'var(--accent-amber)' : (isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)')));
            const s2Bg = isFaulted ? 'var(--accent-rose-dim)' : (isDegraded ? 'var(--accent-amber-dim)' : 'var(--bg-card)');
            const s2Dot = isFaulted ? 'var(--accent-rose)' : (isDegraded ? 'var(--accent-amber)' : 'var(--accent-emerald)');
            const s2TitleColor = isFaulted ? 'var(--accent-rose)' : (isDegraded ? 'var(--accent-amber)' : 'var(--text-primary)');
            const s2SubColor = isFaulted ? 'var(--accent-rose)' : (isDegraded ? 'var(--accent-amber)' : 'var(--text-muted)');
            const s2ValColor = isFaulted ? 'var(--accent-rose)' : (isDegraded ? 'var(--accent-amber)' : 'var(--accent-cyan)');

            return (
              <g
                transform="translate(400, 205)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('S2')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('S2', s2, 'Substation'); }}
              >
                {/* Fault or Degraded aura */}
                {(isFaulted || isDegraded) && (
                  <rect
                    x="-4" y="-4" width="128" height="88" rx="12"
                    fill="none"
                    stroke={isFaulted ? 'var(--accent-rose)' : 'var(--accent-amber)'}
                    strokeWidth="2"
                    className="animate-fault"
                  />
                )}
                <rect
                  width="120" height="80" rx="8"
                  fill={s2Bg}
                  stroke={s2Color}
                  strokeWidth={isSelected || isFaulted || isDegraded ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill={s2Dot} />
                <text x="28" y="21" fill={s2TitleColor} fontSize="12" fontWeight="700">
                  Substation S2
                </text>
                <text x="14" y="42" fill={s2SubColor} fontSize="9.5" fontWeight={isFaulted || isDegraded ? 600 : 400}>
                  {isFaulted ? 'FAULT: Offline' : (isDegraded ? 'DEGRADED: Running Low' : 'Transmission Hub')}
                </text>
                <text x="14" y="64" fill={s2ValColor} fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
                  {isFaulted ? 'OUTAGE DETECTED' : (isDegraded ? 'EMERGENCY BYPASS' : 'TL1 ➔ TL4 Flow')}
                </text>
              </g>
            );
          })()}

          {/* 5. Battery B1 Storage */}
          {(() => {
            const isHovered = hoveredNodeId === 'B1';
            const isSelected = selectedNodeId === 'B1';
            return (
              <g
                transform="translate(400, 365)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('B1')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('B1', battery, 'Battery'); }}
              >
                <rect
                  width="120" height="74" rx="8"
                  fill="var(--bg-card)"
                  stroke={isSelected ? 'var(--accent-purple)' : (isHovered ? 'var(--accent-purple)' : 'var(--border-card)')}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(124,58,237,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill="var(--accent-purple)" />
                <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="700">B1 Storage</text>
                <text x="14" y="40" fill="var(--text-muted)" fontSize="9.5">Grid Reserve</text>
                <text x="14" y="58" fill="var(--accent-purple)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
                  {battery.remaining_mwh} MWh
                </text>
                <text x="75" y="58" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  /{battery.capacity_mwh}
                </text>
              </g>
            );
          })()}

          {/* 6. Substation S3 (Distribution Bus) */}
          {(() => {
            const isHovered = hoveredNodeId === 'S3';
            const isSelected = selectedNodeId === 'S3';
            const isS3Powered = s3.online && (tl4.online || hospital.supplied_mw > 0 || waterPlant.supplied_mw > 0 || emergency.supplied_mw > 0);
            return (
              <g
                transform="translate(585, 205)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('S3')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('S3', s3, 'Substation'); }}
              >
                <rect
                  width="120" height="80" rx="8"
                  fill="var(--bg-card)"
                  stroke={!isS3Powered ? 'var(--accent-rose)' : (isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || !isS3Powered ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="16" cy="18" r="5" fill={isS3Powered ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                <text x="28" y="21" fill="var(--text-primary)" fontSize="12" fontWeight="700">Substation S3</text>
                <text x="14" y="42" fill="var(--text-muted)" fontSize="9.5">Distribution Bus</text>
                <text x="14" y="64" fill={isS3Powered ? 'var(--accent-cyan)' : 'var(--accent-rose)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="600">
                  {isS3Powered ? '5 Feeder Lines' : 'TL4 FEED CUT'}
                </text>
              </g>
            );
          })()}

          {/* ─── Connected Loads (Zone 4: 5 Active Facilities) ─── */}

          {/* 7. Hospital (Critical) */}
          {(() => {
            const isHovered = hoveredNodeId === 'HOSPITAL';
            const isSelected = selectedNodeId === 'HOSPITAL';
            return (
              <g
                transform="translate(785, 38)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('HOSPITAL')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('HOSPITAL', hospital, 'Load'); }}
              >
                {isHospitalDistressed && (
                  <rect
                    x="-4" y="-4" width="148" height="70" rx="10"
                    fill="none" stroke="var(--accent-rose)" strokeWidth="2"
                    className="animate-fault"
                  />
                )}
                <rect
                  width="140" height="62" rx="8"
                  fill={isHospitalDistressed ? 'var(--accent-rose-dim)' : 'var(--bg-card)'}
                  stroke={isHospitalDistressed ? 'var(--accent-rose)' : (isSelected ? 'var(--accent-emerald)' : (isHovered ? 'var(--accent-emerald)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || isHospitalDistressed ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(5,150,105,0.2))' : 'none'}
                />
                <circle cx="15" cy="16" r="5" fill={isHospitalDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                <text x="26" y="19" fill="var(--text-primary)" fontSize="11" fontWeight="700">HOSPITAL</text>
                <rect x="92" y="9" width="40" height="14" rx="3" fill="var(--accent-emerald-dim)" />
                <text x="112" y="19" fill="var(--accent-emerald)" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  CRITICAL
                </text>
                <text x="14" y="36" fill="var(--text-muted)" fontSize="9">Emergency Medical</text>
                <text x="14" y="51" fill={isHospitalDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
                  {hospital.supplied_mw} / {hospital.demand_mw} MW
                </text>
              </g>
            );
          })()}

          {/* 8. Water Plant (Critical) */}
          {(() => {
            const isHovered = hoveredNodeId === 'WATER_PLANT';
            const isSelected = selectedNodeId === 'WATER_PLANT';
            return (
              <g
                transform="translate(785, 116)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('WATER_PLANT')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('WATER_PLANT', waterPlant, 'Load'); }}
              >
                {isWaterDistressed && (
                  <rect
                    x="-4" y="-4" width="148" height="70" rx="10"
                    fill="none" stroke="var(--accent-rose)" strokeWidth="2"
                    className="animate-fault"
                  />
                )}
                <rect
                  width="140" height="62" rx="8"
                  fill={isWaterDistressed ? 'var(--accent-rose-dim)' : 'var(--bg-card)'}
                  stroke={isWaterDistressed ? 'var(--accent-rose)' : (isSelected ? 'var(--accent-emerald)' : (isHovered ? 'var(--accent-emerald)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || isWaterDistressed ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(5,150,105,0.2))' : 'none'}
                />
                <circle cx="15" cy="16" r="5" fill={isWaterDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                <text x="26" y="19" fill="var(--text-primary)" fontSize="11" fontWeight="700">WATER PLANT</text>
                <rect x="92" y="9" width="40" height="14" rx="3" fill="var(--accent-emerald-dim)" />
                <text x="112" y="19" fill="var(--accent-emerald)" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  CRITICAL
                </text>
                <text x="14" y="36" fill="var(--text-muted)" fontSize="9">Municipal Supply</text>
                <text x="14" y="51" fill={isWaterDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
                  {waterPlant.supplied_mw} / {waterPlant.demand_mw} MW
                </text>
              </g>
            );
          })()}

          {/* 9. Emergency Services (Critical) */}
          {(() => {
            const isHovered = hoveredNodeId === 'EMERGENCY_SERVICES';
            const isSelected = selectedNodeId === 'EMERGENCY_SERVICES';
            return (
              <g
                transform="translate(785, 194)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('EMERGENCY_SERVICES')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('EMERGENCY_SERVICES', emergency, 'Load'); }}
              >
                {isEmergencyDistressed && (
                  <rect
                    x="-4" y="-4" width="148" height="70" rx="10"
                    fill="none" stroke="var(--accent-rose)" strokeWidth="2"
                    className="animate-fault"
                  />
                )}
                <rect
                  width="140" height="62" rx="8"
                  fill={isEmergencyDistressed ? 'var(--accent-rose-dim)' : 'var(--bg-card)'}
                  stroke={isEmergencyDistressed ? 'var(--accent-rose)' : (isSelected ? 'var(--accent-emerald)' : (isHovered ? 'var(--accent-emerald)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || isEmergencyDistressed ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(5,150,105,0.2))' : 'none'}
                />
                <circle cx="15" cy="16" r="5" fill={isEmergencyDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} />
                <text x="26" y="19" fill="var(--text-primary)" fontSize="11" fontWeight="700">EMERGENCY</text>
                <rect x="92" y="9" width="40" height="14" rx="3" fill="var(--accent-emerald-dim)" />
                <text x="112" y="19" fill="var(--accent-emerald)" fontSize="7.5" fontWeight="800" textAnchor="middle">
                  CRITICAL
                </text>
                <text x="14" y="36" fill="var(--text-muted)" fontSize="9">911 Dispatch Node</text>
                <text x="14" y="51" fill={isEmergencyDistressed ? 'var(--accent-rose)' : 'var(--accent-emerald)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
                  {emergency.supplied_mw} / {emergency.demand_mw} MW
                </text>
              </g>
            );
          })()}

          {/* 10. Residential Zone */}
          {(() => {
            const isHovered = hoveredNodeId === 'RESIDENTIAL';
            const isSelected = selectedNodeId === 'RESIDENTIAL';
            return (
              <g
                transform="translate(785, 272)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('RESIDENTIAL')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('RESIDENTIAL', residential, 'Load'); }}
              >
                <rect
                  width="140" height="62" rx="8"
                  fill={isResidentialShed ? 'var(--accent-amber-dim)' : 'var(--bg-card)'}
                  stroke={isResidentialShed ? 'var(--accent-amber)' : (isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || isResidentialShed ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="15" cy="16" r="5" fill={isResidentialShed ? 'var(--accent-amber)' : 'var(--accent-cyan)'} />
                <text x="26" y="19" fill="var(--text-primary)" fontSize="11" fontWeight="700">RESIDENTIAL</text>
                <rect x="96" y="9" width="36" height="14" rx="3" fill={isResidentialShed ? 'var(--accent-amber)' : 'var(--bg-tertiary)'} />
                <text x="114" y="19" fill={isResidentialShed ? '#ffffff' : 'var(--text-muted)'} fontSize="7.5" fontWeight="700" textAnchor="middle">
                  {isResidentialShed ? 'SHED' : 'NORMAL'}
                </text>
                <text x="14" y="36" fill="var(--text-muted)" fontSize="9">Metro Feeder</text>
                <text x="14" y="51" fill={isResidentialShed ? 'var(--accent-amber)' : 'var(--accent-cyan)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="600">
                  {isResidentialShed ? '0 MW (Load Shed)' : `${residential.supplied_mw} / ${residential.demand_mw} MW`}
                </text>
              </g>
            );
          })()}

          {/* 11. Factory (Industrial - Load Shed Target) */}
          {(() => {
            const isHovered = hoveredNodeId === 'FACTORY';
            const isSelected = selectedNodeId === 'FACTORY';
            return (
              <g
                transform="translate(785, 350)"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId('FACTORY')}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={(e) => { e.stopPropagation(); handleNodeClick('FACTORY', factory, 'Load'); }}
              >
                <rect
                  width="140" height="62" rx="8"
                  fill={isFactoryShed ? 'var(--accent-amber-dim)' : 'var(--bg-card)'}
                  stroke={isFactoryShed ? 'var(--accent-amber)' : (isSelected ? 'var(--accent-cyan)' : (isHovered ? 'var(--accent-cyan)' : 'var(--border-card)'))}
                  strokeWidth={isSelected || isFactoryShed ? '2.5' : '1.5'}
                  filter={isHovered || isSelected ? 'drop-shadow(0 4px 10px rgba(2,132,199,0.2))' : 'none'}
                />
                <circle cx="15" cy="16" r="5" fill={isFactoryShed ? 'var(--accent-amber)' : 'var(--accent-cyan)'} />
                <text x="26" y="19" fill="var(--text-primary)" fontSize="11.5" fontWeight="700">FACTORY</text>
                <rect x="96" y="9" width="36" height="14" rx="3" fill={isFactoryShed ? 'var(--accent-amber)' : 'var(--bg-tertiary)'} />
                <text x="114" y="19" fill={isFactoryShed ? '#ffffff' : 'var(--text-muted)'} fontSize="7.5" fontWeight="800" textAnchor="middle">
                  {isFactoryShed ? 'SHED' : 'NORMAL'}
                </text>
                <text x="14" y="36" fill="var(--text-muted)" fontSize="9">Heavy Industrial</text>
                <text x="14" y="51" fill={isFactoryShed ? 'var(--accent-amber)' : 'var(--text-primary)'} fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="600">
                  {isFactoryShed ? '0 MW (Load Shed)' : `${factory.supplied_mw} / ${factory.demand_mw} MW`}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Interactive Node Telemetry Inspector Drawer */}
      {inspectedDetails ? (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-card)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          animation: 'slideInDown 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconZap size={16} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {inspectedDetails.title}
                </span>
                <span className="badge" style={{
                  fontSize: '0.64rem',
                  backgroundColor: inspectedDetails.status.includes('FAULT') || inspectedDetails.status.includes('DEFICIT') ? 'var(--accent-rose-dim)' : 'var(--accent-emerald-dim)',
                  color: inspectedDetails.status.includes('FAULT') || inspectedDetails.status.includes('DEFICIT') ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                }}>
                  {inspectedDetails.status}
                </span>
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {inspectedDetails.type} · {inspectedDetails.note}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Operating Metric
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {inspectedDetails.stat}
              </span>
            </div>

            {selectedNodeId && (
              <button
                onClick={() => setSelectedNodeId(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-card)',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                Clear Selection ✕
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-tertiary)',
          fontSize: '0.73rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>Tip: Hover or click any grid node to inspect telemetry and highlight connected power flow paths.</span>
          <span>● Flow particles indicate live dynamic energy transmission</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderContent(false)}

      {/* Smooth Expanded Modal Overlay */}
      {isMaximized && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsMaximized(false); }}
        >
          <div style={{
            width: '94vw',
            maxWidth: '1500px',
            height: '90vh',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'auto',
            animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
            backgroundColor: 'var(--bg-secondary)',
          }}>
            <button
              onClick={() => setIsMaximized(false)}
              style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-card)',
                color: 'var(--text-secondary)', fontSize: '1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
