import { MeshPeer, HardwareState, SosAlert, Waypoint, TrackRecord } from '../types';

/**
 * Checks if Web Bluetooth and Web Serial are supported in this browser
 */
export function checkHardwareSupport(): { bluetooth: boolean; serial: boolean } {
  const isBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  const isSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  return {
    bluetooth: !!isBluetooth,
    serial: !!isSerial,
  };
}

/**
 * Preset wilderness expeditions with realistic teammate nodes
 */
export const FIELD_EXPEDITIONS = [
  {
    name: 'Khao Yai High Ridge (เขาใหญ่)',
    center: { lat: 14.4392, lng: 101.3724, alt: 780 },
    peers: [
      {
        id: 'peer-scout-1',
        callsign: 'KhaoYai-Scout',
        role: 'Scout' as const,
        lat: 14.4425,
        lng: 101.3789,
        altitude: 812,
        batteryPct: 88,
        lastSeen: Date.now() - 4000,
        rssi: -79,
        snr: 9.2,
        status: 'active' as const,
        channel: 'LoRa Ch 01 (915.0 MHz)',
        avatarColor: '#10B981',
        heading: 42,
        speedKmh: 3.4,
      },
      {
        id: 'peer-medic-1',
        callsign: 'Ranger-Anan',
        role: 'Medic' as const,
        lat: 14.4361,
        lng: 101.3672,
        altitude: 745,
        batteryPct: 64,
        lastSeen: Date.now() - 12000,
        rssi: -94,
        snr: 6.1,
        status: 'active' as const,
        channel: 'LoRa Ch 01 (915.0 MHz)',
        avatarColor: '#3B82F6',
        heading: 180,
        speedKmh: 2.1,
      },
      {
        id: 'peer-tail-1',
        callsign: 'Noi-TailEnd',
        role: 'Tail-End' as const,
        lat: 14.4310,
        lng: 101.3615,
        altitude: 710,
        batteryPct: 41,
        lastSeen: Date.now() - 28000,
        rssi: -108,
        snr: 2.4,
        status: 'idle' as const,
        channel: 'LoRa Ch 01 (915.0 MHz)',
        avatarColor: '#F59E0B',
        heading: 65,
        speedKmh: 1.8,
      },
      {
        id: 'peer-hq-1',
        callsign: 'Camp-KhaoKhiao-HQ',
        role: 'Leader' as const,
        lat: 14.4485,
        lng: 101.3850,
        altitude: 890,
        batteryPct: 98,
        lastSeen: Date.now() - 2000,
        rssi: -71,
        snr: 11.8,
        status: 'active' as const,
        channel: 'LoRa Ch 01 (915.0 MHz)',
        avatarColor: '#8B5CF6',
        heading: 0,
        speedKmh: 0,
      },
    ],
  },
  {
    name: 'Doi Inthanon Summit Trail (ดอยอินทนนท์)',
    center: { lat: 18.5888, lng: 98.4870, alt: 2200 },
    peers: [
      {
        id: 'doi-leader',
        callsign: 'Peak-Guide-Somchai',
        role: 'Leader' as const,
        lat: 18.5912,
        lng: 98.4895,
        altitude: 2310,
        batteryPct: 92,
        lastSeen: Date.now() - 3000,
        rssi: -74,
        snr: 10.5,
        status: 'active' as const,
        channel: 'LoRa Ch 02 (433.175 MHz)',
        avatarColor: '#10B981',
        heading: 35,
        speedKmh: 3.8,
      },
      {
        id: 'doi-scout',
        callsign: 'KewMaePan-Scout',
        role: 'Scout' as const,
        lat: 18.5835,
        lng: 98.4820,
        altitude: 2150,
        batteryPct: 75,
        lastSeen: Date.now() - 15000,
        rssi: -98,
        snr: 4.8,
        status: 'active' as const,
        channel: 'LoRa Ch 02 (433.175 MHz)',
        avatarColor: '#06B6D4',
        heading: 210,
        speedKmh: 2.9,
      },
    ],
  },
];

/**
 * Updates simulated peer coordinates with small realistic drift along trails
 */
