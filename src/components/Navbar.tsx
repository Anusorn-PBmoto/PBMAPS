import { Radio, Wifi, WifiOff, Globe } from 'lucide-react';
import { HardwareState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: 'map' | 'tracker' | 'mesh' | 'guide';
  onSelectTab: (tab: 'map' | 'tracker' | 'mesh' | 'guide') => void;
  hardwareState: HardwareState;
  onOpenHardwareModal: () => void;
  peersCount: number;
  hasActiveSos: boolean;
  isOnline: boolean;
  currentRoomId: string;
  onOpenCloudModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hardwareState,
  onOpenHardwareModal,
  peersCount,
  hasActiveSos,
  isOnline,
  currentRoomId,
  onOpenCloudModal,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 border-b border-slate-800 bg-[#0e141c]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('map');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
        >
          PB<span className="text-amber-500">Maps</span>
        </a>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide uppercase text-slate-400">
        <button
          onClick={() => onSelectTab('map')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'map' ? 'text-amber-400 border-amber-500' : 'border-transparent'
          }`}
        >
          Map & Radar
        </button>
        <button
          onClick={() => onSelectTab('tracker')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'tracker' ? 'text-amber-400 border-amber-500' : 'border-transparent'
          }`}
        >
          Trail Tracker & GPX
        </button>
        <button
          onClick={() => onSelectTab('mesh')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'mesh' ? 'text-amber-400 border-amber-500' : 'border-transparent'
          }`}
        >
          LoRa Mesh Radio ({peersCount})
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            currentTab === 'guide' ? 'text-amber-400 border-amber-500' : 'border-transparent'
          }`}
        >
          Field Guide
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <PWAInstallButton />

        <button
          onClick={onOpenCloudModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition whitespace-nowrap shrink-0 ${
            isOnline
              ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}
          title="Expedition Cloud Room & Shareable Link"
        >
          <Globe className={`w-3.5 h-3.5 ${isOnline ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">#{currentRoomId}</span>
          <span className="sm:hidden">Cloud</span>
        </button>

        <button
          onClick={onOpenHardwareModal}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            hasActiveSos
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
              : hardwareState.isConnected
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-900/60'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${hardwareState.isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">
            {hardwareState.isConnected
              ? `${hardwareState.deviceName.split(' ')[0]} (${hardwareState.frequencyMhz}MHz)`
              : 'Connect Mesh'}
          </span>
          <span className="sm:hidden">
            {hardwareState.isConnected ? `${hardwareState.frequencyMhz}M` : 'Mesh'}
          </span>
        </button>
      </div>
    </header>
  );
};
