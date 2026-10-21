import React, { useState } from 'react';
import {
  Check,
  Cpu,
  HelpCircle,
  Radio,
  RefreshCw,
  Sliders,
  Terminal,
  Usb,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { HardwareMode, HardwareState } from '../types';
import { FIELD_EXPEDITIONS } from '../utils/meshProtocol';

interface MeshHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardwareState: HardwareState;
  onConnectBluetooth: () => Promise<void>;
  onConnectSerial: () => Promise<void>;
  onSelectSimulatedExpedition: (index: number) => void;
  onDisconnect: () => void;
  radioLogs: string[];
}

export const MeshHardwareModal: React.FC<MeshHardwareModalProps> = ({
  isOpen,
  onClose,
  hardwareState,
  onConnectBluetooth,
  onConnectSerial,
  onSelectSimulatedExpedition,
  onDisconnect,
  radioLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'connect' | 'guide' | 'logs'>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleBluetooth = async () => {
    setIsConnecting(true);
    setStatusMessage('Scanning for nearby LoRa Bluetooth devices...');
    try {
      await onConnectBluetooth();
      setStatusMessage('Connected successfully!');
    } catch (err: any) {
      setStatusMessage(err.message || 'Bluetooth connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSerial = async () => {
    setIsConnecting(true);
    setStatusMessage('Requesting USB Serial port...');
    try {
      await onConnectSerial();
      setStatusMessage('Serial port connected at 115200 baud!');
    } catch (err: any) {
      setStatusMessage(err.message || 'Serial connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e141c]">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Offline LoRa & Bluetooth Mesh Radio
              </h2>
              <p className="text-xs text-slate-400">
                Wilderness peer-to-peer transmission without cellular or internet
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'connect'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Radio Hardware & Presets
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'guide'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Hardware Guide (LoRa vs BLE)
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'logs'
                ? 'text-amber-400 border-amber-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Live Radio Log ({radioLogs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'connect' && (
            <div className="space-y-6">
              {/* Current Connection Status Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Active Link:</span>
                    <span className="font-bold text-white text-sm">{hardwareState.deviceName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ONLINE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>Freq: {hardwareState.frequencyMhz} MHz</span>
                    <span>·</span>
                    <span>Power: +{hardwareState.txPowerDbm} dBm</span>
                    <span>·</span>
                    <span>Packets RX: {hardwareState.packetsReceived}</span>
                  </div>
                </div>

                {hardwareState.isConnected && (
                  <button
                    onClick={onDisconnect}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 transition"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {/* Physical Hardware Connection Options */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Connect Physical Transceiver / Satellite Uplink
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Bluetooth BLE option */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm mb-1">
                        <Radio className="w-4 h-4 text-cyan-400" />
                        <span>LoRa (BLE)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                        Connect to Meshtastic, LilyGO T-Beam, or Heltec nodes via Bluetooth. 100% Free peer mesh.
                      </p>
                    </div>
                    <button
                      onClick={handleBluetooth}
                      disabled={isConnecting}
                      className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Pair LoRa BLE</span>
                    </button>
                  </div>

                  {/* USB Serial option */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm mb-1">
                        <Usb className="w-4 h-4 text-amber-400" />
                        <span>LoRa USB (OTG)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                        Plug in a USB LoRa dongle or ESP32 transceiver directly at 115200 baud via Web Serial.
                      </p>
                    </div>
                    <button
                      onClick={handleSerial}
                      disabled={isConnecting}
                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Connect USB Port</span>
                    </button>
                  </div>

                  {/* Satellite Messenger option */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm mb-1">
                        <Wifi className="w-4 h-4 text-blue-400" />
                        <span>Satellite Uplink</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                        Pair with Garmin inReach / Iridium / ZOLEO satellite transceiver to forward SOS & team telemetry.
                      </p>
                    </div>
                    <button
                      onClick={handleBluetooth}
                      disabled={isConnecting}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Pair Satellite Unit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulated Expedition Meshes */}
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  2. Select Field Expedition Preset (Simulated Mesh)
                </h3>
                <div className="space-y-2">
                  {FIELD_EXPEDITIONS.map((exp, idx) => (
                    <div
                      key={exp.name}
                      onClick={() => onSelectSimulatedExpedition(idx)}
                      className="p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{exp.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {exp.peers.length} active teammate radios · Coords: {exp.center.lat.toFixed(4)},{' '}
                          {exp.center.lng.toFixed(4)}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-amber-400 border border-slate-700">
                        Load Team
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {statusMessage && (
                <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-amber-300">
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-amber-400">
                  ทำไมในป่าลึกไม่มีสัญญาณมือถือ ต้องใช้ LoRa หรือ Bluetooth Mesh?
                </h4>
                <p>
                  คลื่นโทรศัพท์ 4G/5G และอินเทอร์เน็ตพึ่งพาเสาสัญญาณภาคพื้นดิน ซึ่งในหุบเขาและป่าลึกทึบ คลื่นความถี่สูงจะถูกภูเขาและต้นไม้บดบังจนใช้งานไม่ได้ (Zero Cellular Coverage)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5 text-emerald-400">
                    <Radio className="w-4 h-4" /> LoRa (Long Range RF)
                  </h5>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    <li><strong>ระยะส่ง:</strong> 2 – 15+ กิโลเมตร ทะลุต้นไม้และหุบเขา</li>
                    <li><strong>ความถี่:</strong> 433 MHz, 868 MHz หรือ 915 MHz (ไม่ต้องมีเน็ต)</li>
                    <li><strong>แบตเตอรี่:</strong> กินไฟต่ำมาก 1 ก้อนอยู่ได้ 3 – 7 วัน</li>
                    <li><strong>อุปกรณ์แนะนำ:</strong> LilyGO T-Beam, Heltec LoRa32, Meshtastic node</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5 text-cyan-400">
                    <Wifi className="w-4 h-4" /> Bluetooth Mesh (BLE)
                  </h5>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                    <li><strong>ระยะส่ง:</strong> 30 – 100 เมตร (ระหว่างมือถือด้วยกัน)</li>
                    <li><strong>หลักการ:</strong> ส่งต่อข้อมูลแบบกระโดดข้ามเครื่อง (Multi-Hop Relay)</li>
                    <li><strong>ข้อดี:</strong> ใช้งานได้ทันทีด้วยมือถือทั่วไป</li>
                    <li><strong>เหมาะสำหรับ:</strong> การเดินป่าเป็นขบวนกลุ่มย่อยในระยะสายตา</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <p className="font-bold mb-1">💡 คำแนะนำสำหรับการเดินป่าจริง:</p>
                <p>
                  ให้พก LoRa Node เล็กๆ (เช่น Meshtastic ขนาดเท่าตลับไฟแช็ก) ห้อยไว้ที่เป้สะพายหลัง แล้วเปิดเว็บแอพนี้เชื่อมต่อผ่าน Bluetooth เข้ากับตัว Node มือถือจะส่งพิกัด GPS อัพเดทให้เพื่อนทั้งคณะแบบ Real-time อัตโนมัติแม้จะอยู่ห่างกันข้ามภูเขา!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">LoRa Sub-GHz Packet Monitor</span>
                <span>Auto-refreshing</span>
              </div>
              <div className="h-64 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400/90 overflow-y-auto space-y-1">
                {radioLogs.map((log, i) => (
                  <div key={i} className="leading-snug">
                    <span className="text-slate-500 select-none mr-2">[{i + 1}]</span>
                    {log}
                  </div>
                ))}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
