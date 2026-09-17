/**
 * GridMind API Client (Owned by P4)
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  startMission: (goal = "Maintain power to critical facilities", paceSeconds = 1.0, autoRun = true) =>
    fetchJson('/mission/start', {
      method: 'POST',
      body: JSON.stringify({ goal, pace_seconds: paceSeconds, auto_run: autoRun }),
    }),

  stepMission: () =>
    fetchJson('/mission/step', {
      method: 'POST',
    }),

  stopMission: () =>
    fetchJson('/mission/stop', {
      method: 'POST',
    }),

  resetMission: () =>
    fetchJson('/mission/reset', {
      method: 'POST',
    }),

  injectChaos: (eventType, target, params = {}) =>
    fetchJson('/chaos/event', {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, target, params }),
    }),

  getGridState: () =>
    fetchJson('/grid/state'),

  getAgentState: () =>
    fetchJson('/agent/state'),

  getEvents: (limit) =>
    fetchJson(limit ? `/events?limit=${limit}` : '/events'),

  getCapabilities: () =>
    fetchJson('/capabilities'),
};
