import React, { useState, useEffect } from 'react';
import './styles/theme.css';
import { useGridMind } from './hooks/useGridMind';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { EventTracePage } from './pages/EventTracePage';

export function App() {
  const [activePage, setActivePage] = useState('landing');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gridmind_theme') || 'dark';
  });

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
    injectChaos
  } = useGridMind();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gridmind_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={toggleTheme}
        isMockMode={isMockMode}
        toggleMockMode={toggleMockMode}
        wsConnected={wsConnected}
        missionStatus={agentState?.mission?.status}
      />

      {/* Main Content Area */}
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
            isMockMode={isMockMode}
          />
        )}

        {activePage === 'architecture' && (
          <ArchitecturePage />
        )}

        {activePage === 'events' && (
          <EventTracePage events={events} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
