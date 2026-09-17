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
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--accent-cyan)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Set & Run
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {mission?.goal || 'Maintain power to critical facilities'}
              </h2>
              {status === 'IDLE' && (
                <button
                  onClick={() => setShowGoalInput(true)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-cyan)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                  }}
                >
                  Edit Goal
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Mission Telemetry Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Elapsed</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatTime(elapsedTime)}
            </div>
          </div>

          <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Plan ID</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
              #{mission?.plan_id ?? 0}
            </div>
          </div>

          <div style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Observations</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {mission?.observation_count ?? 0}
            </div>
          </div>
        </div>

        {/* Right: Mission Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status !== 'RUNNING' ? (
            <button
              onClick={() => onStart(customGoal)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-cyan)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: 'var(--glow-cyan)',
                transition: 'all var(--transition-fast)',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <IconPlay size={16} color="#ffffff" />
              <span>Start Mission</span>
            </button>
          ) : (
            <button
              onClick={onStop}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-amber)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all var(--transition-fast)'
              }}
            >
              <IconPause size={16} color="#ffffff" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isLoading || status === 'COMPLETED'}
            title="Execute a single step of the agent cycle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <IconStepForward size={16} />
            <span>Step</span>
          </button>

          <button
            onClick={onReset}
            disabled={isLoading}
            title="Reset Grid & Mission state"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            <IconRotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
