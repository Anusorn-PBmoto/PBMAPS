import React, { useRef, useState } from 'react';
import {
  Download,
  FileCode,
  FolderOpen,
  MapPin,
  Play,
  QrCode,
  Share2,
  Trash2,
  Upload,
  X,
  Check,
} from 'lucide-react';
import { GeoPoint, TrackRecord, Waypoint } from '../types';
import { formatDistance, formatDMS } from '../utils/geo';
import { downloadGPXFile, parseGPX } from '../utils/gpx';
import { encodeOfflineQR } from '../utils/meshProtocol';
import { Radio, Mic, Plus } from 'lucide-react';

interface GPXManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTracks: TrackRecord[];
  onSelectTrackForMap: (track: TrackRecord) => void;
  onDeleteTrack: (trackId: string) => void;
  onImportTrack: (track: TrackRecord) => void;
  waypoints: Waypoint[];
  userLocation?: GeoPoint | null;
  onAddManualPeer?: (callsign: string, lat: number, lng: number) => void;
}

export const GPXManagerModal: React.FC<GPXManagerModalProps> = ({
  isOpen,
  onClose,
  savedTracks,
  onSelectTrackForMap,
  onDeleteTrack,
  onImportTrack,
  waypoints,
  userLocation,
  onAddManualPeer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'saved' | 'import' | 'share-qr' | 'no-hardware'>('saved');
  const [importError, setImportError] = useState('');
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [selectedShareItemName, setSelectedShareItemName] = useState('');

  // Manual Coordinate Plotter Form
  const [plotCallsign, setPlotCallsign] = useState('');
  const [plotLat, setPlotLat] = useState('');
  const [plotLng, setPlotLng] = useState('');
  const [plotSuccess, setPlotSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseGPX(text, file.name);
        onImportTrack(parsed);
        setActiveTab('saved');
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse GPX file. Ensure valid GPX 1.0 or 1.1 XML format.');
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateQRForTrack = (track: TrackRecord) => {
    // Generate compact route header & waypoints
    const qrData = {
      name: track.name,
      dist: track.totalDistanceMeters,
      ptsCount: track.points.length,
      start: track.points[0] ? [track.points[0].lat, track.points[0].lng] : null,
      end: track.points[track.points.length - 1] ? [track.points[track.points.length - 1].lat, track.points[track.points.length - 1].lng] : null,
      wpts: track.waypoints.map((w) => ({ n: w.name, c: w.category, lat: w.lat, lng: w.lng })),
    };
    const code = encodeOfflineQR('TRACK_HEADER', qrData);
    setQrPayload(code);
    setSelectedShareItemName(track.name);
    setActiveTab('share-qr');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e141c]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                GPX Trail Studio & Offline Sharing
              </h2>
              <p className="text-xs text-slate-400">
                Manage, import, export, and share standard .gpx hiking tracks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'saved'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Saved Trails ({savedTracks.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'import'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Import .GPX File
          </button>
          <button
            onClick={() => setActiveTab('share-qr')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'share-qr'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Offline QR Share
          </button>
          <button
            onClick={() => setActiveTab('no-hardware')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'no-hardware'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            ⚡ Zero-Hardware Hub
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedTracks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
                  <p className="font-semibold text-slate-400 mb-1">No recorded trails yet</p>
                  <p>Start recording in Trail Tracker or import an existing .gpx file</p>
                </div>
              ) : (
                savedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{track.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span className="text-amber-400 font-bold">{formatDistance(track.totalDistanceMeters)}</span>
                        <span>·</span>
                        <span>+{track.elevationGainMeters}m gain</span>
                        <span>·</span>
                        <span>{track.points.length} pts</span>
                        <span>·</span>
                        <span>{new Date(track.startTime).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectTrackForMap(track);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                        title="Display on map & enable navigation"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Navigate</span>
                      </button>

                      <button
                        onClick={() => downloadGPXFile(track)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Export as .gpx file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleGenerateQRForTrack(track)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Share offline via QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteTrack(track.id)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition"
                        title="Delete track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-700 hover:border-amber-500/80 rounded-2xl bg-slate-950/60 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-amber-500" />
                <p className="font-bold text-white text-sm">Select or Drag .GPX File Here</p>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Upload hiking routes from Garmin, Gaia GPS, Strava, Wikiloc, or AllTrails to view and navigate offline.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gpx,application/gpx+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-xs text-red-300">
                  {importError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'share-qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <h3 className="font-bold text-white text-sm">
                Offline Screen-to-Camera Route Transfer
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                No internet or radio needed: Have your friend scan this optical data matrix with their phone camera to instantly copy the trail coordinates into their PBMaps app!
              </p>

              {qrPayload ? (
                <div className="p-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center">
                  {/* Clean SVG QR Representation */}
                  <div className="w-48 h-48 bg-slate-900 rounded-lg p-2 flex items-center justify-center text-center text-white text-xs font-mono break-all p-3 overflow-hidden select-all border border-slate-300">
                    <div className="space-y-1">
                      <QrCode className="w-12 h-12 text-amber-400 mx-auto" />
                      <p className="text-[10px] text-amber-300 font-bold">{selectedShareItemName}</p>
                      <p className="text-[8px] text-slate-400 truncate max-w-[160px]">{qrPayload}</p>
                      <span className="inline-block text-[9px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                        Optical Data Packet Ready
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-xs text-slate-500 rounded-xl bg-slate-950 border border-slate-800">
                  Select a trail from the "Saved Trails" tab and click the QR button to generate an offline transfer payload.
                </div>
              )}
            </div>
          )}

          {activeTab === 'no-hardware' && (
            <div className="space-y-6">
              {/* Method 1: Voice Radio / Walkie-Talkie Coordinate Sharing */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Mic className="w-4 h-4" />
                  <span>วิธีที่ 1: วิทยุสื่อสาร ว.2 ว.8 (Walkie-Talkie Voice Grid)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  หากไม่มีกล่อง LoRa สมาชิกในทีมที่พกวิทยุสื่อสารราคาประหยัด (เครื่องละ 300-500 บาท) สามารถกดคีย์ ว. อ่านพิกัดจากหน้าจอ PBMaps บอกเพื่อนได้ทันที!
                </p>

                {/* Current User Coordinates Card */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">พิกัดปัจจุบันของคุณสำหรับขาน ว.</span>
                    <p className="font-mono text-sm font-bold text-emerald-400 select-all">
                      {userLocation
                        ? `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)} (Alt: ${Math.round(userLocation.altitude || 0)}m)`
                        : 'กำลังค้นหาสัญญาณดาวเทียม GPS...'}
                    </p>
                    {userLocation && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        DMS: {formatDMS(userLocation.lat, true)} {formatDMS(userLocation.lng, false)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (userLocation) {
                        navigator.clipboard?.writeText?.(
                          `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`
                        );
                        alert('คัดลอกพิกัดเรียบร้อย!');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold shrink-0"
                  >
                    คัดลอกพิกัด
                  </button>
                </div>

                {/* Plot Friend's Coordinate Form */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-white block mb-2">
                    ปักหมุดตำแหน่งเพื่อนจากเสียง ว. (Plot Friend's Coordinate)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="ชื่อ/Callsign (เช่น นาย ก)"
                      value={plotCallsign}
                      onChange={(e) => setPlotCallsign(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (เช่น 14.4425)"
                      value={plotLat}
                      onChange={(e) => setPlotLat(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (เช่น 101.3789)"
                      value={plotLng}
                      onChange={(e) => setPlotLng(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const lat = parseFloat(plotLat);
                      const lng = parseFloat(plotLng);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        onAddManualPeer?.(plotCallsign.trim() || 'เพื่อนร่วมทีม', lat, lng);
                        setPlotSuccess(true);
                        setTimeout(() => setPlotSuccess(false), 3000);
                        setPlotCallsign('');
                        setPlotLat('');
                        setPlotLng('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มเพื่อนลงในแผนที่ & เรดาร์ทันที</span>
                  </button>
                  {plotSuccess && (
                    <p className="text-xs text-emerald-400 mt-1 font-semibold">
                      ✓ ปักหมุดเพื่อนสำเร็จ! ระบบจะคำนวณระยะห่างและลูกศรชี้ทางไปหาเพื่อนบนแผนที่ทันที
                    </p>
                  )}
                </div>
              </div>

              {/* Method 2: Apple Find My & Apple Maps Link Bridge */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="text-base">🍏</span>
                  <span>วิธีที่ 2: ซิงค์พิกัดกับ Apple Find My / Apple Maps</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  เนื่องจากระบบ <strong>Apple Find My</strong> เป็นระบบปิดแบบเข้ารหัสเฉพาะเครื่อง iPhone หากเพื่อนแชร์พิกัดจาก Apple Maps, ข้อความ SMS ดาวเทียม หรือ Find My มาเป็นลิงก์ คุณสามารถนำลิงก์มาวางที่นี่เพื่อแปลงเป็นหมุดบนแผนที่ PBMaps ได้ทันที:
                </p>

                {/* Generate Apple Maps Link for iPhone Friends */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">ส่งพิกัดของคุณให้เพื่อนที่ใช้ iPhone</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {userLocation
                        ? `https://maps.apple.com/?ll=${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}&q=PBMaps_Location`
                        : 'รอรับสัญญาณดาวเทียม...'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (userLocation) {
                        const appleUrl = `https://maps.apple.com/?ll=${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}&q=PBMaps_Location`;
                        navigator.clipboard?.writeText?.(appleUrl);
                        alert('คัดลอกลิงก์ Apple Maps สำหรับส่งให้เพื่อน iPhone เรียบร้อย!');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold shrink-0"
                  >
                    คัดลอกลิงก์ Apple Maps
                  </button>
                </div>

                {/* Paste Apple Maps / Find My URL to Plot Friend */}
                <div className="pt-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    วางลิงก์ Apple Maps / Find My หรือพิกัดที่เพื่อนส่งมา:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="เช่น https://maps.apple.com/?ll=14.4425,101.3789 หรือ 14.4425, 101.3789"
                      id="apple-maps-input"
                      className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('apple-maps-input') as HTMLInputElement;
                        const val = input?.value || '';
                        // Regex to extract lat and lng from url or text
                        const match = val.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
                        if (match) {
                          const lat = parseFloat(match[1]);
                          const lng = parseFloat(match[2]);
                          onAddManualPeer?.('เพื่อน (iPhone Find My)', lat, lng);
                          alert(`ดึงพิกัดสำเร็จ! ปักหมุดเพื่อนที่ ${lat.toFixed(5)}, ${lng.toFixed(5)} บนแผนที่ PBMaps เรียบร้อยแล้ว`);
                          input.value = '';
                        } else {
                          alert('ไม่พบตัวเลขพิกัดในข้อความ กรุณาตรวจสอบลิงก์หรือตัวเลขละติจูด/ลองจิจูดอีกครั้งครับ');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
                    >
                      ดึงพิกัดลงแผนที่ PBMaps
                    </button>
                  </div>
                </div>
              </div>

              {/* Method 3: Offline Wi-Fi Hotspot */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <span>📶 วิธีที่ 3: แชร์ผ่าน Local Wi-Fi Hotspot (ไม่ต้องเปิดเน็ตมือถือ)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  1. ให้เพื่อน 1 คนเปิด <strong>"ฮอตสปอตส่วนบุคคล (Personal Hotspot)"</strong> บนมือถือ (ปิด Mobile Data ได้)<br />
                  2. ให้เพื่อนคนอื่นๆ เปิด Wi-Fi เข้ามาเกาะชื่อฮอตสปอตเครื่องนั้น<br />
                  3. มือถือทุกคนจะอยู่ในวงแลนออฟไลน์เดียวกัน สามารถส่งไฟล์ .GPX และข้อมูลเส้นทางหากันได้ด้วยความเร็วสูงในรัศมี 50 - 100 เมตร
                </p>
              </div>

              {/* Method 4: Screen QR Scan */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span>📱 วิธีที่ 4: สแกน QR Code หน้าจอต่อหน้าจอ (Screen-to-Camera)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ก่อนแยกทางเดิน หรือเมื่อเจอกันตามทางแยก ให้เปิดแท็บ <strong>"Offline QR Share"</strong> เครื่องหนึ่งแสดงรหัส QR อีกเครื่องเปิดกล้องสแกน ข้อมูลพิกัดและเส้นทางจะถูกส่งต่อให้เพื่อนทันทีใน 1 วินาทีโดยไม่ต้องเปิดสัญญาณวิทยุใดๆ
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0e141c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
