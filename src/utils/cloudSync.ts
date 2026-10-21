import { GeoPoint, MeshPeer, SosAlert } from '../types';

export interface CloudRoomState {
  roomId: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  serverConnected: boolean;
  activeCloudPeersCount: number;
}

class CloudSyncService {
  private roomId: string = 'KHAOYAI-EXPEDITION';
  private broadcastChannel: BroadcastChannel | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('pbmaps_mesh_channel');
      } catch (err) {
        // BroadcastChannel fallback
      }

      window.addEventListener('online', () => {
        this.isOnline = true;
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Check URL query param for room e.g. ?room=SUMMIT-1
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        this.roomId = urlRoom.toUpperCase().trim();
      }
    }
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public setRoomId(newRoomId: string): void {
    this.roomId = newRoomId.toUpperCase().trim() || 'KHAOYAI-EXPEDITION';
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', this.roomId);
      window.history.replaceState({}, '', url.toString());
    }
  }

  public checkOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : this.isOnline;
  }

  /**
   * Broadcast current user position to the Cloud Room via HTTP /api/rooms/:roomId/update
   */
  public async syncLocation(
    userLocation: GeoPoint,
    callsign: string,
    role: string,
    batteryPct: number,
    sosAlert?: SosAlert | null
  ): Promise<{ success: boolean; cloudPeers: MeshPeer[]; cloudSos: SosAlert[] }> {
    // 1. Broadcast via local BroadcastChannel for zero-latency local tab sync
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'PEER_UPDATE',
        peer: {
          id: `user-${callsign.toLowerCase().replace(/\s+/g, '-')}`,
          callsign,
          role,
          lat: userLocation.lat,
          lng: userLocation.lng,
          altitude: userLocation.altitude || 780,
          batteryPct,
          lastSeen: Date.now(),
          rssi: -50,
          snr: 12.0,
          status: sosAlert ? 'sos' : 'active',
          channel: 'Internet Cloud (4G/5G)',
          avatarColor: '#10B981',
        },
        sos: sosAlert,
      });
    }

    // 2. If online, sync to server
    if (!this.checkOnline()) {
      return { success: false, cloudPeers: [], cloudSos: [] };
    }

    try {
      const peerPayload = {
        id: `user-${callsign.toLowerCase().replace(/\s+/g, '-')}`,
        callsign,
        role,
        lat: userLocation.lat,
        lng: userLocation.lng,
        altitude: userLocation.altitude || 780,
        batteryPct,
        lastSeen: Date.now(),
        rssi: -62,
        snr: 10.5,
        status: sosAlert ? 'sos' : 'active',
        channel: `Cloud Room #${this.roomId}`,
        avatarColor: '#10B981',
      };

      // POST update
      await fetch(`/api/rooms/${this.roomId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peer: peerPayload,
          sos: sosAlert,
        }),
      });

      // GET peers
      const res = await fetch(`/api/rooms/${this.roomId}/peers`);
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          cloudPeers: data.peers || [],
          cloudSos: data.sos || [],
        };
      }
    } catch (err) {
      // Offline or network error
    }

    return { success: false, cloudPeers: [], cloudSos: [] };
  }

  /**
   * Listen to local broadcast messages
   */
  public onLocalBroadcast(callback: (msg: any) => void): () => void {
    if (!this.broadcastChannel) return () => {};
    const handler = (e: MessageEvent) => callback(e.data);
    this.broadcastChannel.addEventListener('message', handler);
    return () => this.broadcastChannel?.removeEventListener('message', handler);
  }
}

export const cloudSync = new CloudSyncService();
