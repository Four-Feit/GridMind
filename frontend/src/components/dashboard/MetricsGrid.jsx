import React from 'react';
import {
  IconZap,
  IconShield,
  IconBattery,
  IconAlertTriangle,
  IconRotateCcw
} from '../ui/Icons';

export const MetricsGrid = ({ gridState, events }) => {
  const gen = gridState?.generation_mw || 0;
  const demand = gridState?.demand_mw || 0;
  const balance = gen - demand;

  const loads = gridState?.loads || [];
  const criticalLoads = loads.filter((l) => l.priority === 'critical');
  const criticalPowered = criticalLoads.filter((l) => l.connected && l.supplied_mw >= l.demand_mw);
  const criticalHealthPct = criticalLoads.length > 0 ? Math.round((criticalPowered.length / criticalLoads.length) * 100) : 100;

  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80 };
  const batteryPct = Math.round((battery.remaining_mwh / (battery.capacity_mwh || 1)) * 100);

  const failureCount = events.filter((e) => e.type === 'TOOL_FAILED').length;
  const replanCount = events.filter((e) => e.type === 'REPLAN_STARTED').length;
  const faultsCount = gridState?.failures?.length || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Generation vs Demand */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Power Balance</span>
          <IconZap size={16} color={balance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {gen}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {demand} MW</span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '6px', color: balance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
          {balance >= 0 ? `+${balance} MW Surplus` : `${balance} MW Deficit`}
        </div>
      </div>

      {/* 2. Critical Facilities Coverage */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Load Health</span>
          <IconShield size={16} color={criticalHealthPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: criticalHealthPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
          }}>
            {criticalHealthPct}%
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({criticalPowered.length}/{criticalLoads.length} Online)
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
          {criticalHealthPct === 100 ? 'All high-priority nodes secured' : 'Deficit on critical infrastructure!'}
        </div>
      </div>

      {/* 3. Battery Storage */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>B1 Storage Reserve</span>
          <IconBattery size={16} color="var(--accent-cyan)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {battery.remaining_mwh}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {battery.capacity_mwh} MWh</span>
        </div>
        {/* Visual Progress Bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${batteryPct}%`, height: '100%', backgroundColor: 'var(--accent-cyan)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* 4. Replans & Recoveries */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dynamic Replans</span>
          <IconRotateCcw size={16} color="var(--accent-purple)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
            {replanCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ({failureCount} recovered failures)
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
          LLM replanned dynamically
        </div>
      </div>

      {/* 5. Active Grid Faults */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Faults</span>
          <IconAlertTriangle size={16} color={faultsCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: faultsCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)'
          }}>
            {faultsCount}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>in simulator</span>
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '6px', color: faultsCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontWeight: 500 }}>
          {faultsCount > 0 ? 'Fault isolation active' : 'Grid operating within limits'}
        </div>
      </div>
    </div>
  );
};
