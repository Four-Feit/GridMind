import React, { useState } from 'react';
import {
  IconBrain,
  IconCheckCircle,
  IconRotateCcw,
  IconChevronDown,
  IconChevronRight
} from '../ui/Icons';

export const AgentBrainPanel = ({ agentState, events }) => {
  const [expandedSection, setExpandedSection] = useState('plan');

  // Extract recent key events for each stage of the brain loop
  const latestObservation = [...events].reverse().find((e) => e.type === 'OBSERVATION');
  const latestPlan = [...events].reverse().find((e) => e.type === 'PLAN_CREATED');
  const latestToolResult = [...events].reverse().find((e) => ['TOOL_SUCCESS', 'TOOL_FAILED'].includes(e.type));
  const latestValidation = [...events].reverse().find((e) => ['VALIDATION_PASSED', 'VALIDATION_FAILED', 'MISSION_COMPLETED'].includes(e.type));

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const mission = agentState?.mission || {};

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Brain Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
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
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>P1 Autonomous Controller</span>
          </div>
        </div>

        <span className="badge" style={{
          backgroundColor: 'var(--accent-purple-dim)',
          color: 'var(--accent-purple)',
          border: '1px solid var(--accent-purple)'
        }}>
          Plan #{mission.plan_id || 0}
        </span>
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
          {expandedSection === 'observation' ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSection === 'observation' && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {latestObservation ? (
              <div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{latestObservation.message}</p>
                {latestObservation.data && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(latestObservation.data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Awaiting initial environment telemetry...</span>
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
          {expandedSection === 'plan' ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSection === 'plan' && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {latestPlan ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Tool Target:</span>
                  <span className="font-mono" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                    {latestPlan.tool || latestPlan.data?.action}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {latestPlan.data?.reason || latestPlan.message}
                </div>
                {latestPlan.data?.arguments && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(latestPlan.data.arguments, null, 2)}
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
              backgroundColor: latestToolResult?.type === 'TOOL_FAILED' ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>3. Tool Outcome</span>
          </div>
          {expandedSection === 'result' ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSection === 'result' && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {latestToolResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {latestToolResult.type === 'TOOL_FAILED' ? (
                    <span className="badge" style={{ backgroundColor: 'var(--accent-rose-dim)', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)' }}>
                      FAILURE DETECTED
                    </span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)', border: '1px solid var(--accent-emerald)' }}>
                      EXECUTION SUCCESS
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {latestToolResult.tool}
                  </span>
                </div>
                <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {latestToolResult.message}
                </p>
                {latestToolResult.data && (
                  <pre style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    color: latestToolResult.type === 'TOOL_FAILED' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    fontSize: '0.7rem',
                    overflowX: 'auto'
                  }}>
                    {JSON.stringify(latestToolResult.data, null, 2)}
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
          {expandedSection === 'replan' ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSection === 'replan' && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
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
            ) : (
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
          {expandedSection === 'validation' ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </div>
        {expandedSection === 'validation' && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
            {latestValidation ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheckCircle size={18} color="var(--accent-emerald)" />
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {latestValidation.message}
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
