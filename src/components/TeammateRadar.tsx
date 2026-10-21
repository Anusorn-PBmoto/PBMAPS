import React, { useState } from 'react';
import {
  AlertOctagon,
  Battery,
  Compass,
  Navigation2,
  Radio,
  Signal,
  UserCheck,
  UserPlus,
  Trash2,
  Lock,
  X,
  Plus,
} from 'lucide-react';
import { GeoPoint, MeshPeer, SosAlert } from '../types';
import {
  bearingToCardinal,
  calculateBearing,
  calculateHaversineDistance,
  formatDistance,
} from '../utils/geo';

interface TeammateRadarProps {
  userLocation: GeoPoint | null;
  compassHeading: number;
  peers: MeshPeer[];
  selectedPeerId: string | null;
  onSelectPeer: (peerId: string | null) => void;
  activeSosAlerts: SosAlert[];
  onTriggerSos: () => void;
  onResolveSos: (alertId: string) => void;
  isUserInSos: boolean;
  onAddPeer?: (peer: MeshPeer) => void;
  onRemovePeer?: (peerId: string) => void;
  onOpenPocketMode?: () => void;
}

export const TeammateRadar: React.FC<TeammateRadarProps> = ({
  userLocation,
  compassHeading,
  peers,
  selectedPeerId,
  onSelectPeer,
  activeSosAlerts,
  onTriggerSos,
  onResolveSos,
  isUserInSos,
  onAddPeer,
  onRemovePeer,
  onOpenPocketMode,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCallsign, setNewCallsign] = useState('');
  const [newRole, setNewRole] = useState<MeshPeer['role']>('Scout');
  const [newColor, setNewColor] = useState('#10B981');
  const [newChannel, setNewChannel] = useState('LoRa Ch 01 (915.0 MHz)');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCallsign.trim()) return;

    // Place near user or default center with slight random offset
    const baseLat = userLocation?.lat || 14.4392;
    const baseLng = userLocation?.lng || 101.3724;
    const offsetLat = (Math.random() - 0.5) * 0.005;
    const offsetLng = (Math.random() - 0.5) * 0.005;

    const newPeer: MeshPeer = {
      id: `peer-${Date.now()}`,
      callsign: newCallsign.trim(),
      role: newRole,
      lat: baseLat + offsetLat,
      lng: baseLng + offsetLng,
      altitude: (userLocation?.altitude || 780) + Math.round(Math.random() * 30 - 15),
      batteryPct: 95,
      lastSeen: Date.now(),
      rssi: -78,
      snr: 9.8,
      status: 'active',
      channel: newChannel,
      avatarColor: newColor,
      heading: Math.floor(Math.random() * 360),
      speedKmh: 2.8,
    };

    onAddPeer?.(newPeer);
    setShowAddModal(false);
    setNewCallsign('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Action Toolbar: Add Teammate + Pocket Lock Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>เพิ่มเพื่อนในกลุ่ม (+ Add)</span>
        </button>

        {onOpenPocketMode && (
          <button
            onClick={onOpenPocketMode}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-400 flex items-center gap-1.5 transition active:scale-95 shadow-md"
            title="ทำงานต่อเนื่องแม้ปิดหน้าจอ / โหมดกระเป๋าเซฟแบต 85%"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">โหมดกระเป๋า</span>
            <span className="sm:hidden">กระเป๋า</span>
          </button>
        )}
      </div>

      {/* SOS Alert Banner if any SOS is active */}
      {activeSosAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/80 border-2 border-red-500 shadow-xl shadow-red-950/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide">
              <AlertOctagon className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
              <span>EMERGENCY DISTRESS BEACON ACTIVE</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-white animate-pulse">
              SOS PRIORITY
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {activeSosAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-red-900/40 border border-red-800 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="font-bold text-white text-sm">
                    {alert.peerName} ({alert.peerId})
                  </p>
                  <p className="font-mono text-red-300 mt-0.5">
                    Coords: {alert.lat.toFixed(5)}, {alert.lng.toFixed(5)} · Alt: {alert.altitude}m · Batt: {alert.batteryPct}%
                  </p>
                  <p className="text-red-300 italic mt-1 font-medium">"{alert.message}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectPeer(alert.peerId)}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
                  >
                    Lock-on Map
                  </button>
                  <button
                    onClick={() => onResolveSos(alert.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teammates List & Compass Direction Radar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {peers.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            ยังไม่มีเพื่อนในกลุ่ม กดปุ่ม "+ เพิ่มเพื่อนในกลุ่ม" เพื่อเริ่มติดตาม
          </div>
        ) : (
          peers.map((peer) => {
            let distanceMeters = 0;
            let bearingDeg = 0;
            let relativePointerDeg = 0;
            let eleDiff = 0;

            if (userLocation) {
              distanceMeters = calculateHaversineDistance(
                userLocation.lat,
                userLocation.lng,
                peer.lat,
                peer.lng
              );
              bearingDeg = calculateBearing(
                userLocation.lat,
                userLocation.lng,
                peer.lat,
                peer.lng
              );
              relativePointerDeg = (bearingDeg - compassHeading + 360) % 360;

              if (userLocation.altitude !== undefined && peer.altitude !== undefined) {
                eleDiff = Math.round(peer.altitude - userLocation.altitude);
              }
            }

            const isSelected = peer.id === selectedPeerId;
            const isSos = peer.status === 'sos';

            return (
              <div
                key={peer.id}
                onClick={() => onSelectPeer(isSelected ? null : peer.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSos
                    ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30'
                    : isSelected
                    ? 'bg-slate-800/90 border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Role Avatar + Callsign Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm border-2 border-slate-700 shadow shrink-0"
                      style={{ backgroundColor: isSos ? '#EF4444' : peer.avatarColor }}
                    >
                      {peer.callsign[0]}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white tracking-tight">
                          {peer.callsign}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {peer.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                        <span>Alt: {Math.round(peer.altitude)}m</span>
                        {eleDiff !== 0 && (
                          <span
                            className={`font-semibold ${
                              eleDiff > 0 ? 'text-amber-400' : 'text-blue-400'
                            }`}
                          >
                            ({eleDiff > 0 ? `+${eleDiff}m` : `${eleDiff}m`})
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-slate-500">
                          {Math.round((Date.now() - peer.lastSeen) / 1000)}s ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Distance, Bearing & Delete Action */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-base text-amber-400 tabular-nums">
                        {userLocation ? formatDistance(distanceMeters) : '---'}
                      </span>
                      {/* Direction Compass Arrow */}
                      <div
                        className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow transition-transform duration-300"
                        style={{ transform: `rotate(${relativePointerDeg}deg)` }}
                        title={`Bearing: ${Math.round(bearingDeg)}° (${bearingToCardinal(bearingDeg)})`}
                      >
                        <Navigation2 className="w-4 h-4 fill-amber-400" />
                      </div>

                      {/* Remove Friend Button */}
                      {onRemovePeer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`ต้องการลบ ${peer.callsign} ออกจากกลุ่มใช่หรือไม่?`)) {
                              onRemovePeer(peer.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition opacity-80 group-hover:opacity-100"
                          title="ลบเพื่อนคนนี้ออกจากกลุ่ม"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {Math.round(bearingDeg)}° {bearingToCardinal(bearingDeg)}
                    </span>
                  </div>
                </div>

                {/* Bottom Telemetry: Battery, RSSI, Frequency */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span
                      className={
                        peer.batteryPct < 25
                          ? 'text-red-400 font-bold'
                          : peer.batteryPct < 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {peer.batteryPct}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1" title="LoRa Signal Strength">
                    <Signal className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300">{peer.rssi} dBm</span>
                    <span className="text-slate-500 text-[10px]">(SNR {peer.snr})</span>
                  </div>

                  <div className="text-slate-500 text-[10px] truncate max-w-[130px]">
                    {peer.channel}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Emergency Distress Button */}
      <div className="pt-2">
        <button
          onClick={onTriggerSos}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
            isUserInSos
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-red-950/80 hover:bg-red-900 border border-red-600/50 text-red-300'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-red-500" />
          <span>{isUserInSos ? 'Broadcasting SOS Beacon... (Tap to Cancel)' : 'Broadcast Emergency SOS Beacon'}</span>
        </button>
      </div>

      {/* Add Teammate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">เพิ่มเพื่อนร่วมทีมในกลุ่ม</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อ / Callsign เพื่อน:
            </label>
            <input
              type="text"
              required
              value={newCallsign}
              onChange={(e) => setNewCallsign(e.target.value)}
              placeholder="เช่น นายเอก (Scout), หมอนก (Medic)"
              className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 mb-3"
            />

            <label className="block text-xs font-semibold text-slate-300 mb-1">
              บทบาทในทีม (Role):
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['Leader', 'Scout', 'Navigator', 'Medic', 'Tail-End'] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setNewRole(r)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                    newRole === r
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1">
              สีไอคอนประจำตัว:
            </label>
            <div className="flex items-center gap-2 mb-4">
              {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'].map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setNewColor(col)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    newColor === col ? 'scale-110 border-white ring-2 ring-current' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ช่องทางการเชื่อมต่อ:
            </label>
            <select
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white mb-6"
            >
              <option value="LoRa Ch 01 (915.0 MHz)">LoRa Ch 01 (915.0 MHz) - ทะลุป่าลึก</option>
              <option value="LoRa Ch 02 (433.175 MHz)">LoRa Ch 02 (433.175 MHz) - ย่านต่ำ</option>
              <option value="Bluetooth BLE Mesh">Bluetooth BLE Mesh - ออฟไลน์ระยะใกล้</option>
              <option value="Internet Cloud (4G/5G)">Internet Cloud (4G/5G) - ทั่วโลก</option>
              <option value="Voice Radio (ว.2)">Voice Radio (ว.ดำ/แดง) - พิกัดขานปากเปล่า</option>
            </select>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มเพื่อนลงในทีม</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
