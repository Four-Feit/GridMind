import React, { useState, useEffect, useRef } from 'react';
import { IconActivity, IconChevronDown, IconChevronRight } from '../ui/Icons';

const EVENT_CATEGORY_MAP = {
  MISSION_STARTED:    { category: 'MISSION',     color: 'var(--accent-cyan)',    bg: 'var(--accent-cyan-dim)',   status: 'STARTED',  statusColor: 'var(--accent-cyan)' },
  MISSION_COMPLETED:  { category: 'MISSION',     color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)',status: 'SUCCESS',  statusColor: 'var(--accent-emerald)' },
  MISSION_FAILED:     { category: 'MISSION',     color: 'var(--accent-rose)',    bg: 'var(--accent-rose-dim)',   status: 'FAILED',   statusColor: 'var(--accent-rose)' },
  TOOL_SUCCESS:       { category: 'TOOL CALL',   color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)',status: 'SUCCESS',  statusColor: 'var(--accent-emerald)' },
  TOOL_FAILED:        { category: 'TOOL CALL',   color: 'var(--accent-rose)',    bg: 'var(--accent-rose-dim)',   status: 'FAILED',   statusColor: 'var(--accent-rose)' },
  TOOL_STARTED:       { category: 'TOOL CALL',   color: 'var(--accent-amber)',   bg: 'var(--accent-amber-dim)',  status: 'EXEC',     statusColor: 'var(--accent-amber)' },
  TOOL_SELECTED:      { category: 'PLAN & LLM',  color: 'var(--accent-purple)',  bg: 'var(--accent-purple-dim)', status: 'SELECTED', statusColor: 'var(--accent-purple)' },
  TOOL_REJECTED:      { category: 'VALIDATION',  color: '#ea580c',               bg: 'rgba(234,88,12,0.1)',      status: 'REJECTED', statusColor: '#ea580c' },
  PLAN_CREATED:       { category: 'PLAN & LLM',  color: 'var(--accent-purple)',  bg: 'var(--accent-purple-dim)', status: 'PLANNED',  statusColor: 'var(--accent-purple)' },
  PLAN_INVALIDATED:   { category: 'REPLAN',      color: 'var(--accent-amber)',   bg: 'var(--accent-amber-dim)',  status: 'INVALID',  statusColor: 'var(--accent-amber)' },
  REPLAN_STARTED:     { category: 'REPLAN',      color: 'var(--accent-amber)',   bg: 'var(--accent-amber-dim)',  status: 'REPLAN',   statusColor: 'var(--accent-amber)' },
  CHAOS_EVENT:        { category: 'CHAOS',       color: 'var(--accent-rose)',    bg: 'var(--accent-rose-dim)',   status: 'INJECTED', statusColor: 'var(--accent-rose)' },
  VALIDATION_STARTED: { category: 'VALIDATION',  color: 'var(--text-muted)',     bg: 'var(--bg-tertiary)',       status: 'CHECKING', statusColor: 'var(--text-muted)' },
  VALIDATION_PASSED:  { category: 'VALIDATION',  color: 'var(--accent-emerald)', bg: 'var(--accent-emerald-dim)',status: 'PASSED',   statusColor: 'var(--accent-emerald)' },
  VALIDATION_FAILED:  { category: 'VALIDATION',  color: 'var(--accent-rose)',    bg: 'var(--accent-rose-dim)',   status: 'FAILED',   statusColor: 'var(--accent-rose)' },
  OBSERVATION:        { category: 'OBSERVE',     color: 'var(--accent-cyan)',    bg: 'var(--accent-cyan-dim)',   status: 'UPDATED',  statusColor: 'var(--accent-cyan)' },
};

const FILTERS = [
  { id: 'ALL',   label: 'All Events',       match: (e) => e && e.type !== 'PONG' },
  { id: 'PLAN',  label: 'Plans & LLM',      match: (e) => ['PLAN_CREATED', 'TOOL_SELECTED'].includes(e.type) },
  { id: 'TOOL',  label: 'Tool Calls',       match: (e) => ['TOOL_STARTED', 'TOOL_SUCCESS', 'TOOL_FAILED', 'TOOL_REJECTED'].includes(e.type) },
  { id: 'FAIL',  label: 'Failures & Replan',match: (e) => ['TOOL_FAILED', 'PLAN_INVALIDATED', 'REPLAN_STARTED', 'VALIDATION_FAILED', 'MISSION_FAILED'].includes(e.type) },
  { id: 'CHAOS', label: 'Chaos',            match: (e) => e.type === 'CHAOS_EVENT' },
  { id: 'VALID', label: 'Validation',       match: (e) => ['VALIDATION_STARTED', 'VALIDATION_PASSED', 'VALIDATION_FAILED'].includes(e.type) },
];

