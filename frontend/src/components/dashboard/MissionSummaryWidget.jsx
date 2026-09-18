import React from 'react';
import {
  IconRotateCcw
} from '../ui/Icons';

export const MissionSummaryWidget = ({
  gridState,
  agentState,
  events = [],
  isLoading,
  onStart,
  onStep,
  onStop,
  onReset
}) => {
  // Power Balance calculations
  const gen = gridState?.generation_mw ?? 180;
  const demand = gridState?.demand_mw ?? 150;
  const netBalance = gen - demand;
  const isSurplus = netBalance >= 0;

  // Critical Facilities Coverage
  const loads = gridState?.loads || [];
  const criticalLoads = loads.filter((l) => l.priority === 'critical');
  const criticalPowered = criticalLoads.filter((l) => l.connected && (l.supplied_mw ?? 0) >= (l.demand_mw ?? 0));
  const criticalHealthPct = criticalLoads.length > 0
    ? Math.round((criticalPowered.length / criticalLoads.length) * 100)
    : 100;
  const isCriticalNominal = criticalHealthPct === 100;

  // Battery Storage
  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80, max_output_mw: 40 };
  const batteryPct = Math.round(((battery.remaining_mwh ?? 80) / (battery.capacity_mwh || 100)) * 100);

  // Faults & Replans
  const faultsCount = gridState?.failures?.length || 0;
  const replanCount = events.filter((e) => e.type === 'REPLAN_STARTED').length;
  const missionStatus = agentState?.mission?.status || 'IDLE';

  // Extract recent 3-4 agent action steps from events stream
  const meaningfulEvents = events
    .filter((e) => ['PLAN_CREATED', 'TOOL_SUCCESS', 'TOOL_FAILED', 'REPLAN_STARTED', 'VALIDATION_PASSED', 'VALIDATION_FAILED', 'CHAOS_EVENT'].includes(e.type))
    .slice(-4)
    .reverse();

  const getStepText = (ev) => {
    if (ev.type === 'PLAN_CREATED') {
      return {
        label: 'Plan Formulated',
        detail: ev.data?.reason || ev.message || `Devised operational plan for #${ev.tool || 'grid control'}`,
        status: 'nominal'
      };
    }
    if (ev.type === 'TOOL_SUCCESS') {
      return {
        label: 'Action Executed',
        detail: ev.message || `Successfully executed capability: ${ev.tool || 'dispatch'}`,
        status: 'success'
      };
    }
    if (ev.type === 'TOOL_FAILED') {
      return {
        label: 'Tool Failure Detected',
        detail: ev.message || 'Capability execution failed, initiating fallback replan',
        status: 'fault'
      };
    }
    if (ev.type === 'REPLAN_STARTED') {
      return {
        label: 'Dynamic Replan',
        detail: 'Agent initiated real-time plan invalidation and adaptive recovery',
        status: 'fault'
      };
    }
    if (ev.type === 'VALIDATION_PASSED') {
      return {
        label: 'Physics Verified',
        detail: 'Power flow constraints validated within nominal frequency & voltage bounds',
        status: 'success'
      };
    }
    if (ev.type === 'VALIDATION_FAILED') {
      return {
        label: 'Safety Trip',
        detail: ev.message || 'Validation constraint violated; corrective dispatch triggered',
        status: 'fault'
      };
    }
    if (ev.type === 'CHAOS_EVENT') {
      return {
        label: 'Fault Injected',
        detail: ev.message || 'Disturbance detected on transmission network',
        status: 'fault'
      };
    }
    return {
      label: 'Telemetry Update',
      detail: ev.message || 'Grid status updated',
      status: 'nominal'
    };
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 2px 14px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Top Bar: Title, Badge & Compact Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isCriticalNominal && faultsCount === 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              boxShadow: isCriticalNominal && faultsCount === 0 ? '0 0 8px var(--accent-emerald)' : '0 0 8px var(--accent-rose)'
            }}
          />
          <h3
            style={{
              fontSize: '0.94rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0
            }}
          >
            Grid Operations & Agent Action Summary
          </h3>
          <span
            style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(24, 24, 24, 0.06)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            LIVE TELEMETRY
          </span>
        </div>

        {/* Quick controls strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: missionStatus === 'RUNNING' ? 'var(--accent-emerald)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginRight: '6px'
            }}
          >
            STATUS: {missionStatus}
          </span>
          {missionStatus !== 'RUNNING' ? (
            <button
              onClick={() => onStart && onStart()}
              disabled={isLoading}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--text-primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              Start Loop
            </button>
          ) : (
            <button
              onClick={() => onStop && onStop()}
              disabled={isLoading}
              style={{
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--text-primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Pause
            </button>
          )}

          {onStep && (
            <button
              onClick={onStep}
              disabled={isLoading || missionStatus === 'COMPLETED'}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-card)',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Step
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              disabled={isLoading}
              title="Reset Grid & Mission"
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-card)',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              <IconRotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Content: Left = AI Action Brief, Right = Crisp Key Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        {/* Left: AI Steps Brief */}
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              Autonomous Actions & Decision Steps
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {events.length} stream events recorded
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {meaningfulEvents.length > 0 ? (
              meaningfulEvents.map((ev, idx) => {
                const step = getStepText(ev);
                return (
                  <div
                    key={ev.id || `${ev.type}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '0.78rem',
                      lineHeight: 1.35
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        marginTop: '5px',
                        flexShrink: 0,
                        backgroundColor:
                          step.status === 'success'
                            ? 'var(--accent-emerald)'
                            : step.status === 'fault'
                            ? 'var(--accent-rose)'
                            : 'var(--text-muted)'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: '6px' }}>
                        {step.label}:
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{step.detail}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
                  <span>1. Topology observation active across G1/G2 generation, substations & 5 load sectors.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                  <span>2. Autonomous agent monitoring for line trips, generation shortfall or frequency drift.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-muted)' }} />
                  <span>3. Dynamic replanning engine standing by for immediate fault isolation.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key Telemetry Summary (Replaced top widgets in crisp form) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '10px'
          }}
        >
          {/* 1. Current Power Balance */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Power Balance
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isSurplus ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isSurplus ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              >
                {isSurplus ? `+${netBalance} MW` : `${netBalance} MW`}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Gen {gen} MW / Load {demand} MW
              </div>
            </div>
          </div>

          {/* 2. Critical Facilities */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Critical Loads
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isCriticalNominal ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isCriticalNominal ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                }}
              >
                {criticalHealthPct}%
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {criticalPowered.length}/{criticalLoads.length} nodes secured
              </div>
            </div>
          </div>

          {/* 3. B1 Storage Reserve */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                B1 Reserve
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {batteryPct}%
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {battery.remaining_mwh} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {battery.capacity_mwh} MWh</span>
              </div>
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${batteryPct}%`,
                    height: '100%',
                    backgroundColor: batteryPct > 25 ? 'var(--text-primary)' : 'var(--accent-rose)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 4. Active Faults & Replans */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Faults
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: faultsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: faultsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                }}
              >
                {faultsCount > 0 ? `${faultsCount} Active` : '0 Nominal'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {replanCount} replans triggered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
