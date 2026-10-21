import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Compass, Navigation, Battery, ShieldAlert } from 'lucide-react';
import { GeoPoint } from '../types';
import { formatDistance, formatDMS } from '../utils/geo';

interface PocketModeModalProps {
  isOpen: boolean;
  onExit: () => void;
  userLocation: GeoPoint | null;
  compassHeading: number;
  isRecording: boolean;
  recordedDistanceMeters: number;
  elapsedSeconds: number;
  onTriggerSos: () => void;
  isUserInSos: boolean;
}

export const PocketModeModal: React.FC<PocketModeModalProps> = ({
  isOpen,
  onExit,
  userLocation,
  compassHeading,
  isRecording,
  recordedDistanceMeters,
  elapsedSeconds,
  onTriggerSos,
  isUserInSos,
}) => {
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding) {
      interval = setInterval(() => {
        setUnlockProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onExit();
            return 0;
          }
          return prev + 10;
        });
      }, 100);
    } else {
      setUnlockProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, onExit]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-slate-300 flex flex-col justify-between p-6 select-none touch-none">
      {/* Top Status */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400 font-bold">GPS & MESH RUNNING (OLED SLEEP)</span>
        </div>
        <div className="text-slate-400">
          Alt: {userLocation?.altitude ? `${Math.round(userLocation.altitude)}m` : '---'}
        </div>
      </div>

      {/* Center Minimal HUD */}
      <div className="flex flex-col items-center justify-center my-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            POCKET LOCK (BATTERY SAVER 85%)
          </p>
          <p className="text-5xl font-mono font-bold text-white tabular-nums">
            {formatDistance(recordedDistanceMeters)}
          </p>
          {isRecording && (
            <p className="text-xs font-mono text-amber-400">
              Recording · {formatTime(elapsedSeconds)}
            </p>
          )}
        </div>

        {/* Compass Heading */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-900 font-mono text-xs">
          <Compass
            className="w-5 h-5 text-amber-500 transition-transform"
            style={{ transform: `rotate(${compassHeading}deg)` }}
          />
          <span className="text-lg font-bold text-white">{Math.round(compassHeading)}°</span>
          <span className="text-slate-500">|</span>
          <span className="text-[11px] text-slate-400">
            {userLocation ? `${formatDMS(userLocation.lat, true)} ${formatDMS(userLocation.lng, false)}` : 'GPS Searching'}
          </span>
        </div>

        {/* Big Emergency SOS Button (always reachable even in pocket mode) */}
        <button
          onClick={onTriggerSos}
          className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition ${
            isUserInSos
              ? 'bg-red-600 border-red-500 text-white animate-pulse'
              : 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isUserInSos ? 'SOS TRANSMITTING' : 'EMERGENCY SOS'}</span>
        </button>
      </div>

      {/* Bottom Hold to Unlock Slider Button */}
      <div className="pb-6 flex flex-col items-center gap-3">
        <p className="text-[11px] font-mono text-slate-500">
          ป้องกันหน้าจอทัชลั่นในกระเป๋า (แตะค้าง 1 วินาทีเพื่อปลดล็อค)
        </p>
        <button
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
          className="relative w-full max-w-xs h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs uppercase tracking-wider text-slate-300 transition active:scale-98"
        >
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-amber-500/30 transition-all duration-75"
            style={{ width: `${unlockProgress}%` }}
          />
          <div className="relative z-10 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{isHolding ? 'กำลังปลดล็อค...' : 'แตะค้างเพื่อปลดล็อคหน้าจอ'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
