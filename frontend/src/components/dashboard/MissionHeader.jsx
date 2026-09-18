import React, { useState, useEffect } from 'react';
import {
  IconPlay,
  IconPause,
  IconRotateCcw,
  IconStepForward
} from '../ui/Icons';

export const MissionHeader = ({
  mission,
  isLoading,
  onStart,
  onStep,
  onStop,
  onReset
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [customGoal, setCustomGoal] = useState(mission?.goal || 'Maintain power to critical facilities');
  const [showGoalInput, setShowGoalInput] = useState(false);

  const status = mission?.status || 'IDLE';

  useEffect(() => {
    let interval = null;
    if (status === 'RUNNING') {
      interval = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWithGoal = () => {
    onStart(customGoal);
    setShowGoalInput(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Left: Goal & Mission Info */}
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
              ACTIVE MISSION
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
              #{mission?.mission_id || 'MISSION-001'}
            </span>
          </div>

          {showGoalInput ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-focus)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={handleStartWithGoal}
                className="btn-pill btn-pill-primary"
                style={{
                  padding: '6px 16px',
                  fontSize: '0.82rem',
                }}
              >
                Set & Run
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {mission?.goal || 'Maintain power to critical facilities'}
              </h2>
              {status === 'IDLE' && (
                <button
                  onClick={() => setShowGoalInput(true)}
                  style={{
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-card)',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Edit Goal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Mission Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Elapsed</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Plan ID</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-mind)' }}>
              #{mission?.plan_id ?? 0}
            </div>
          </div>

          <div style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Observations</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              {mission?.observation_count ?? 0}
            </div>
          </div>
        </div>

        {/* Right: Mission Action Controls — Cowboy Pill Styling */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {status !== 'RUNNING' ? (
            <button
              onClick={() => onStart(customGoal)}
              disabled={isLoading}
              className="btn-pill btn-pill-primary"
              style={{
                padding: '10px 22px',
                fontSize: '0.86rem',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }} />
              <IconPlay size={15} color="#ffffff" />
              <span>Start Mission</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={isLoading}
              className="btn-pill"
              style={{
                padding: '10px 22px',
                backgroundColor: 'var(--accent-amber)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.86rem',
              }}
            >
              <IconPause size={15} color="#ffffff" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isLoading || status === 'COMPLETED'}
            title="Execute a single step of the agent cycle"
            className="btn-pill btn-pill-secondary"
            style={{
              padding: '10px 18px',
              fontSize: '0.84rem',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <IconStepForward size={15} />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            disabled={isLoading}
            title="Reset Grid & Mission state"
            className="btn-pill btn-pill-secondary"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <IconRotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
