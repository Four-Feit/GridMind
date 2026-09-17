import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { INITIAL_MOCK_GRID, INITIAL_MOCK_AGENT, MOCK_SCRIPTED_STEPS } from '../services/mockData';

export function useGridMind() {
  const [isMockMode, setIsMockMode] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [gridState, setGridState] = useState(INITIAL_MOCK_GRID);
  const [agentState, setAgentState] = useState(INITIAL_MOCK_AGENT);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock simulation step pointer
  const mockStepIndex = useRef(0);
  const mockTimer = useRef(null);

  // Synchronize state with real backend
  const fetchLiveState = useCallback(async () => {
    if (isMockMode) return;
    try {
      const [gridRes, agentRes, eventsRes] = await Promise.allSettled([
        api.getGridState(),
        api.getAgentState(),
        api.getEvents(50)
      ]);

      if (gridRes.status === 'fulfilled' && gridRes.value?.state) {
        setGridState(gridRes.value.state);
      }
      if (agentRes.status === 'fulfilled' && agentRes.value?.agent) {
        setAgentState(agentRes.value.agent);
      }
      if (eventsRes.status === 'fulfilled' && eventsRes.value?.events) {
        setEvents(eventsRes.value.events);
      }
    } catch (err) {
      console.warn('[GridMind Hook] State sync warning:', err);
    }
  }, [isMockMode]);

  // Handle incoming WebSocket telemetry event
  const handleWsEvent = useCallback((incoming) => {
    if (isMockMode) return;

    if (incoming.type === 'CONNECTION_ESTABLISHED') {
      if (incoming.grid_state) setGridState(incoming.grid_state);
      if (incoming.agent_state) setAgentState(incoming.agent_state);
      if (incoming.recent_events) setEvents(incoming.recent_events);
      return;
    }

    // Attach grid snapshot if available
    if (incoming.grid_state) {
      setGridState(incoming.grid_state);
    }

    // If event has mission/agent updates
    if (incoming.agent_state) {
      setAgentState(incoming.agent_state);
    } else if (incoming.plan_id !== undefined) {
      setAgentState((prev) => ({
        ...prev,
        mission: {
          ...prev.mission,
          plan_id: incoming.plan_id,
          status: incoming.type === 'MISSION_COMPLETED' ? 'COMPLETED' :
                  incoming.type === 'MISSION_FAILED' ? 'FAILED' :
                  incoming.type === 'MISSION_STARTED' ? 'RUNNING' : prev.mission?.status
        }
      }));
    }

    // Append to event timeline
    setEvents((prev) => [...prev, incoming]);
  }, [isMockMode]);

  // Initialize connection & polling
  useEffect(() => {
    if (isMockMode) {
      wsClient.disconnect();
      return;
    }

    wsClient.connect();
    const unsubEvent = wsClient.subscribe(handleWsEvent);
    const unsubStatus = wsClient.subscribeStatus(setWsConnected);

    fetchLiveState();

    return () => {
      unsubEvent();
      unsubStatus();
    };
  }, [isMockMode, handleWsEvent, fetchLiveState]);

  // Real backend actions
  const startMission = async (goal = "Maintain power to critical facilities", paceSeconds = 1.0) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isMockMode) {
        // Start scripted mock playback
        setAgentState((prev) => ({
          ...prev,
          mission: { ...prev.mission, goal, status: 'RUNNING' }
        }));
        runMockPlayback();
        setIsLoading(false);
        return;
      }

      await api.startMission(goal, paceSeconds, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepMission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isMockMode) {
        advanceMockStep();
        return;
      }
      const res = await api.stepMission();
      if (res.grid_state) setGridState(res.grid_state);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMission = async () => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        if (mockTimer.current) clearInterval(mockTimer.current);
        setAgentState((prev) => ({
          ...prev,
          mission: { ...prev.mission, status: 'PAUSED' }
        }));
        return;
      }
      await api.stopMission();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMission = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isMockMode) {
        resetMock();
        return;
      }
      const res = await api.resetMission();
      if (res.grid) setGridState(res.grid);
      if (res.mission) setAgentState({ mission: res.mission, last_observation_id: 0, memory_context: {} });
      setEvents([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const injectChaos = async (eventType, target, params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isMockMode) {
        advanceMockStep(0);
        return;
      }
      const res = await api.injectChaos(eventType, target, params);
      if (res.grid_state) setGridState(res.grid_state);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGrid = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isMockMode) return; // Manual mode not supported in mock
      const res = await api.updateGrid(payload);
      if (res.grid_state) setGridState(res.grid_state);
    } catch (err) {
      setError(err.message);
      throw err; // re-throw so ManualControlPanel can show inline feedback
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Mode helpers
  const resetMock = () => {
    if (mockTimer.current) clearInterval(mockTimer.current);
    mockStepIndex.current = 0;
    setGridState(INITIAL_MOCK_GRID);
    setAgentState(INITIAL_MOCK_AGENT);
    setEvents([]);
  };

  const advanceMockStep = (explicitIndex) => {
    const idx = explicitIndex !== undefined ? explicitIndex : mockStepIndex.current;
    if (idx >= MOCK_SCRIPTED_STEPS.length) return;

    const step = MOCK_SCRIPTED_STEPS[idx];
    if (!step) return;

    if (step.event) {
      setEvents((prev) => [...prev, step.event]);
    }
    if (step.gridPatch) {
      setGridState((prev) => ({ ...prev, ...step.gridPatch }));
    }
    if (step.agentPatch) {
      setAgentState((prev) => ({
        ...prev,
        ...step.agentPatch,
        mission: { ...prev.mission, ...(step.agentPatch.mission || {}) }
      }));
    }

    mockStepIndex.current = idx + 1;
  };

  const runMockPlayback = () => {
    if (mockTimer.current) clearInterval(mockTimer.current);
    mockStepIndex.current = 0;
    mockTimer.current = setInterval(() => {
      if (mockStepIndex.current >= MOCK_SCRIPTED_STEPS.length) {
        clearInterval(mockTimer.current);
        return;
      }
      advanceMockStep();
    }, 1500);
  };

  const toggleMockMode = () => {
    if (mockTimer.current) clearInterval(mockTimer.current);
    const nextMode = !isMockMode;
    setIsMockMode(nextMode);
    if (nextMode) {
      setWsConnected(false);
      resetMock();
    } else {
      fetchLiveState();
    }
  };

  return {
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
    advanceMockStep,
    resetMock
  };
}
