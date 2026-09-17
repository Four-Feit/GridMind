import React, { useState } from 'react';
import {
  IconHospital,
  IconDroplet,
  IconFactory,
  IconBattery,
  IconAlertTriangle,
  IconCheckCircle,
  IconXCircle
} from '../ui/Icons';

export const PowerGridVisualizer = ({ gridState, onSelectEntity }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  const generators = gridState?.generators || [];
  const substations = gridState?.substations || [];
  const lines = gridState?.transmission_lines || [];
  const loads = gridState?.loads || [];
  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80, max_output_mw: 40, online: true };
  const failures = gridState?.failures || [];

  const handleNodeClick = (entity, type) => {
    const data = { ...entity, entityType: type };
    setSelectedNode(data);
    if (onSelectEntity) onSelectEntity(data);
  };

  const getSubstationStatus = (id) => {
    const sub = substations.find((s) => s.id === id);
    return sub ? sub.online : true;
  };

  const getLine = (id) => lines.find((l) => l.id === id) || { capacity_mw: 60, load_mw: 40, online: true };

  const tl1 = getLine('TL1');
  const tl4 = getLine('TL4');
  const isTl4Overloaded = (tl4.load_mw || 0) > (tl4.capacity_mw || 60);

  const hospital = loads.find((l) => l.id === 'HOSPITAL') || { demand_mw: 30, supplied_mw: 30, connected: true, priority: 'critical' };
  const waterPlant = loads.find((l) => l.id === 'WATER_PLANT') || { demand_mw: 25, supplied_mw: 25, connected: true, priority: 'critical' };
  const residential = loads.find((l) => l.id === 'RESIDENTIAL_1') || { demand_mw: 40, supplied_mw: 40, connected: true, priority: 'normal' };
  const factory = loads.find((l) => l.id === 'FACTORY') || { demand_mw: 45, supplied_mw: 45, connected: true, priority: 'normal' };

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Header with Title & Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              Physical Grid Topology & Real-time Flow
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            P2 Simulator Environment State • Single-line Transmission Model
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-cyan)' }} />
            <span>Online / Energized</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-rose)' }} />
            <span>Tripped / Offline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-amber)' }} />
            <span>Overloaded / Shed</span>
          </div>
        </div>
      </div>

      {/* Active Failures Alert Bar if any */}
      {failures.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-rose-dim)',
          border: '1px solid var(--accent-rose)',
          marginBottom: '16px',
          fontSize: '0.8rem',
          color: 'var(--accent-rose)'
        }}>
          <IconAlertTriangle size={16} color="var(--accent-rose)" />
          <span style={{ fontWeight: 600 }}>Active Outage Alert:</span>
          <span>{failures.join(' • ')}</span>
        </div>
      )}

      {/* SVG Canvas for Grid Connectivity & Nodes */}
      <div style={{
        width: '100%',
        minHeight: '380px',
        position: 'relative',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        {/* SVG Transmission Lines Overlay */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {/* S1 -> S2 (TL1) */}
          <line
            x1="30%" y1="35%"
            x2="50%" y2="35%"
            stroke={tl1.online ? 'var(--accent-cyan)' : 'var(--accent-rose)'}
            strokeWidth="3"
            className={tl1.online ? 'flow-active' : ''}
            strokeDasharray={tl1.online ? '6 4' : 'none'}
            opacity={tl1.online ? 0.8 : 0.4}
          />

          {/* S2 -> S3 (TL4) */}
          <line
            x1="50%" y1="35%"
            x2="70%" y2="35%"
            stroke={isTl4Overloaded ? 'var(--accent-amber)' : (tl4.online ? 'var(--accent-cyan)' : 'var(--accent-rose)')}
            strokeWidth={isTl4Overloaded ? '4' : '3'}
            className={isTl4Overloaded ? 'flow-overload' : (tl4.online ? 'flow-active' : '')}
            strokeDasharray="6 4"
            opacity={tl4.online ? 0.9 : 0.4}
          />

          {/* Generators -> S1 */}
          <line x1="15%" y1="25%" x2="30%" y2="35%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.6" strokeDasharray="4 4" />
          <line x1="15%" y1="45%" x2="30%" y2="35%" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.6" strokeDasharray="4 4" />

          {/* S3 -> Loads */}
          <line x1="70%" y1="35%" x2="88%" y2="20%" stroke={hospital.connected ? 'var(--accent-emerald)' : 'var(--accent-rose)'} strokeWidth="2" opacity="0.8" strokeDasharray="4 4" />
          <line x1="70%" y1="35%" x2="88%" y2="35%" stroke={waterPlant.connected ? 'var(--accent-emerald)' : 'var(--accent-rose)'} strokeWidth="2" opacity="0.8" strokeDasharray="4 4" />
          <line x1="70%" y1="35%" x2="88%" y2="52%" stroke={residential.connected ? 'var(--accent-cyan)' : 'var(--accent-rose)'} strokeWidth="2" opacity="0.8" strokeDasharray="4 4" />
          <line x1="70%" y1="35%" x2="88%" y2="68%" stroke={factory.connected ? 'var(--accent-cyan)' : 'var(--accent-amber)'} strokeWidth="2" opacity="0.8" strokeDasharray="4 4" />

          {/* Battery B1 -> S2/S3 Bus */}
          <line x1="50%" y1="78%" x2="50%" y2="35%" stroke={battery.online ? 'var(--accent-purple)' : 'var(--text-muted)'} strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />
        </svg>

        {/* Interactive Grid Nodes (Z-Index 2) */}
        <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '24px', alignItems: 'center', minHeight: '320px' }}>
          {/* Column 1: Generators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Generation Source
            </div>
            {generators.map((gen) => (
              <div
                key={gen.id}
                onClick={() => handleNodeClick(gen, 'Generator')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: `1px solid ${gen.online ? 'var(--border-color)' : 'var(--accent-rose)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{gen.id}</span>
                  <span className="badge" style={{
                    fontSize: '0.65rem',
                    backgroundColor: gen.online ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
                    color: gen.online ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                  }}>
                    {gen.online ? 'Online' : 'Trip'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {gen.available_mw} / {gen.capacity_mw} MW
                </div>
              </div>
            ))}
          </div>

          {/* Column 2: Substations S1 & S2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transmission Hubs
            </div>

            {/* S1 Substation */}
            <div
              onClick={() => handleNodeClick(substations.find(s => s.id === 'S1') || { id: 'S1' }, 'Substation')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Substation S1</span>
                <IconCheckCircle size={14} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Primary Gen Bus
              </div>
            </div>

            {/* TL1 Metric Pill */}
            <div style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              alignSelf: 'center',
              color: 'var(--accent-cyan)'
            }}>
              TL1: {tl1.load_mw} / {tl1.capacity_mw} MW
            </div>

            {/* S2 Substation (Chaos Target) */}
            {(() => {
              const s2Online = getSubstationStatus('S2');
              return (
                <div
                  onClick={() => handleNodeClick(substations.find(s => s.id === 'S2') || { id: 'S2' }, 'Substation')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: s2Online ? 'var(--bg-tertiary)' : 'var(--accent-rose-dim)',
                    border: `1px solid ${s2Online ? 'var(--border-color)' : 'var(--accent-rose)'}`,
                    cursor: 'pointer',
                    boxShadow: s2Online ? 'none' : '0 0 12px rgba(244, 63, 94, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Substation S2</span>
                    {s2Online ? (
                      <IconCheckCircle size={14} color="var(--accent-emerald)" />
                    ) : (
                      <IconXCircle size={14} color="var(--accent-rose)" />
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: s2Online ? 'var(--text-muted)' : 'var(--accent-rose)', marginTop: '4px', fontWeight: s2Online ? 400 : 600 }}>
                    {s2Online ? 'Active Reroute Node' : 'FAULT: Substation Offline'}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Column 3: S3 & Battery B1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Distribution & Storage
            </div>

            {/* TL4 Overload Indicator */}
            <div style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: isTl4Overloaded ? 'var(--accent-amber-dim)' : 'var(--bg-primary)',
              border: `1px solid ${isTl4Overloaded ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              alignSelf: 'center',
              color: isTl4Overloaded ? 'var(--accent-amber)' : 'var(--accent-cyan)',
              fontWeight: isTl4Overloaded ? 700 : 500
            }}>
              TL4: {tl4.load_mw} / {tl4.capacity_mw} MW {isTl4Overloaded && '⚠️ OVERLOAD'}
            </div>

            {/* S3 Substation */}
            <div
              onClick={() => handleNodeClick(substations.find(s => s.id === 'S3') || { id: 'S3' }, 'Substation')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Substation S3</span>
                <IconCheckCircle size={14} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Distribution Feed Bus
              </div>
            </div>

            {/* Battery B1 */}
            <div
              onClick={() => handleNodeClick(battery, 'Battery')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconBattery size={15} color="var(--accent-purple)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>B1 Storage</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                  {battery.remaining_mwh} MWh
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Max Output: {battery.max_output_mw} MW
              </div>
            </div>
          </div>

          {/* Column 4: Loads (Critical vs Normal) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected Loads
            </div>

            {/* Hospital (Critical Node) */}
            <div
              onClick={() => handleNodeClick(hospital, 'Load')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: hospital.connected && hospital.supplied_mw >= hospital.demand_mw
                  ? 'var(--bg-tertiary)'
                  : 'var(--accent-rose-dim)',
                border: `1px solid ${hospital.connected && hospital.supplied_mw >= hospital.demand_mw
                  ? 'var(--accent-emerald)'
                  : 'var(--accent-rose)'}`,
                cursor: 'pointer',
                boxShadow: hospital.connected ? 'none' : '0 0 10px rgba(244, 63, 94, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconHospital size={15} color={hospital.connected ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>HOSPITAL</span>
                </div>
                <span className="badge" style={{
                  fontSize: '0.6rem',
                  backgroundColor: 'var(--accent-emerald-dim)',
                  color: 'var(--accent-emerald)'
                }}>
                  CRITICAL
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Supplied:</span>
                <span style={{ color: hospital.supplied_mw >= hospital.demand_mw ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
                  {hospital.supplied_mw} / {hospital.demand_mw} MW
                </span>
              </div>
            </div>

            {/* Water Plant (Critical Node) */}
            <div
              onClick={() => handleNodeClick(waterPlant, 'Load')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--accent-emerald)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconDroplet size={15} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>WATER PLANT</span>
                </div>
                <span className="badge" style={{ fontSize: '0.6rem', backgroundColor: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' }}>
                  CRITICAL
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Supplied:</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                  {waterPlant.supplied_mw} / {waterPlant.demand_mw} MW
                </span>
              </div>
            </div>

            {/* Residential 1 (Normal Node) */}
            <div
              onClick={() => handleNodeClick(residential, 'Load')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>RESIDENTIAL 1</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Normal</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Demand:</span>
                <span>{residential.supplied_mw} / {residential.demand_mw} MW</span>
              </div>
            </div>

            {/* Factory (Normal - Load Shed Target) */}
            <div
              onClick={() => handleNodeClick(factory, 'Load')}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: factory.connected ? 'var(--bg-tertiary)' : 'var(--accent-amber-dim)',
                border: `1px solid ${factory.connected ? 'var(--border-color)' : 'var(--accent-amber)'}`,
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconFactory size={15} color={factory.connected ? 'var(--text-muted)' : 'var(--accent-amber)'} />
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>FACTORY</span>
                </div>
                <span className="badge" style={{
                  fontSize: '0.6rem',
                  backgroundColor: factory.connected ? 'rgba(100, 116, 139, 0.2)' : 'var(--accent-amber-dim)',
                  color: factory.connected ? 'var(--text-muted)' : 'var(--accent-amber)'
                }}>
                  {factory.connected ? 'Industrial' : 'SHED'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: factory.connected ? 'var(--text-primary)' : 'var(--accent-amber)', fontWeight: 600 }}>
                  {factory.connected ? `${factory.supplied_mw} MW Connected` : '0 MW (Load Shed)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Inspector Drawer for Clicked Node */}
      {selectedNode && (
        <div style={{
          marginTop: '16px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {selectedNode.entityType}: {selectedNode.id}
            </span>
            <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>
              {JSON.stringify(selectedNode)}
            </span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2px 8px' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
