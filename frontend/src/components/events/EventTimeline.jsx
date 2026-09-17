import React, { useState } from 'react';
import {
  IconActivity,
  IconChevronDown,
  IconChevronRight
} from '../ui/Icons';

export const EventTimeline = ({ events = [] }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const filterOptions = [
    { id: 'ALL', label: 'All Events' },
    { id: 'PLAN', label: 'Plans & LLM' },
    { id: 'TOOL', label: 'Tool Calls' },
    { id: 'FAIL', label: 'Failures & Replan' },
    { id: 'CHAOS', label: 'Chaos' },
    { id: 'VALID', label: 'Validation' }
  ];

  const filteredEvents = events.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'PLAN') return ['PLAN_CREATED', 'TOOL_SELECTED'].includes(e.type);
    if (filterType === 'TOOL') return ['TOOL_STARTED', 'TOOL_SUCCESS', 'TOOL_FAILED', 'TOOL_REJECTED'].includes(e.type);
    if (filterType === 'FAIL') return ['TOOL_FAILED', 'PLAN_INVALIDATED', 'REPLAN_STARTED', 'VALIDATION_FAILED', 'MISSION_FAILED'].includes(e.type);
    if (filterType === 'CHAOS') return e.type === 'CHAOS_EVENT';
    if (filterType === 'VALID') return ['VALIDATION_STARTED', 'VALIDATION_PASSED', 'VALIDATION_FAILED'].includes(e.type);
    return true;
  });

  const getEventBadge = (type) => {
    switch (type) {
      case 'MISSION_STARTED':
      case 'MISSION_COMPLETED':
        return { color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)', label: type };
      case 'TOOL_SUCCESS':
      case 'VALIDATION_PASSED':
        return { color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)', label: type };
      case 'TOOL_FAILED':
      case 'VALIDATION_FAILED':
      case 'MISSION_FAILED':
        return { color: 'var(--accent-rose)', bg: 'var(--accent-rose-dim)', label: type };
      case 'CHAOS_EVENT':
        return { color: 'var(--accent-rose)', bg: 'var(--accent-rose-dim)', label: 'CHAOS' };
      case 'REPLAN_STARTED':
      case 'PLAN_INVALIDATED':
        return { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', label: type };
      case 'PLAN_CREATED':
      case 'TOOL_SELECTED':
        return { color: 'var(--accent-purple)', bg: 'var(--accent-purple-dim)', label: type };
      case 'OBSERVATION':
        return { color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', label: 'OBSERVE' };
      default:
        return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', label: type };
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px' }}>
      {/* Header & Filter Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconActivity size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Execution Trace & Telemetry Stream
          </h3>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            ({events.length} events logged)
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: filterType === opt.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: filterType === opt.id ? 'var(--bg-tertiary)' : 'transparent',
                border: filterType === opt.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div style={{
        maxHeight: '360px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingRight: '6px'
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No events recorded matching filter. Start a mission or inject a chaos event to observe agent actions.
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const isExpanded = expandedIndex === idx;
            const badge = getEventBadge(ev.type);

            return (
              <div
                key={idx}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                {/* Event Summary Row */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Timestamp */}
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatTimestamp(ev.timestamp)}
                    </span>

                    {/* Event Type Badge */}
                    <span className="badge" style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.color}`,
                      fontSize: '0.65rem',
                      flexShrink: 0
                    }}>
                      {badge.label}
                    </span>

                    {/* Plan ID */}
                    {ev.plan_id !== undefined && ev.plan_id !== null && (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', flexShrink: 0 }}>
                        P#{ev.plan_id}
                      </span>
                    )}

                    {/* Message Preview */}
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {ev.message}
                    </span>
                  </div>

                  {/* Tool / Capability Tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {ev.tool && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--accent-cyan)'
                      }}>
                        {ev.tool}
                      </span>
                    )}
                    {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </div>
                </div>

                {/* Expandable Structured Payload */}
                {isExpanded && (
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-tertiary)',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Structured Payload:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        type: {ev.type}
                      </span>
                    </div>
                    <pre style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.72rem',
                      overflowX: 'auto',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {JSON.stringify(ev, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
