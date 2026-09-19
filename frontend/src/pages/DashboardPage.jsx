import React, { useState } from 'react';
import { ModeSwitcher } from '../components/dashboard/ModeSwitcher';
import { MissionSummaryWidget } from '../components/dashboard/MissionSummaryWidget';
import { ManualControlPanel } from '../components/dashboard/ManualControlPanel';
import { PowerGridVisualizer } from '../components/grid/PowerGridVisualizer';
import { AgentBrainPanel } from '../components/agent/AgentBrainPanel';
import { ChaosControlPanel } from '../components/chaos/ChaosControlPanel';
import { EventTimeline } from '../components/events/EventTimeline';

export const DashboardPage = ({
  gridState,
  agentState,
  events = [],
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
    <div style={{ padding: '28px var(--page-padding)', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Mock Mode Banner */}
      {isMockMode && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', borderRadius: '10px',
          backgroundColor: 'rgba(24, 24, 24, 0.05)',
          border: '1px solid var(--border-card)',
          color: 'var(--text-secondary)',
          fontSize: '0.82rem', fontWeight: 600, marginBottom: '24px',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <span>⚠ <strong>DEMO MODE:</strong> Running isolated deterministic simulation.</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Switch to LIVE when backend is connected.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: '10px',
          backgroundColor: 'var(--accent-rose-dim)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          fontSize: '0.84rem', fontWeight: 600, marginBottom: '24px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mode Switcher */}
      <div style={{ marginBottom: '28px' }}>
        <ModeSwitcher activeMode={activeMode} setActiveMode={setActiveMode} />
      </div>

      {/* ── Livestream Mode (Redesigned Layout) ── */}
      {activeMode === 'livestream' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 1. PHYSICAL GRID — Hero element taking maximum prominent space */}
          <section id="physical-grid-section" style={{ width: '100%' }}>
            <PowerGridVisualizer
              gridState={gridState}
              onReset={resetMission}
              isLoading={isLoading}
            />
          </section>

          {/* 2. CHAOS ENGINEERING & AGENT BRAIN — Side-by-side with balanced generous spacing */}
          <section
            id="chaos-and-brain-section"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.12fr) minmax(0, 1fr)',
              gap: '24px',
              alignItems: 'stretch'
            }}
          >
            <ChaosControlPanel
              onInjectChaos={injectChaos}
              isLoading={isLoading}
              onStep={stepMission}
              onStart={startMission}
              missionStatus={agentState?.mission?.status}
            />
            <AgentBrainPanel agentState={agentState} events={events} />
          </section>

          {/* 3. SUMMARY WIDGET — Crisp, compact overview of AI steps, power balance & telemetry */}
          <section id="mission-summary-section" style={{ width: '100%' }}>
            <MissionSummaryWidget
              gridState={gridState}
              agentState={agentState}
              events={events}
              isLoading={isLoading}
              onStart={startMission}
              onStep={stepMission}
              onStop={stopMission}
              onReset={resetMission}
            />
          </section>

          {/* 4. EXECUTION TRACE — Full width telemetry & event sequence stream */}
          <section id="execution-trace-section" style={{ width: '100%' }}>
            <EventTimeline events={events} />
          </section>
        </div>
      )}

      {/* ── Manual Mode ── */}
      {activeMode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <MissionSummaryWidget
            gridState={gridState}
            agentState={agentState}
            events={events}
            isLoading={isLoading}
            onStart={startMission}
            onStep={stepMission}
            onStop={stopMission}
            onReset={resetMission}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Manual Grid Controls
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                · Adjust dispatch parameters directly through the backend simulator
              </span>
            </div>
            <ManualControlPanel
              gridState={gridState}
              updateGrid={updateGrid}
              isLoading={isLoading}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.12fr) minmax(0, 1fr)', gap: '24px' }}>
            <PowerGridVisualizer gridState={gridState} onReset={resetMission} isLoading={isLoading} />
            <AgentBrainPanel agentState={agentState} events={events} />
          </div>

          <EventTimeline events={events} />
        </div>
      )}


    </div>
  );
};
