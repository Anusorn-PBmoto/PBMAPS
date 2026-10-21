import React, { useState } from 'react';
import {
  Download,
  Flag,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Square,
  TrendingUp,
  Clock,
  Compass,
  Share2,
  Lock,
} from 'lucide-react';
import { GeoPoint, TrackRecord, Waypoint, WaypointCategory } from '../types';
import { computeTrackMetrics, formatDistance } from '../utils/geo';
import { downloadGPXFile } from '../utils/gpx';

interface TrailRecorderProps {
  isRecording: boolean;
  isPaused: boolean;
  activeTrackPoints: GeoPoint[];
  elapsedSeconds: number;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopAndSaveRecording: (trackName: string) => void;
  onDropWaypoint: (category: WaypointCategory, name: string, note?: string) => void;
  isBacktracking: boolean;
  onToggleBacktracking: () => void;
  activeTrackWaypoints: Waypoint[];
  onOpenPocketMode?: () => void;
}

export const TrailRecorder: React.FC<TrailRecorderProps> = ({
  isRecording,
  isPaused,
  activeTrackPoints,
  elapsedSeconds,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopAndSaveRecording,
  onDropWaypoint,
  isBacktracking,
  onToggleBacktracking,
  activeTrackWaypoints,
  onOpenPocketMode,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [trackNameInput, setTrackNameInput] = useState('');
  const [showWaypointDialog, setShowWaypointDialog] = useState(false);
  const [waypointCategory, setWaypointCategory] = useState<WaypointCategory>('camp');
  const [waypointName, setWaypointName] = useState('');
  const [waypointNote, setWaypointNote] = useState('');

  // Compute live metrics
  const metrics = computeTrackMetrics(activeTrackPoints);

  // Format elapsed time (HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Average speed in km/h
  const avgSpeedKmh =
    elapsedSeconds > 0 ? ((metrics.totalDistanceMeters / 1000) / (elapsedSeconds / 3600)).toFixed(1) : '0.0';

  // Current altitude
  const currentAltitude = activeTrackPoints[activeTrackPoints.length - 1]?.altitude;

  // Build SVG Elevation Profile
  const renderElevationSvg = () => {
    if (activeTrackPoints.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center text-slate-500 text-xs italic bg-slate-950/60 rounded-lg border border-slate-800">
          Recording trail to plot elevation profile...
        </div>
      );
    }

    const width = 360;
    const height = 90;
    const padding = 10;

    const minEle = Math.max(0, metrics.minElevationMeters - 20);
    const maxEle = Math.max(minEle + 50, metrics.maxElevationMeters + 20);
    const eleRange = maxEle - minEle || 1;

    // Sample points for smooth rendering
    const sampledPoints = activeTrackPoints.filter((_, idx) =>
      idx % Math.max(1, Math.floor(activeTrackPoints.length / 50)) === 0
    );

    const coords = sampledPoints.map((pt, idx) => {
      const x = padding + (idx / (sampledPoints.length - 1)) * (width - 2 * padding);
      const ele = pt.altitude ?? minEle;
      const y = height - padding - ((ele - minEle) / eleRange) * (height - 2 * padding);
      return `${x},${y}`;
    });

    const pathD = `M ${padding},${height - padding} L ${coords.join(' L ')} L ${width - padding},${height - padding} Z`;
    const strokeD = `M ${coords.join(' L ')}`;

    return (
      <div className="relative h-28 w-full bg-slate-950/80 rounded-lg border border-slate-800 p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <defs>
            <linearGradient id="eleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Fill under curve */}
          <path d={pathD} fill="url(#eleGradient)" />
          {/* Elevation line */}
          <path d={strokeD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Min/Max elevation labels */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400">
          Max: <span className="text-amber-400 font-bold">{metrics.maxElevationMeters}m</span>
        </div>
        <div className="absolute bottom-1 left-2 text-[10px] font-mono text-slate-400">
          Min: <span className="text-slate-300">{metrics.minElevationMeters}m</span>
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400">
          Gain: <span className="text-emerald-400 font-bold">+{metrics.elevationGainMeters}m</span>
        </div>
      </div>
    );
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = trackNameInput.trim() || `Wilderness Trail ${new Date().toLocaleDateString('th-TH')}`;
    onStopAndSaveRecording(finalName);
    setShowSaveDialog(false);
    setTrackNameInput('');
  };

  const handleWaypointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waypointName.trim()) return;
    onDropWaypoint(waypointCategory, waypointName.trim(), waypointNote.trim());
    setShowWaypointDialog(false);
    setWaypointName('');
    setWaypointNote('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tactical Big Numbers Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Distance */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Distance</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
            {formatDistance(metrics.totalDistanceMeters)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
            {activeTrackPoints.length} trackpoints
          </span>
        </div>

        {/* Elapsed Time */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Time
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums mt-0.5">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
            Avg: {avgSpeedKmh} km/h
          </span>
        </div>

        {/* Elevation Gain */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Gain / Loss
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            +{metrics.elevationGainMeters}m
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
            -{metrics.elevationLossMeters}m loss
          </span>
        </div>

        {/* Current Altitude */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Altitude</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-blue-400 tabular-nums mt-0.5">
            {currentAltitude ? `${Math.round(currentAltitude)}m` : '---'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
            Peak: {metrics.maxElevationMeters}m
          </span>
        </div>
      </div>

      {/* Elevation Profile Chart */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">Live Elevation Profile</span>
          <span className="text-[11px] text-slate-500 font-mono">
            {activeTrackWaypoints.length} waypoints saved
          </span>
        </div>
        {renderElevationSvg()}
      </div>

      {/* Recording Controls */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {!isRecording ? (
          <button
            onClick={onStartRecording}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Recording Trail</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onResumeRecording}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Track</span>
              </button>
            ) : (
              <button
                onClick={onPauseRecording}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => setShowSaveDialog(true)}
              className="py-3 px-4 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Square className="w-4 h-4 fill-red-400" />
              <span>Finish & Save</span>
            </button>
          </>
        )}

        <button
          onClick={() => setShowWaypointDialog(true)}
          className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          title="Drop Waypoint at GPS position"
        >
          <MapPin className="w-4 h-4" />
          <span>Add Waypoint</span>
        </button>

        {activeTrackPoints.length > 5 && (
          <button
            onClick={onToggleBacktracking}
            className={`py-3 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
              isBacktracking
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
            }`}
            title="Reverse-navigate along trail to trailhead"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isBacktracking ? 'Backtracking Active' : 'Backtrack Mode'}</span>
          </button>
        )}

        {onOpenPocketMode && (
          <button
            onClick={onOpenPocketMode}
            className="py-3 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ml-auto"
            title="Lock screen and conserve battery while tracking in pocket"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>โหมดกระเป๋า (Pocket Lock)</span>
          </button>
        )}
      </div>

      {/* Save Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveSubmit}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200"
          >
            <h3 className="text-base font-bold text-white mb-1">Save Trail to Offline GPX</h3>
            <p className="text-xs text-slate-400 mb-4">
              Export recorded trail with {activeTrackPoints.length} points and {activeTrackWaypoints.length} waypoints.
            </p>

            <label className="block text-xs font-semibold text-slate-300 mb-1">Trail Name</label>
            <input
              type="text"
              required
              value={trackNameInput}
              onChange={(e) => setTrackNameInput(e.target.value)}
              placeholder="e.g. Doi Mon Chong Ridge, Chiang Mai"
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 mb-4"
            />

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 mb-6 text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="text-amber-400 font-bold">{formatDistance(metrics.totalDistanceMeters)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-white">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex justify-between">
                <span>Elevation Gain:</span>
                <span className="text-emerald-400">+{metrics.elevationGainMeters}m</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save & Export GPX</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waypoint Dropper Modal */}
      {showWaypointDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleWaypointSubmit}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200"
          >
            <h3 className="text-base font-bold text-white mb-3">Drop Waypoint</h3>

            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(
                [
                  { id: 'camp', label: '⛺ Camp', color: 'border-blue-500 text-blue-400' },
                  { id: 'water', label: '💧 Water', color: 'border-cyan-500 text-cyan-400' },
                  { id: 'summit', label: '▲ Peak', color: 'border-purple-500 text-purple-400' },
                  { id: 'hazard', label: '⚠ Hazard', color: 'border-red-500 text-red-400' },
                  { id: 'trailhead', label: '🚩 Start', color: 'border-emerald-500 text-emerald-400' },
                  { id: 'poi', label: '📍 Point', color: 'border-amber-500 text-amber-400' },
                ] as const
              ).map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setWaypointCategory(cat.id)}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition ${
                    waypointCategory === cat.id
                      ? `bg-slate-800 ${cat.color} font-bold ring-1 ring-current`
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1">Waypoint Name</label>
            <input
              type="text"
              required
              value={waypointName}
              onChange={(e) => setWaypointName(e.target.value)}
              placeholder="e.g. Freshwater Stream, Camp Site 2"
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 mb-3"
            />

            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <textarea
              value={waypointNote}
              onChange={(e) => setWaypointNote(e.target.value)}
              placeholder="Water drinkable after boiling, sheltered from wind..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 mb-6"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWaypointDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Mark Waypoint</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
