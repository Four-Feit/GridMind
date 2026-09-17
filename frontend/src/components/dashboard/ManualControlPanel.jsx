import React, { useState } from 'react';

const ToggleSwitch = ({ checked, onChange, label, color = 'var(--accent-cyan)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 'var(--radius-full)',
        backgroundColor: checked ? color : 'var(--border-card)',
        position: 'relative', transition: 'background-color var(--transition-fast)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 20 : 3,
        width: 16, height: 16, borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left var(--transition-spring)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  </div>
);

const SliderRow = ({ label, value, min, max, step = 1, unit, onChange, color = 'var(--accent-cyan)' }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
        {value} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit}</span>
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%', height: 5, appearance: 'none', outline: 'none',
        borderRadius: 'var(--radius-full)', cursor: 'pointer',
        background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, var(--border-card) ${((value - min) / (max - min)) * 100}%)`,
      }}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{min} {unit}</span>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{max} {unit}</span>
    </div>
  </div>
);

export const ManualControlPanel = ({ gridState, updateGrid, isLoading }) => {
  const [feedback, setFeedback] = useState(null);
  const [applying, setApplying] = useState(null);

  const generators = gridState?.generators || [];
  const loads = gridState?.loads || [];
  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80, max_output_mw: 40, online: true };
  const lines = gridState?.transmission_lines || [];

  const [genValues, setGenValues] = useState({});
  const [loadValues, setLoadValues] = useState({});
  const [batteryValue, setBatteryValue] = useState(battery.remaining_mwh);

  const apply = async (payload, label) => {
    setApplying(label);
    setFeedback(null);
    try {
      await updateGrid(payload);
      setFeedback({ success: true, message: `Applied: ${label}` });
    } catch (err) {
      setFeedback({ success: false, message: `Failed: ${err.message}` });
    } finally {
      setApplying(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {/* Feedback */}
      {feedback && (
        <div style={{
          gridColumn: '1 / -1',
          padding: '10px 16px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: feedback.success ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
          color: feedback.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          border: `1px solid ${feedback.success ? 'rgba(5,150,105,0.3)' : 'rgba(225,29,72,0.3)'}`,
          animation: 'slideInDown 0.2s ease',
        }}>
          <span>{feedback.success ? '✓' : '✕'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Generator Controls */}
      {generators.map((g) => {
        const localMw = genValues[g.id] ?? g.available_mw;
        return (
          <div key={g.id} className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {g.id}
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {g.type || 'Generator'}
                </span>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: g.online ? 'var(--accent-emerald-dim)' : 'var(--accent-rose-dim)',
                color: g.online ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              }}>
                {g.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <SliderRow
              label="Output"
              value={localMw}
              min={0} max={g.capacity_mw || 150} step={5} unit="MW"
              color="var(--accent-cyan)"
              onChange={(v) => setGenValues(prev => ({ ...prev, [g.id]: v }))}
            />

            <ToggleSwitch
              label="Generator online"
              checked={g.online}
              color="var(--accent-emerald)"
              onChange={(v) => apply({ generator_id: g.id, generator_online: v }, `${g.id} ${v ? 'online' : 'offline'}`)}
            />

            <button
              onClick={() => apply({ generator_id: g.id, generator_available_mw: localMw }, `${g.id} → ${localMw}MW`)}
              disabled={isLoading || applying !== null}
              style={{
                marginTop: '14px', width: '100%', padding: '8px',
                borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--accent-cyan)', border: '1px solid rgba(2,132,199,0.3)',
                backgroundColor: 'var(--accent-cyan-dim)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1, transition: 'all var(--transition-fast)',
              }}
            >
              {applying === `${g.id} → ${localMw}MW` ? 'Applying…' : 'Apply Output Change'}
            </button>
          </div>
        );
      })}

      {/* Battery Controls */}
      <div className="glass-panel" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Battery Storage</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{battery.id || 'B1'} · {battery.max_output_mw}MW max</span>
          </div>
        </div>

        <SliderRow
          label="Charge level"
          value={batteryValue}
          min={0} max={battery.capacity_mwh || 100} step={5} unit="MWh"
          color="var(--accent-purple)"
          onChange={setBatteryValue}
        />

        <ToggleSwitch
          label="Battery online"
          checked={battery.online}
          color="var(--accent-emerald)"
          onChange={(v) => apply({ battery_online: v }, `Battery ${v ? 'online' : 'offline'}`)}
        />

        <button
          onClick={() => apply({ battery_remaining_mwh: batteryValue }, `Battery → ${batteryValue}MWh`)}
          disabled={isLoading || applying !== null}
          style={{
            marginTop: '14px', width: '100%', padding: '8px',
            borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--accent-purple)', border: '1px solid rgba(124,58,237,0.3)',
            backgroundColor: 'var(--accent-purple-dim)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1, transition: 'all var(--transition-fast)',
          }}
        >
          {applying?.startsWith('Battery →') ? 'Applying…' : 'Set Battery Level'}
        </button>
      </div>

      {/* Load Controls */}
      {loads.map((l) => {
        const localDemand = loadValues[l.id] ?? l.demand_mw;
        const isCritical = l.priority === 'critical';
        return (
          <div key={l.id} className="glass-panel" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {l.id.replace(/_/g, ' ')}
                </h4>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isCritical ? 'var(--accent-rose-dim)' : 'var(--bg-tertiary)',
                  color: isCritical ? 'var(--accent-rose)' : 'var(--text-muted)',
                }}>
                  {isCritical ? 'CRITICAL' : 'NORMAL'}
                </span>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: l.connected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              }}>
                {l.connected ? '● Connected' : '○ Disconnected'}
              </span>
            </div>

            <SliderRow
              label="Demand"
              value={localDemand}
              min={0} max={100} step={5} unit="MW"
              color={isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)'}
              onChange={(v) => setLoadValues(prev => ({ ...prev, [l.id]: v }))}
            />

            <ToggleSwitch
              label="Load connected"
              checked={l.connected}
              color="var(--accent-emerald)"
              onChange={(v) => apply({ load_id: l.id, load_connected: v }, `${l.id} ${v ? 'connected' : 'shed'}`)}
            />

            <button
              onClick={() => apply({ load_id: l.id, load_demand_mw: localDemand }, `${l.id} demand → ${localDemand}MW`)}
              disabled={isLoading || applying !== null}
              style={{
                marginTop: '14px', width: '100%', padding: '8px',
                borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600,
                color: 'var(--accent-amber)', border: '1px solid rgba(217,119,6,0.3)',
                backgroundColor: 'var(--accent-amber-dim)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1, transition: 'all var(--transition-fast)',
              }}
            >
              Apply Demand Change
            </button>
          </div>
        );
      })}

      {/* Transmission Line Controls */}
      {lines.length > 0 && (
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            Transmission Lines
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lines.map((line) => (
              <ToggleSwitch
                key={line.id}
                label={`${line.id}: ${line.from} → ${line.to} (${line.capacity_mw}MW cap)`}
                checked={line.online}
                color="var(--accent-cyan)"
                onChange={(v) => apply({ line_id: line.id, line_online: v }, `${line.id} ${v ? 'restored' : 'tripped'}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
