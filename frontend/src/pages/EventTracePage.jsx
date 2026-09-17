import React, { useState } from 'react';
import { EventTimeline } from '../components/events/EventTimeline';
import { IconCode } from '../components/ui/Icons';

export const EventTracePage = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = events.filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.type?.toLowerCase().includes(term) ||
      e.message?.toLowerCase().includes(term) ||
      e.tool?.toLowerCase().includes(term) ||
      JSON.stringify(e.data || {}).toLowerCase().includes(term)
    );
  });

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `gridmind_event_trace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Comprehensive Event Trace Inspector
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Chronological audit log of all observations, planner decisions, tool calls, and physical environment state changes.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search events, tools, or errors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.85rem',
              width: '260px'
            }}
          />

          <button
            onClick={exportJson}
            disabled={events.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: events.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <IconCode size={16} />
            <span>Export Trace JSON</span>
          </button>
        </div>
      </div>

      <EventTimeline events={filtered} />
    </div>
  );
};