export function simulatePeerMovement(peers: MeshPeer[]): MeshPeer[] {
  return peers.map((peer) => {
    // If SOS or offline, don't move randomly
    if (peer.status === 'sos' || peer.status === 'offline') {
      return {
        ...peer,
        lastSeen: Date.now(),
      };
    }

    // Small walking step ~0.00008 degrees (~8 meters)
    const angle = ((peer.heading || 0) + (Math.random() * 20 - 10)) * (Math.PI / 180);
    const speed = (peer.speedKmh || 3) / 3600; // km/s
    const stepDeg = 0.00003 + Math.random() * 0.00004;

    const newLat = peer.lat + Math.cos(angle) * stepDeg;
    const newLng = peer.lng + Math.sin(angle) * stepDeg;
    const altDrift = Math.round(Math.random() * 4 - 2);

    // Dynamic RSSI variation with terrain
    const rssiDrift = Math.round(Math.random() * 6 - 3);
    const newRssi = Math.min(-65, Math.max(-118, peer.rssi + rssiDrift));

    return {
      ...peer,
      lat: newLat,
      lng: newLng,
      altitude: Math.max(10, peer.altitude + altDrift),
      rssi: newRssi,
      lastSeen: Date.now(),
      heading: (peer.heading || 0 + Math.round(Math.random() * 10 - 5) + 360) % 360,
    };
  });
}

/**
 * Encodes waypoint or emergency beacon into compact QR format for offline camera transfer
 */
export function encodeOfflineQR(type: 'WAYPOINT' | 'SOS' | 'TRACK_HEADER', data: any): string {
  try {
    const payload = {
      t: type,
      d: data,
      ts: Date.now(),
    };
    return 'WMESH:' + btoa(encodeURIComponent(JSON.stringify(payload)));
  } catch (e) {
    return 'WMESH:ERROR';
  }
}

/**
 * Decodes offline QR string back into payload
 */
export function decodeOfflineQR(raw: string): { type: string; data: any; timestamp: number } | null {
  if (!raw.startsWith('WMESH:')) return null;
  try {
    const base64 = raw.substring(6);
    const jsonStr = decodeURIComponent(atob(base64));
    const parsed = JSON.parse(jsonStr);
    return {
      type: parsed.t,
      data: parsed.d,
      timestamp: parsed.ts,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Connects to Web Bluetooth GATT UART / Meshtastic service
 */
export async function connectWebBluetooth(
  onLog: (msg: string) => void
): Promise<{ deviceName: string; disconnect: () => void }> {
  const nav = navigator as any;
  if (typeof navigator === 'undefined' || !nav.bluetooth) {
    throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome/Edge on Android or desktop.');
  }

  onLog('Scanning for nearby LoRa / Meshtastic Bluetooth devices...');

  // Nordic UART Service UUID or Meshtastic service UUID
  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      '6ba1b218-15a8-461f-9fa8-5dcae273eafd', // Meshtastic Service
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    ],
  });

  onLog(`Found device: ${device.name || 'Unnamed LoRa Node'}. Connecting GATT server...`);
  const server = await device.gatt?.connect();
  onLog('LoRa Bluetooth GATT connected successfully!');

  return {
    deviceName: device.name || 'LoRa BLE Node',
    disconnect: () => {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    },
  };
}

/**
 * Connects to Web Serial for USB-connected LoRa ESP32 devices
 */
export async function connectWebSerial(
  onLog: (msg: string) => void
): Promise<{ deviceName: string; disconnect: () => void }> {
  const nav = navigator as any;
  if (typeof navigator === 'undefined' || !nav.serial) {
    throw new Error('Web Serial is not supported in this browser. Please use Chrome/Edge on desktop.');
  }

  onLog('Requesting USB Serial port (LilyGO T-Beam / Heltec LoRa32)...');
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: 115200 });
  onLog('USB Serial port opened at 115200 baud! Receiving LoRa packets...');

  return {
    deviceName: 'LoRa USB Transceiver (115200 baud)',
    disconnect: async () => {
      try {
        await port.close();
      } catch (err) {
        // ignore
      }
    },
  };
}
