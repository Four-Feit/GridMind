import React, { useState, useEffect } from 'react';
import './styles/theme.css';
import { useGridMind } from './hooks/useGridMind';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { EventTracePage } from './pages/EventTracePage';
import { DevelopedByPage } from './pages/DevelopedByPage';

export function App() {
  const [activePage, setActivePage] = useState('landing');

  // Force light theme permanently
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  const {
    isMockMode,
    toggleMockMode,
    wsConnected,
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
  } = useGridMind();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        isMockMode={isMockMode}
        toggleMockMode={toggleMockMode}
        wsConnected={wsConnected}
        missionStatus={agentState?.mission?.status}
      />

      <main style={{ flex: 1 }}>
        {activePage === 'landing' && (
          <LandingPage
            onOpenDashboard={() => setActivePage('dashboard')}
            onOpenArchitecture={() => setActivePage('architecture')}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            gridState={gridState}
            agentState={agentState}
            events={events}
            isLoading={isLoading}
            error={error}
            startMission={startMission}
            stepMission={stepMission}
            stopMission={stopMission}
            resetMission={resetMission}
            injectChaos={injectChaos}
            updateGrid={updateGrid}
            isMockMode={isMockMode}
          />
        )}

        {activePage === 'architecture' && (
          <ArchitecturePage onOpenDashboard={() => setActivePage('dashboard')} />
        )}

        {activePage === 'events' && <EventTracePage events={events} />}

        {activePage === 'developed-by' && <DevelopedByPage />}
      </main>

      <Footer activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default App;