const formatTs = (ts) => {
  if (!ts) return '--:--:--';
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const relativeTime = (ts) => {
  if (!ts) return '';
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 4) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export const EventTimeline = ({ events = [] }) => {
  const [filterType, setFilterType] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [newEventsCount, setNewEventsCount] = useState(0);

  const scrollRef = useRef(null);
  const prevLengthRef = useRef(events.length);

  // New events behavior: keep position if reading history, or show 'Jump to latest'
  useEffect(() => {
    const diff = events.length - prevLengthRef.current;
    if (diff > 0) {
      if (!isAtTop) {
        setNewEventsCount((c) => c + diff);
      } else if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
    prevLengthRef.current = events.length;
  }, [events.length, isAtTop]);

  const handleScroll = (e) => {
    const top = e.target.scrollTop;
    const atTopNow = top < 30;
    setIsAtTop(atTopNow);
    if (atTopNow) {
      setNewEventsCount(0);
    }
  };

  const jumpToLatest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsAtTop(true);
    setNewEventsCount(0);
  };

  const activeFilter = FILTERS.find((f) => f.id === filterType) || FILTERS[0];
  const sortedEvents = [...events].reverse();
  const filteredEvents = sortedEvents.filter(activeFilter.match);
  const totalCount = filteredEvents.length;

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', position: 'relative' }}>
      {/* Viewport Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', gap: '12px', paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <IconActivity size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Execution Trace & Telemetry Stream
            </h3>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                {events.length} total events
              </span>
              <span>•</span>
              <span>{totalCount} matching active filter</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-emerald)' }}>● live stream active</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => {
            const count = f.id === 'ALL' ? events.length : events.filter(f.match).length;
            const isSelected = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '5px 11px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.74rem', fontWeight: 600,
                  color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  backgroundColor: isSelected ? 'var(--accent-cyan-dim)' : 'var(--bg-secondary)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-card)',
                  boxShadow: isSelected ? '0 1px 4px rgba(2, 132, 199, 0.12)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isSelected ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating 'New events' indicator when scrolled down */}
      {newEventsCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '78px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: 'var(--shadow-md)',
          animation: 'slideInDown 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: 'var(--accent-cyan)', display: 'inline-block'
          }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {newEventsCount} new event{newEventsCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={jumpToLatest}
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-cyan)',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Jump to latest ↑
          </button>
        </div>
      )}

      {/* Bounded Event Viewport with Slim Vertical History Rail */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="telemetry-rail"
        style={{
          height: '460px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '6px',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{
            padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)',
            fontSize: '0.88rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
          }}>
            <IconActivity size={24} color="var(--text-muted)" />
            <span>No events match this filter category.</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Start an autonomous mission, step manually, or inject physical chaos to stream events.
            </span>
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const id = `${ev.timestamp || 0}-${idx}`;
            const isExpanded = expandedId === id;
            const meta = EVENT_CATEGORY_MAP[ev.type] || {
              category: ev.type?.replace(/_/g, ' ') || 'EVENT',
              color: 'var(--accent-cyan)',
              bg: 'var(--accent-cyan-dim)',
              status: 'INFO',
              statusColor: 'var(--text-secondary)'
            };
            const isLatest = idx === 0 && isAtTop;

            return (
              <div
                key={id}
                className={isLatest ? 'animate-fade-in' : undefined}
                style={{
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  border: `1px solid ${isExpanded ? 'var(--border-focus)' : 'var(--border-card)'}`,
                  boxShadow: isExpanded ? 'var(--shadow-sm)' : 'none',
                  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Compact but legible event header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  style={{
                    padding: '11px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                  }}
                >
                  {/* Top line: Category, Status, Timestamp, Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Category indicator dot & label */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em',
                        color: meta.color, textTransform: 'uppercase'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color }} />
                        {meta.category}
                      </span>

                      {/* Optional Tool or Plan Badge */}
                      {ev.tool && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.67rem',
                          padding: '1px 6px', borderRadius: 4,
                          backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          {ev.tool}
                        </span>
                      )}

                      {ev.plan_id != null && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.67rem',
                          color: 'var(--accent-purple)', fontWeight: 600,
                        }}>
                          Plan #{ev.plan_id}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Status indicator */}
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em',
                        padding: '2px 7px', borderRadius: 4,
                        backgroundColor: meta.bg, color: meta.statusColor,
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {meta.status}
                      </span>

                      {/* Precise Timestamp */}
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                        color: 'var(--text-muted)', fontWeight: 500
                      }}>
                        {formatTs(ev.timestamp)}
                      </span>

                      {/* Relative time indicator */}
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', minWidth: 44, textAlign: 'right' }}>
                        {relativeTime(ev.timestamp)}
                      </span>

                      {/* Expand chevron */}
                      <span style={{ color: isExpanded ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                      </span>
                    </div>
                  </div>

                  {/* Second line: Event summary message */}
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: isExpanded ? 'normal' : 'nowrap',
                  }}>
                    {ev.message || ev.type}
                  </div>
                </div>

                {/* Expanded Detailed Inspection Drawer */}
                {isExpanded && (
                  <div style={{
                    padding: '14px 18px',
                    borderTop: '1px solid var(--border-card)',
                    backgroundColor: 'var(--bg-tertiary)',
                    fontSize: '0.78rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    animation: 'slideInDown 0.15s ease',
                  }}>
                    {/* Structured Key-Value Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                      {ev.tool && (
                        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                            Target Tool
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {ev.tool}
                          </span>
                        </div>
                      )}

                      {ev.data?.input && (
                        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                            Input Arguments
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--text-primary)' }}>
                            {typeof ev.data.input === 'object' ? JSON.stringify(ev.data.input) : String(ev.data.input)}
                          </span>
                        </div>
                      )}

                      {ev.data?.output && (
                        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                            Execution Output
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--accent-emerald)' }}>
                            {typeof ev.data.output === 'object' ? JSON.stringify(ev.data.output) : String(ev.data.output)}
                          </span>
                        </div>
                      )}

                      {ev.data?.changes && Array.isArray(ev.data.changes) && ev.data.changes.length > 0 && (
                        <div style={{ padding: '8px 10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                            State Changes
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--accent-purple)' }}>
                            {ev.data.changes.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Raw JSON Payload */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          Telemetry Event Payload
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          type: {ev.type}
                        </span>
                      </div>
                      <pre style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.71rem',
                        border: '1px solid var(--border-card)',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {JSON.stringify(
                          { ...ev, grid_state: ev.grid_state ? `[GridSnapshot: Gen=${ev.grid_state.generation_mw}MW Dem=${ev.grid_state.demand_mw}MW]` : undefined },
                          null,
                          2
                        )}
                      </pre>
                    </div>
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
