import React, { useState } from 'react';
import {
  IconBrain,
  IconCheckCircle,
  IconRotateCcw,
  IconChevronDown,
  IconChevronRight,
  IconAlertTriangle
} from '../ui/Icons';

export const AgentBrainPanel = ({ agentState, events = [] }) => {
  // Extract all distinct plan IDs from events in ascending order
  const planIds = Array.from(
    new Set(
      events
        .filter((e) => e.plan_id !== undefined && e.plan_id !== null && e.plan_id > 0)
        .map((e) => e.plan_id)
    )
  ).sort((a, b) => a - b);

  const latestPlanId = planIds.length > 0 ? planIds[planIds.length - 1] : (agentState?.mission?.plan_id || 1);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const activePlanId = selectedPlanId !== null && planIds.includes(selectedPlanId) ? selectedPlanId : latestPlanId;

  // Filter events for the currently viewed plan ID (fallback to latest events)
  const planEvents = events.filter((e) => e.plan_id === activePlanId);
  const eventPool = planEvents.length > 0 ? planEvents : events;

  const currentObservation = [...eventPool].reverse().find((e) => e.type === 'OBSERVATION')
    || [...events].reverse().find((e) => e.type === 'OBSERVATION');

  const currentPlan = [...eventPool].reverse().find((e) => e.type === 'PLAN_CREATED')
    || [...events].reverse().find((e) => e.type === 'PLAN_CREATED');

  const currentToolResult = [...eventPool].reverse().find((e) => ['TOOL_SUCCESS', 'TOOL_FAILED'].includes(e.type))
    || [...events].reverse().find((e) => ['TOOL_SUCCESS', 'TOOL_FAILED'].includes(e.type));

  const currentReplan = [...eventPool].reverse().find((e) => ['PLAN_INVALIDATED', 'TOOL_FAILED'].includes(e.type))
    || [...events].reverse().find((e) => ['PLAN_INVALIDATED', 'TOOL_FAILED'].includes(e.type));

  const currentValidation = [...eventPool].reverse().find((e) => ['VALIDATION_PASSED', 'VALIDATION_FAILED', 'MISSION_COMPLETED'].includes(e.type))
    || [...events].reverse().find((e) => ['VALIDATION_PASSED', 'VALIDATION_FAILED', 'MISSION_COMPLETED'].includes(e.type));

  // Multi-accordion state
  const [expandedSections, setExpandedSections] = useState({
    observation: false,
    plan: true,
    result: true,
    replan: true,
    validation: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const mission = agentState?.mission || {};

  // Compute status pill for the viewed plan using theme colors + red/green signals
  const getPlanStatus = () => {
    if (currentToolResult?.type === 'TOOL_FAILED' || currentReplan) {
      return { label: 'REPLANNED', bg: 'var(--accent-rose-dim)', color: 'var(--accent-rose)' };
    }
    if (currentValidation?.type === 'VALIDATION_PASSED' || currentValidation?.type === 'MISSION_COMPLETED') {
      return { label: 'VERIFIED PASSED', bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' };
    }
    if (currentToolResult?.type === 'TOOL_SUCCESS') {
      return { label: 'EXECUTED', bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' };
    }
    if (currentPlan) {
      return { label: 'FORMULATED', bg: 'rgba(24, 24, 24, 0.08)', color: 'var(--text-primary)' };
    }
    return { label: 'IDLE', bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
  };

  const planStatus = getPlanStatus();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-card)',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Brain Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconBrain size={16} color="var(--text-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
                Agent Brain
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Autonomous Reasoning Engine</span>
            </div>
          </div>

          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: planStatus.bg,
            color: planStatus.color,
            border: `1px solid ${planStatus.color}`,
            fontFamily: 'var(--font-mono)'
          }}>
            {planStatus.label}
          </span>
        </div>

        {/* Plan History Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Cycle:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {planIds.length > 0 ? (
              planIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => setSelectedPlanId(pid)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: pid === activePlanId ? 800 : 500,
                    backgroundColor: pid === activePlanId ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: pid === activePlanId ? '#ffffff' : 'var(--text-secondary)',
                    border: pid === activePlanId ? '1px solid var(--text-primary)' : '1px solid var(--border-card)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Plan #{pid}
                </button>
              ))
            ) : (
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-card)'
              }}>
                Plan #{mission.plan_id || 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage 1: Observation */}
      <div style={{ borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('observation')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              1. Observation
            </span>
          </div>
          {expandedSections.observation ? <IconChevronDown size={14} color="var(--text-muted)" /> : <IconChevronRight size={14} color="var(--text-muted)" />}
        </div>
        {expandedSections.observation && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentObservation ? (
              <div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>{currentObservation.message}</p>
                {currentObservation.data && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(currentObservation.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Awaiting environment telemetry...</span>
            )}
          </div>
        )}
      </div>

      {/* Stage 2: Current Plan & Strategy */}
      <div style={{ borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('plan')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              2. Current Plan
            </span>
          </div>
          {expandedSections.plan ? <IconChevronDown size={14} color="var(--text-muted)" /> : <IconChevronRight size={14} color="var(--text-muted)" />}
        </div>
        {expandedSections.plan && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentPlan ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tool Target:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 800, backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-card)' }}>
                    {currentPlan.tool || currentPlan.data?.action}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {currentPlan.data?.reason || currentPlan.message}
                </div>
                {currentPlan.data?.arguments && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(currentPlan.data.arguments, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>No active plan formulated.</span>
            )}
          </div>
        )}
      </div>

      {/* Stage 3: Capability Execution & Result */}
      <div style={{ borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('result')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: currentToolResult?.type === 'TOOL_FAILED' ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              3. Tool Outcome
            </span>
          </div>
          {expandedSections.result ? <IconChevronDown size={14} color="var(--text-muted)" /> : <IconChevronRight size={14} color="var(--text-muted)" />}
        </div>
        {expandedSections.result && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentToolResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {currentToolResult.type === 'TOOL_FAILED' ? (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--accent-rose-dim)',
                      color: 'var(--accent-rose)',
                      border: '1px solid var(--accent-rose)'
                    }}>
                      FAILURE DETECTED
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--accent-emerald-dim)',
                      color: 'var(--accent-emerald)',
                      border: '1px solid var(--accent-emerald)'
                    }}>
                      EXECUTION SUCCESS
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {currentToolResult.tool}
                  </span>
                </div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {currentToolResult.message}
                </p>
                {currentToolResult.data && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    color: currentToolResult.type === 'TOOL_FAILED' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(currentToolResult.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Awaiting capability execution...</span>
            )}
          </div>
        )}
      </div>

      {/* Stage 4: Dynamic Replan & Recovery Engine */}
      <div style={{ borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('replan')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: currentReplan ? 'var(--accent-rose)' : 'var(--text-muted)'
            }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              4. Recovery & Constraints
            </span>
          </div>
          {expandedSections.replan ? <IconChevronDown size={14} color="var(--text-muted)" /> : <IconChevronRight size={14} color="var(--text-muted)" />}
        </div>
        {expandedSections.replan && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentReplan && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-rose-dim)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                marginBottom: '10px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <strong>Replan Triggered:</strong> {currentReplan.message}
              </div>
            )}

            {mission.previous_failures && mission.previous_failures.length > 0 ? (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px', fontSize: '0.74rem' }}>
                  Recorded Failures in Memory:
                </div>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', margin: 0 }}>
                  {mission.previous_failures.map((f, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {mission.known_constraints && mission.known_constraints.length > 0 ? (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.74rem' }}>
                  Active Operational Constraints:
                </div>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', margin: 0 }}>
                  {mission.known_constraints.map((c, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : !currentReplan && (
              <span style={{ color: 'var(--text-muted)' }}>No constraint violations recorded.</span>
            )}
          </div>
        )}
      </div>

      {/* Stage 5: Mission Validation */}
      <div style={{ borderRadius: '10px', border: '1px solid var(--border-card)', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('validation')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: currentValidation ? 'var(--accent-emerald)' : 'var(--text-muted)'
            }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
              5. Mission Validation
            </span>
          </div>
          {expandedSections.validation ? <IconChevronDown size={14} color="var(--text-muted)" /> : <IconChevronRight size={14} color="var(--text-muted)" />}
        </div>
        {expandedSections.validation && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentValidation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheckCircle size={16} color="var(--accent-emerald)" />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {currentValidation.message}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Verification runs after every cycle.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
