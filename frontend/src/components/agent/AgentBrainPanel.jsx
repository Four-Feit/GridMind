import React, { useState } from 'react';
import {
  IconBrain,
  IconCheckCircle,
  IconRotateCcw,
  IconChevronDown,
  IconChevronRight,
  IconAlertTriangle,
  IconZap
} from '../ui/Icons';

export const AgentBrainPanel = ({ agentState, events }) => {
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

  // Multi-accordion state: all active steps open by default
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

  // Compute status pill for the viewed plan
  const getPlanStatus = () => {
    if (currentToolResult?.type === 'TOOL_FAILED' || currentReplan) {
      return { label: 'REPLANNED', bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)' };
    }
    if (currentValidation?.type === 'VALIDATION_PASSED' || currentValidation?.type === 'MISSION_COMPLETED') {
      return { label: 'VERIFIED PASSED', bg: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' };
    }
    if (currentToolResult?.type === 'TOOL_SUCCESS') {
      return { label: 'EXECUTED', bg: 'var(--accent-cyan-dim)', color: 'var(--accent-cyan)' };
    }
    if (currentPlan) {
      return { label: 'FORMULATED', bg: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' };
    }
    return { label: 'IDLE', bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
  };

  const planStatus = getPlanStatus();

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Brain Header */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IconBrain size={16} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Agent Brain</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Autonomous Reasoning Engine</span>
            </div>
          </div>

          <span className="badge" style={{
            backgroundColor: planStatus.bg,
            color: planStatus.color,
            border: `1px solid ${planStatus.color}`
          }}>
            {planStatus.label}
          </span>
        </div>

        {/* Plan History Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Cycle:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {planIds.length > 0 ? (
              planIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => setSelectedPlanId(pid)}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: pid === activePlanId ? 700 : 500,
                    backgroundColor: pid === activePlanId ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                    color: pid === activePlanId ? '#ffffff' : 'var(--text-secondary)',
                    border: pid === activePlanId ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  Plan #{pid}
                </button>
              ))
            ) : (
              <span className="badge" style={{ backgroundColor: 'var(--accent-purple-dim)', color: 'var(--accent-purple)', border: '1px solid var(--accent-purple)' }}>
                Plan #{mission.plan_id || 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stage 1: Observation */}
      <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('observation')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>1. Observation</span>
          </div>
          {expandedSections.observation ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSections.observation && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentObservation ? (
              <div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{currentObservation.message}</p>
                {currentObservation.data && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--accent-cyan)',
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
      <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('plan')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>2. Current Plan</span>
          </div>
          {expandedSections.plan ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSections.plan && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentPlan ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tool Target:</span>
                  <span className="font-mono" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                    {currentPlan.tool || currentPlan.data?.action}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {currentPlan.data?.reason || currentPlan.message}
                </div>
                {currentPlan.data?.arguments && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
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
      <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('result')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentToolResult?.type === 'TOOL_FAILED' ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>3. Tool Outcome</span>
          </div>
          {expandedSections.result ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSections.result && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentToolResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {currentToolResult.type === 'TOOL_FAILED' ? (
                    <span className="badge" style={{ backgroundColor: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)' }}>
                      FAILURE DETECTED
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald)' }}>
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
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
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
      <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('replan')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconRotateCcw size={14} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>4. Recovery & Constraints</span>
          </div>
          {expandedSections.replan ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSections.replan && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentReplan && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent-amber-dim)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent-amber)',
                marginBottom: '10px',
                fontSize: '0.75rem'
              }}>
                <strong>Dynamic Replan Triggered:</strong> {currentReplan.message}
              </div>
            )}

            {mission.previous_failures && mission.previous_failures.length > 0 ? (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-rose)', marginBottom: '4px' }}>Recorded Failures in Memory:</div>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                  {mission.previous_failures.map((f, i) => (
                    <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {mission.known_constraints && mission.known_constraints.length > 0 ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '4px' }}>Learned Constraints:</div>
                <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)' }}>
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

      {/* Stage 5: Outcome Validation */}
      <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div
          onClick={() => toggleSection('validation')}
          style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCheckCircle size={14} color="var(--accent-emerald)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>5. Mission Validation</span>
          </div>
          {expandedSections.validation ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSections.validation && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {currentValidation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheckCircle size={18} color="var(--accent-emerald)" />
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
