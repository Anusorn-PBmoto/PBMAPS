import React, { useState } from 'react';
import {
  Globe,
  Radio,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Users,
  Share2,
  X,
  Zap,
} from 'lucide-react';
import { cloudSync } from '../utils/cloudSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  currentRoomId: string;
  onUpdateRoomId: (newRoomId: string) => void;
  activeCloudPeersCount: number;
  lastCloudSync: number | null;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  currentRoomId,
  onUpdateRoomId,
  activeCloudPeersCount,
  lastCloudSync,
}) => {
  const [roomInput, setRoomInput] = useState(currentRoomId);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomInput.trim()) return;
    onUpdateRoomId(roomInput.trim());
  };

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(currentRoomId)}`
    : '';

  const handleCopyLink = () => {
    if (shareableUrl) {
      navigator.clipboard?.writeText?.(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e141c]">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Hybrid Cloud Sync & Expedition Room
              </h2>
              <p className="text-xs text-slate-400">
                แชร์ตำแหน่งผ่านอินเทอร์เน็ต (4G/5G) ควบคู่กับวิทยุ LoRa ออฟไลน์
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

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Active Network Status Card */}
          <div
            className={`p-4 rounded-xl border transition flex items-center justify-between ${
              isOnline
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    {isOnline ? 'Internet Cloud Sync: Active' : 'Offline Mode: LoRa Active'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {isOnline ? '4G/5G ONLINE' : 'SEAMLESS OFFLINE FALLBACK'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isOnline
                    ? `ซิงค์พิกัดกับห้อง #${currentRoomId} (พบเพื่อนออนไลน์ ${activeCloudPeersCount} คน)`
                    : 'ไร้สัญญาณเน็ต ระบบสลับไปใช้คลื่น LoRa / BLE Mesh อัตโนมัติ 100%'}
                </p>
              </div>
            </div>
          </div>

          {/* Expedition Room ID Form */}
          <form onSubmit={handleSaveRoom} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              รหัสห้องทริปเดินป่า (Expedition Room Code):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                placeholder="เช่น KHAO-YAI-2026, DOI-INTHANON"
                className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
              >
                เข้าร่วมห้อง
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              สมาชิกทุกคนในกลุ่มที่ตั้งชื่อห้องเดียวกัน จะเห็นพิกัดของกันและกันแบบ Real-time บนแผนที่ทันที
            </p>
          </form>

          {/* Shareable Tracking Link for Family & Friends at Home */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>ลิงก์แชร์พิกัดสำหรับเพื่อนหรือคนทางบ้าน (Live Tracker URL)</span>
              </span>
              {copiedLink && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> คัดลอกแล้ว!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-semibold shrink-0 transition flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>คัดลอกลิงก์</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              ครอบครัวหรือเจ้าหน้าที่ที่อยู่ในเมืองที่มีอินเทอร์เน็ต สามารถเปิดลิงก์นี้บนเว็บเบราว์เซอร์เพื่อเฝ้าดูความคืบหน้าของคณะเดินป่าแบบสดๆ ได้ทันที
            </p>
          </div>

          {/* How Hybrid Works */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <p className="font-bold text-amber-400">⚡ ระบบ Hybrid สลับเครือข่ายอัจฉริยะ (Dual-Bearer):</p>
            <p>
              • <strong>เมื่อมีสัญญาณ 4G/5G:</strong> ส่งพิกัดผ่านคลาวด์ความเร็วสูง ใช้แบตเตอรี่น้อย<br />
              • <strong>เมื่อสัญญาณเน็ตดับ:</strong> ระบบไม่หยุดทำงาน! แต่จะสลับไปยิงคลื่นวิทยุ <strong>LoRa 915MHz</strong> และบลูทูธแทนทันทีแบบไร้รอยต่อ
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0e141c] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
