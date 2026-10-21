export interface GeoPoint {
  lat: number;
  lng: number;
  altitude?: number; // in meters
  timestamp: number; // unix ms
  speed?: number; // m/s
  heading?: number; // degrees 0-360
  accuracy?: number; // meters
}

export type PeerStatus = 'active' | 'idle' | 'sos' | 'offline';

export interface MeshPeer {
  id: string;
  callsign: string;
  role: 'Leader' | 'Navigator' | 'Scout' | 'Medic' | 'Tail-End';
  lat: number;
  lng: number;
  altitude: number; // meters
  batteryPct: number; // 0 - 100
  lastSeen: number; // unix ms
  rssi: number; // dBm e.g. -78
  snr: number; // dB e.g. 9.5
  status: PeerStatus;
  channel: string;
  avatarColor: string;
  heading?: number;
  speedKmh?: number;
}

export type WaypointCategory = 'camp' | 'water' | 'summit' | 'hazard' | 'trailhead' | 'poi';

export interface Waypoint {
  id: string;
  name: string;
  category: WaypointCategory;
  lat: number;
  lng: number;
  altitude?: number;
  note?: string;
  timestamp: number;
}

export interface TrackRecord {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  points: GeoPoint[];
  waypoints: Waypoint[];
  totalDistanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  maxElevationMeters: number;
  minElevationMeters: number;
  durationSeconds: number;
  isCompleted?: boolean;
}

export type HardwareMode = 'simulated-mesh' | 'lora-ble' | 'lora-serial' | 'disconnected';

export interface HardwareState {
  mode: HardwareMode;
  isConnected: boolean;
  deviceName: string;
  frequencyMhz: number;
  txPowerDbm: number;
  hopsRemaining: number;
  packetsReceived: number;
  packetsSent: number;
  supportedInBrowser: {
    bluetooth: boolean;
    serial: boolean;
  };
}

export interface SosAlert {
  id: string;
  peerId: string;
  peerName: string;
  lat: number;
  lng: number;
  altitude: number;
  message: string;
  timestamp: number;
  batteryPct: number;
  acknowledged: boolean;
}

export type MapLayerType = 'topo' | 'osm' | 'satellite' | 'tactical-dark';
