import React from 'react';
import { MissionHeader } from '../components/dashboard/MissionHeader';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { PowerGridVisualizer } from '../components/grid/PowerGridVisualizer';
import { AgentBrainPanel } from '../components/agent/AgentBrainPanel';
import { ChaosControlPanel } from '../components/chaos/ChaosControlPanel';
import { EventTimeline } from '../components/events/EventTimeline';

export const DashboardPage = ({
  gridState,
  agentState,
  events,
  isLoading,
  error,
  startMission,
  stepMission,
  stopMission,
  resetMission,
  injectChaos,
  isMockMode
}) => {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Mock Mode Banner if active */}
      {isMockMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-amber-dim)',
          border: '1px solid var(--accent-amber)',
          color: 'var(--accent-amber)',
          fontSize: '0.82rem',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <div>
            ⚠️ <strong>MOCK DEMO MODE ACTIVE:</strong> Telemetry is running an isolated, deterministic simulation of the complete demo scenario.
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Switch to LIVE STREAM in header when FastAPI backend is connected.
          </span>
        </div>
      )}

      {/* Error Banner if any */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-rose-dim)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mission Header */}
      <MissionHeader
        mission={agentState?.mission}
        isLoading={isLoading}
        onStart={startMission}
        onStep={stepMission}
        onStop={stopMission}
        onReset={resetMission}
      />

      {/* Metrics Row */}
      <MetricsGrid
        gridState={gridState}
        agentState={agentState}
        events={events}
      />

      {/* Main Split Layout: Left 65% (Grid Visualizer & Chaos) + Right 35% (Agent Brain) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)',
        gap: '24px',
        alignItems: 'start',
        marginBottom: '24px'
      }}>
        {/* Left Column: Power Grid + Chaos Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <PowerGridVisualizer gridState={gridState} />
          <ChaosControlPanel onInjectChaos={injectChaos} isLoading={isLoading} />
        </div>

        {/* Right Column: Agent Brain Panel */}
        <div>
          <AgentBrainPanel agentState={agentState} events={events} />
        </div>
      </div>

      {/* Bottom Row: Chronological Event Timeline */}
      <EventTimeline events={events} />
    </div>
  );
};
