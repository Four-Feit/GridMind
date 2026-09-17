import React, { useState } from 'react';
import { MissionHeader } from '../components/dashboard/MissionHeader';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { ModeSwitcher } from '../components/dashboard/ModeSwitcher';
import { ManualControlPanel } from '../components/dashboard/ManualControlPanel';
import { PowerGridVisualizer } from '../components/grid/PowerGridVisualizer';
import { AgentBrainPanel } from '../components/agent/AgentBrainPanel';
import { ChaosControlPanel } from '../components/chaos/ChaosControlPanel';
import { ChaosModePanel } from '../components/chaos/ChaosModePanel';
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
  updateGrid,
  isMockMode
}) => {
  const [activeMode, setActiveMode] = useState('livestream');

  return (
    <div style={{ padding: '24px var(--page-padding)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Mock Mode Banner */}
      {isMockMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-amber-dim)',
          border: '1px solid rgba(217,119,6,0.3)',
          color: 'var(--accent-amber)',
          fontSize: '0.82rem', fontWeight: 600, marginBottom: '20px',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <span>⚠ <strong>DEMO MODE:</strong> Running isolated deterministic simulation.</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Switch to LIVE when backend is connected.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--accent-rose-dim)',
          border: '1px solid rgba(225,29,72,0.3)',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem', marginBottom: '20px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mode Switcher */}
      <ModeSwitcher activeMode={activeMode} setActiveMode={setActiveMode} />

      {/* ── Livestream Mode ── */}
      {activeMode === 'livestream' && (
        <>
          <MissionHeader
            mission={agentState?.mission}
            isLoading={isLoading}
            onStart={startMission}
            onStep={stepMission}
            onStop={stopMission}
            onReset={resetMission}
          />

          <MetricsGrid gridState={gridState} agentState={agentState} events={events} updateGrid={updateGrid} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.25fr)',
            gap: '20px', alignItems: 'start', marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PowerGridVisualizer gridState={gridState} />
              <ChaosControlPanel
                onInjectChaos={injectChaos}
                isLoading={isLoading}
                onStep={stepMission}
                onStart={startMission}
                missionStatus={agentState?.mission?.status}
              />
            </div>
            <AgentBrainPanel agentState={agentState} events={events} />
          </div>

          <EventTimeline events={events} />
        </>
      )}

      {/* ── Manual Mode ── */}
      {activeMode === 'manual' && (
        <>
          <MetricsGrid gridState={gridState} agentState={agentState} events={events} updateGrid={updateGrid} />

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Manual Grid Controls
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                · Changes go through the backend simulator
              </span>
            </div>
            <ManualControlPanel
              gridState={gridState}
              updateGrid={updateGrid}
              isLoading={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <PowerGridVisualizer gridState={gridState} />
            <AgentBrainPanel agentState={agentState} events={events} />
          </div>

          <EventTimeline events={events} />
        </>
      )}

      {/* ── Chaos Mode ── */}
      {activeMode === 'chaos' && (
        <>
          <MetricsGrid gridState={gridState} agentState={agentState} events={events} updateGrid={updateGrid} />

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Chaos Engineering
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                · Automated disturbance scenarios with real simulator events
              </span>
            </div>
            <ChaosModePanel
              injectChaos={injectChaos}
              events={events}
              gridState={gridState}
              isLoading={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.25fr)', gap: '20px', marginBottom: '20px' }}>
            <PowerGridVisualizer gridState={gridState} />
            <AgentBrainPanel agentState={agentState} events={events} />
          </div>

          <EventTimeline events={events} />
        </>
      )}
    </div>
  );
};
