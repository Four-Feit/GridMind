import React, { useState, useEffect, useRef } from 'react';
import {
  IconZap,
  IconShield,
  IconBattery,
  IconAlertTriangle,
  IconRotateCcw
} from '../ui/Icons';

export const MetricsGrid = ({ gridState, events = [], updateGrid }) => {
  const gen = gridState?.generation_mw ?? 180;
  const demand = gridState?.demand_mw ?? 150;

  // Local interactive slider state for smooth dragging
  const [sliderGen, setSliderGen] = useState(gen);
  const [sliderDemand, setSliderDemand] = useState(demand);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isDraggingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Sync with live gridState when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setSliderGen(gen);
      setSliderDemand(demand);
    }
  }, [gen, demand]);

  const balance = sliderGen - sliderDemand;

  // Commit change to FastAPI backend -> Simulator
  const commitGridUpdate = async (newGen, newDemand) => {
    if (!updateGrid) return;
    setIsSyncing(true);
    try {
      await updateGrid({
        generation_mw: Number(newGen),
        demand_mw: Number(newDemand),
      });
    } catch (err) {
      console.error('Failed to update grid power balance:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenChange = (val) => {
    const num = Number(val);
    setSliderGen(num);
    isDraggingRef.current = true;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      commitGridUpdate(num, sliderDemand);
    }, 350);
  };

  const handleDemandChange = (val) => {
    const num = Number(val);
    setSliderDemand(num);
    isDraggingRef.current = true;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
      commitGridUpdate(sliderGen, num);
    }, 350);
  };

  const loads = gridState?.loads || [];
  const criticalLoads = loads.filter((l) => l.priority === 'critical');
  const criticalPowered = criticalLoads.filter((l) => l.connected && l.supplied_mw >= l.demand_mw);
  const criticalHealthPct = criticalLoads.length > 0 ? Math.round((criticalPowered.length / criticalLoads.length) * 100) : 100;

  const battery = gridState?.battery || { capacity_mwh: 100, remaining_mwh: 80 };
  const batteryPct = Math.round((battery.remaining_mwh / (battery.capacity_mwh || 1)) * 100);

  const failureCount = events.filter((e) => e.type === 'TOOL_FAILED').length;
  const replanCount = events.filter((e) => e.type === 'REPLAN_STARTED').length;
  const faultsCount = gridState?.failures?.length || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(280px, 1.35fr) repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      alignItems: 'stretch'
    }}>
      {/* 1. Genuinely Editable Power Balance Card */}
      <div
        className="glass-panel"
        style={{
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-secondary)',
          border: isEditing ? '1px solid var(--text-primary)' : '1px solid var(--border-card)',
          transition: 'border-color var(--transition-fast)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: balance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              boxShadow: balance >= 0 ? '0 0 8px var(--accent-emerald)' : '0 0 8px var(--accent-rose)',
            }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Power Balance
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSyncing && (
              <span style={{ fontSize: '0.67rem', color: 'var(--brand-mind)', fontFamily: 'var(--font-mono)' }}>
                syncing...
              </span>
            )}
            <button
              onClick={() => setIsEditing((v) => !v)}
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isEditing ? '#ffffff' : 'var(--text-secondary)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isEditing ? 'var(--text-primary)' : 'rgba(236, 229, 216, 0.7)',
                border: '1px solid var(--border-card)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {isEditing ? 'Done' : 'Adjust Sliders'}
            </button>
          </div>
        </div>

        {/* Sliders & Values */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '4px 0 10px 0' }}>
          {/* Generation Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Generation</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {sliderGen} MW
              </span>
            </div>
            {isEditing ? (
              <input
                type="range"
                min="40"
                max="240"
                step="5"
                value={sliderGen}
                onChange={(e) => handleGenChange(e.target.value)}
                className="power-slider"
                style={{
                  background: `linear-gradient(to right, var(--accent-cyan) 0%, var(--accent-cyan) ${((sliderGen - 40) / 200) * 100}%, var(--border-card) ${((sliderGen - 40) / 200) * 100}%, var(--border-card) 100%)`,
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (sliderGen / 220) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-cyan)' }} />
              </div>
            )}
          </div>

          {/* Demand Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Demand</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {sliderDemand} MW
              </span>
            </div>
            {isEditing ? (
              <input
                type="range"
                min="40"
                max="240"
                step="5"
                value={sliderDemand}
                onChange={(e) => handleDemandChange(e.target.value)}
                className="power-slider"
                style={{
                  background: `linear-gradient(to right, var(--accent-purple) 0%, var(--accent-purple) ${((sliderDemand - 40) / 200) * 100}%, var(--border-card) ${((sliderDemand - 40) / 200) * 100}%, var(--border-card) 100%)`,
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (sliderDemand / 220) * 100)}%`, height: '100%', backgroundColor: 'var(--accent-purple)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Net Balance Divider & Status */}
        <div style={{
          borderTop: '1px solid var(--border-card)',
          paddingTop: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Net balance</span>
          <span style={{
            fontSize: '0.86rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: balance >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          }}>
            {balance >= 0 ? `+${balance} MW Surplus` : `${balance} MW Deficit`}
          </span>
        </div>
      </div>

      {/* 2. Critical Facilities Coverage */}
      <div className="glass-panel" style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Critical Facilities
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: criticalHealthPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              boxShadow: criticalHealthPct === 100 ? '0 0 8px var(--accent-emerald)' : '0 0 8px var(--accent-rose)',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
              color: criticalHealthPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}>
              {criticalHealthPct}%
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ({criticalPowered.length}/{criticalLoads.length} secured)
            </span>
          </div>
        </div>
        <div style={{
          fontSize: '0.73rem',
          color: criticalHealthPct === 100 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          fontWeight: 600,
          marginTop: '8px'
        }}>
          {criticalHealthPct === 100 ? '● Hospital & water plant nominal' : '▲ Critical deficit detected!'}
        </div>
      </div>

      {/* 3. Battery Storage */}
      <div className="glass-panel" style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              B1 Storage Reserve
            </span>
            <IconBattery size={16} color="var(--brand-mind)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {battery.remaining_mwh}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {battery.capacity_mwh} MWh</span>
          </div>
        </div>
        <div>
          <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${batteryPct}%`, height: '100%', backgroundColor: 'var(--brand-mind)', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>
            {batteryPct}% capacity available
          </div>
        </div>
      </div>

      {/* 4. Autonomous Replans */}
      <div className="glass-panel" style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Dynamic Replans
            </span>
            <IconRotateCcw size={16} color="var(--brand-mind)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {replanCount}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ({failureCount} handled)
            </span>
          </div>
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>
          Autonomous LLM reasoning cycles
        </div>
      </div>

      {/* 5. Active Grid Faults */}
      <div className="glass-panel" style={{
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-card)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Active Faults
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: faultsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              boxShadow: faultsCount > 0 ? '0 0 8px var(--accent-rose)' : '0 0 8px var(--accent-emerald)',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
              color: faultsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'
            }}>
              {faultsCount}
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>disturbances</span>
          </div>
        </div>
        <div style={{
          fontSize: '0.73rem',
          color: faultsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
          fontWeight: 600,
          marginTop: '8px'
        }}>
          {faultsCount > 0 ? '▲ Fault isolation engaged' : '● Grid nominal within safety bounds'}
        </div>
      </div>
    </div>
  );
};
