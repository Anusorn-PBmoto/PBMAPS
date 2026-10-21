/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Download,
  FileCode,
  Layers,
  MapPin,
  Menu,
  Navigation,
  Radio,
  Share2,
  Users,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';

import {
  GeoPoint,
  HardwareState,
  MeshPeer,
  SosAlert,
  TrackRecord,
  Waypoint,
  WaypointCategory,
} from './types';
import {
  calculateBearing,
  calculateCrossTrackDeviation,
  calculateHaversineDistance,
  computeTrackMetrics,
  formatDistance,
} from './utils/geo';
import {
  checkHardwareSupport,
  connectWebBluetooth,
  connectWebSerial,
  FIELD_EXPEDITIONS,
  simulatePeerMovement,
} from './utils/meshProtocol';
import {
  getAllTracksFromDB,
  getAllWaypointsFromDB,
  saveTrackToDB,
  saveWaypointToDB,
  deleteTrackFromDB,
  savePeersToDB,
  getPeersFromDB,
} from './utils/offlineStorage';
import { downloadGPXFile } from './utils/gpx';
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
  startSilentAudioKeepalive,
  stopSilentAudioKeepalive,
} from './utils/backgroundTracker';

import { Navbar } from './components/Navbar';
import { TacticalMap } from './components/TacticalMap';
import { TeammateRadar } from './components/TeammateRadar';
import { TrailRecorder } from './components/TrailRecorder';
import { MeshHardwareModal } from './components/MeshHardwareModal';
import { GPXManagerModal } from './components/GPXManagerModal';
import { FieldGuide } from './components/FieldGuide';
import { CloudSyncModal } from './components/CloudSyncModal';
import { PocketModeModal } from './components/PocketModeModal';
import { cloudSync } from './utils/cloudSync';

export default function App() {
  // Navigation View State
  const [currentTab, setCurrentTab] = useState<'map' | 'tracker' | 'mesh' | 'guide'>('map');
  const [mobileSubTab, setMobileSubTab] = useState<'map' | 'radar'>('map');

  // Background GPS & Pocket Mode State
  const [isPocketModeOpen, setIsPocketModeOpen] = useState(false);
  const [isWakeLocked, setIsWakeLocked] = useState(false);

  // Cloud Sync & Hybrid Internet State
  const [currentRoomId, setCurrentRoomId] = useState<string>(cloudSync.getRoomId());
  const [isOnline, setIsOnline] = useState<boolean>(cloudSync.checkOnline());
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<number | null>(null);
  const [activeCloudPeersCount, setActiveCloudPeersCount] = useState<number>(0);

  // Geolocation & Heading State
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [compassHeading, setCompassHeading] = useState<number>(38);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Mesh Peers & Hardware Link State
  const [peers, setPeers] = useState<MeshPeer[]>(FIELD_EXPEDITIONS[0].peers);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [hardwareState, setHardwareState] = useState<HardwareState>({
    mode: 'simulated-mesh',
    isConnected: true,
    deviceName: 'LoRa Mesh (Khao Yai 915MHz)',
    frequencyMhz: 915.0,
    txPowerDbm: 22,
    hopsRemaining: 3,
    packetsReceived: 42,
    packetsSent: 18,
    supportedInBrowser: checkHardwareSupport(),
  });
  const [radioLogs, setRadioLogs] = useState<string[]>([
    'Node booted: SX1262 LoRa module initialized at 915.000 MHz SF11 BW125 CR4/8',
    'Mesh channel JOINED: "Wilderness-Team-01" (AES-128 GCM PSK active)',
    'Beacon RX from KhaoYai-Scout: RSSI -79dBm, SNR 9.2dB (Direct hop)',
    'Telemetry RX from Camp-KhaoKhiao-HQ: Alt 890m, Batt 98% (Hop 1 of 3)',
  ]);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isGPXModalOpen, setIsGPXModalOpen] = useState(false);

  // Active Trail Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTrackPoints, setActiveTrackPoints] = useState<GeoPoint[]>([]);
  const [activeTrackWaypoints, setActiveTrackWaypoints] = useState<Waypoint[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isBacktracking, setIsBacktracking] = useState(false);

  // Saved Tracks & Waypoints (IndexedDB)
  const [savedTracks, setSavedTracks] = useState<TrackRecord[]>([]);
  const [allWaypoints, setAllWaypoints] = useState<Waypoint[]>([]);
  const [importedTrackForMap, setImportedTrackForMap] = useState<TrackRecord | null>(null);

  // Emergency SOS State
  const [activeSosAlerts, setActiveSosAlerts] = useState<SosAlert[]>([]);
  const [isUserInSos, setIsUserInSos] = useState(false);

  // Hardware disconnection cleanup ref
  const disconnectHardwareRef = useRef<(() => void) | null>(null);

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    getAllTracksFromDB().then((tracks) => {
      setSavedTracks(tracks);
    });

    getAllWaypointsFromDB().then((wpts) => {
      if (wpts.length === 0) {
        // Seed default waypoints for the default expedition
        const defaultWpts: Waypoint[] = [
          {
            id: 'wpt-seed-1',
            name: 'Freshwater Spring 1',
            category: 'water',
            lat: 14.4412,
            lng: 101.3745,
            altitude: 795,
            note: 'Potable water source flowing from limestone rocks',
            timestamp: Date.now() - 3600000,
          },
          {
            id: 'wpt-seed-2',
            name: 'Khao Khiao Ranger Camp',
            category: 'camp',
            lat: 14.4485,
            lng: 101.385,
            altitude: 890,
            note: 'Designated tent area with shelter and radio repeater',
            timestamp: Date.now() - 7200000,
          },
        ];
        defaultWpts.forEach((w) => saveWaypointToDB(w));
        setAllWaypoints(defaultWpts);
      } else {
        setAllWaypoints(wpts);
      }
    });

    getPeersFromDB().then((savedPeers) => {
      if (savedPeers && savedPeers.length > 0) {
        setPeers(savedPeers);
      } else {
        savePeersToDB(FIELD_EXPEDITIONS[0].peers);
      }
    });
  }, []);

  // 2. High-Accuracy Geolocation Watcher
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by this browser');
      // Set default position near team center
      setUserLocation({
        lat: FIELD_EXPEDITIONS[0].center.lat,
        lng: FIELD_EXPEDITIONS[0].center.lng,
        altitude: FIELD_EXPEDITIONS[0].center.alt,
        timestamp: Date.now(),
        accuracy: 10,
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude, heading, speed, accuracy } = position.coords;
        const newPoint: GeoPoint = {
          lat: latitude,
          lng: longitude,
          altitude: altitude ?? 760,
          heading: heading ?? undefined,
          speed: speed ?? undefined,
          accuracy: accuracy ?? 8,
          timestamp: position.timestamp,
        };

        setUserLocation(newPoint);
        setGpsError(null);

        // If recording and not paused, append point
        if (isRecording && !isPaused) {
          setActiveTrackPoints((prev) => [...prev, newPoint]);
        }
      },
      (error) => {
        // Graceful fallback to expedition default center so user can test offline features
        console.warn('Geolocation warning/denied, using field expedition reference coords:', error.message);
        setGpsError(error.message);
        if (!userLocation) {
          setUserLocation({
            lat: FIELD_EXPEDITIONS[0].center.lat,
            lng: FIELD_EXPEDITIONS[0].center.lng,
            altitude: FIELD_EXPEDITIONS[0].center.alt,
            timestamp: Date.now(),
            accuracy: 12,
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isRecording, isPaused]);

  // 3. Device Orientation Compass HUD
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const iosEvent = e as unknown as { webkitCompassHeading?: number };
      if (iosEvent.webkitCompassHeading !== undefined) {
        // iOS Safari
        setCompassHeading(iosEvent.webkitCompassHeading);
      } else if (e.alpha !== null) {
        // Android Chromium
        setCompassHeading(360 - e.alpha);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // 4. Timer for Active Track Elapsed Seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  // 5. LoRa Mesh Peer Drift & Telemetry Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (hardwareState.isConnected) {
        setPeers((prev) => simulatePeerMovement(prev));

        // Periodic simulated radio packet log
        const randomPeer = peers[Math.floor(Math.random() * peers.length)];
        if (randomPeer) {
          setHardwareState((prev) => ({
            ...prev,
            packetsReceived: prev.packetsReceived + 1,
          }));

          const logEntry = `LoRa RX: [${randomPeer.callsign}] Dist ${Math.round(
            calculateHaversineDistance(
              userLocation?.lat ?? randomPeer.lat,
              userLocation?.lng ?? randomPeer.lng,
              randomPeer.lat,
              randomPeer.lng
            )
          )}m | RSSI ${randomPeer.rssi}dBm | SNR ${randomPeer.snr}dB`;

          setRadioLogs((prev) => [logEntry, ...prev.slice(0, 39)]);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [hardwareState.isConnected, peers, userLocation]);

  // 6. Online / Offline Network Listener & Cloud Sync Loop
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to local BroadcastChannel for tab-to-tab real-time sync
    const unbindBroadcast = cloudSync.onLocalBroadcast((msg) => {
      if (msg.type === 'PEER_UPDATE' && msg.peer) {
        setPeers((prev) => {
          const filtered = prev.filter((p) => p.id !== msg.peer.id);
          return [msg.peer, ...filtered];
        });
      }
      if (msg.sos) {
        setActiveSosAlerts((prev) => {
          if (!prev.some((s) => s.id === msg.sos.id)) {
            return [msg.sos, ...prev];
          }
          return prev;
        });
      }
    });

    // Cloud sync interval (every 8 seconds when user location is available)
    const syncInterval = setInterval(async () => {
      if (userLocation) {
        const activeSos = activeSosAlerts.find((s) => s.peerId === 'my-device') || null;
        const res = await cloudSync.syncLocation(
          userLocation,
          'Me (Lead Walker)',
          'Leader',
          88,
          activeSos
        );

        if (res.success) {
          setLastCloudSync(Date.now());
          setActiveCloudPeersCount(res.cloudPeers.length);

          if (res.cloudPeers.length > 0) {
            // Merge cloud peers with existing peers
            setPeers((prev) => {
              const cloudIds = new Set(res.cloudPeers.map((p) => p.id));
              const nonCloudPeers = prev.filter((p) => !cloudIds.has(p.id));
              return [...res.cloudPeers, ...nonCloudPeers];
            });
          }

          if (res.cloudSos && res.cloudSos.length > 0) {
            setActiveSosAlerts((prev) => {
              const existingIds = new Set(prev.map((s) => s.id));
              const newSos = res.cloudSos.filter((s: any) => !existingIds.has(s.id));
              return [...prev, ...newSos];
            });
          }
        }
      }
    }, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unbindBroadcast();
      clearInterval(syncInterval);
    };
  }, [userLocation, activeSosAlerts, currentRoomId]);

  // Track Recording Controls & Background WakeLock
  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setActiveTrackWaypoints([]);
    if (userLocation) {
      setActiveTrackPoints([userLocation]);
    } else {
      setActiveTrackPoints([]);
    }

    // Keep screen and GPS active in background
    requestScreenWakeLock(setIsWakeLocked);
    startSilentAudioKeepalive();
  };

  const handlePauseRecording = () => setIsPaused(true);
  const handleResumeRecording = () => setIsPaused(false);

  const handleStopAndSaveRecording = async (trackName: string) => {
    setIsRecording(false);
    setIsPaused(false);

    if (!isPocketModeOpen) {
      releaseScreenWakeLock();
      stopSilentAudioKeepalive();
    }

    const metrics = computeTrackMetrics(activeTrackPoints);
    const newTrack: TrackRecord = {
      id: `track-${Date.now()}`,
      name: trackName,
      startTime: activeTrackPoints[0]?.timestamp || Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      points: activeTrackPoints,
      waypoints: activeTrackWaypoints,
      totalDistanceMeters: metrics.totalDistanceMeters,
      elevationGainMeters: metrics.elevationGainMeters,
      elevationLossMeters: metrics.elevationLossMeters,
      maxElevationMeters: metrics.maxElevationMeters,
      minElevationMeters: metrics.minElevationMeters,
      durationSeconds: elapsedSeconds,
      isCompleted: true,
    };

    // Save to IndexedDB
    await saveTrackToDB(newTrack);
    const updated = await getAllTracksFromDB();
    setSavedTracks(updated);

    // Auto trigger GPX file download for user
    downloadGPXFile(newTrack);

    // Reset current active session
    setActiveTrackPoints([]);
    setElapsedSeconds(0);
  };

  // Teammate Peer Add / Remove Handlers
  const handleAddPeer = async (newPeer: MeshPeer) => {
    const updated = [newPeer, ...peers];
    setPeers(updated);
    await savePeersToDB(updated);
    setRadioLogs((prev) => [
      `Teammate added to group: [${newPeer.callsign}] (${newPeer.role}) on ${newPeer.channel}`,
      ...prev,
    ]);
  };

  const handleRemovePeer = async (peerId: string) => {
    const targetPeer = peers.find((p) => p.id === peerId);
    const updated = peers.filter((p) => p.id !== peerId);
    setPeers(updated);
    if (selectedPeerId === peerId) setSelectedPeerId(null);
    await savePeersToDB(updated);
    setRadioLogs((prev) => [
      `Teammate removed from group: [${targetPeer?.callsign || peerId}]`,
      ...prev,
    ]);
  };

  // Pocket Mode & Screen-Off Execution
  const handleOpenPocketMode = async () => {
    setIsPocketModeOpen(true);
    await requestScreenWakeLock(setIsWakeLocked);
    startSilentAudioKeepalive();
  };

  const handleExitPocketMode = () => {
    setIsPocketModeOpen(false);
    if (!isRecording) {
      releaseScreenWakeLock();
      stopSilentAudioKeepalive();
    }
  };

  // Drop Waypoint Handler
  const handleDropWaypoint = async (
    categoryOrLat: WaypointCategory | number,
    nameOrLng?: string | number,
    note?: string
  ) => {
    let lat: number;
    let lng: number;
    let category: WaypointCategory = 'poi';
    let name = 'Waypoint';
    let noteText = '';

    if (typeof categoryOrLat === 'number' && typeof nameOrLng === 'number') {
      lat = categoryOrLat;
      lng = nameOrLng;
      name = `Waypoint ${allWaypoints.length + 1}`;
    } else {
      category = categoryOrLat as WaypointCategory;
      name = (nameOrLng as string) || 'Waypoint';
      noteText = note || '';
      lat = userLocation?.lat ?? FIELD_EXPEDITIONS[0].center.lat;
      lng = userLocation?.lng ?? FIELD_EXPEDITIONS[0].center.lng;
    }

    const newWpt: Waypoint = {
      id: `wpt-${Date.now()}`,
      name,
      category,
      lat,
      lng,
      altitude: userLocation?.altitude ?? 780,
      note: noteText,
      timestamp: Date.now(),
    };

    await saveWaypointToDB(newWpt);
    const list = await getAllWaypointsFromDB();
    setAllWaypoints(list);

    if (isRecording) {
      setActiveTrackWaypoints((prev) => [...prev, newWpt]);
    }
  };

  // SOS Distress Beacon Trigger
  const handleTriggerSos = () => {
    if (isUserInSos) {
      // Cancel user SOS
      setIsUserInSos(false);
      setActiveSosAlerts((prev) => prev.filter((a) => a.peerId !== 'my-device'));
    } else {
      // Activate user SOS
      setIsUserInSos(true);
      const alert: SosAlert = {
        id: `sos-${Date.now()}`,
        peerId: 'my-device',
        peerName: 'YOU (Distress Beacon)',
        lat: userLocation?.lat ?? 14.4392,
        lng: userLocation?.lng ?? 101.3724,
        altitude: userLocation?.altitude ?? 780,
        message: 'EMERGENCY: SOS Beacon triggered. Immediate assistance requested.',
        timestamp: Date.now(),
        batteryPct: 82,
        acknowledged: false,
      };
      setActiveSosAlerts((prev) => [alert, ...prev]);

      // Add to radio logs
      setRadioLogs((prev) => [
        '🚨 TX EMERGENCY SOS BEACON: 915.000 MHz SF12 BW125 CR4/8 (Max Power 22dBm)',
        ...prev,
      ]);
    }
  };

  const handleResolveSos = (alertId: string) => {
    setActiveSosAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Hardware connections
  const handleConnectBluetooth = async () => {
    const result = await connectWebBluetooth((msg) => {
      setRadioLogs((prev) => [msg, ...prev]);
    });
    disconnectHardwareRef.current = result.disconnect;
    setHardwareState((prev) => ({
      ...prev,
      mode: 'lora-ble',
      isConnected: true,
      deviceName: result.deviceName,
    }));
  };

  const handleConnectSerial = async () => {
    const result = await connectWebSerial((msg) => {
      setRadioLogs((prev) => [msg, ...prev]);
    });
    disconnectHardwareRef.current = result.disconnect;
    setHardwareState((prev) => ({
      ...prev,
      mode: 'lora-serial',
      isConnected: true,
      deviceName: result.deviceName,
    }));
  };

  const handleSelectSimulatedExpedition = (index: number) => {
    const exp = FIELD_EXPEDITIONS[index];
    if (!exp) return;
    setPeers(exp.peers);
    setUserLocation({
      lat: exp.center.lat,
      lng: exp.center.lng,
      altitude: exp.center.alt,
      timestamp: Date.now(),
      accuracy: 8,
    });
    setHardwareState((prev) => ({
      ...prev,
      mode: 'simulated-mesh',
      isConnected: true,
      deviceName: `LoRa Mesh (${exp.name.split(' ')[0]})`,
      frequencyMhz: exp.name.includes('Doi') ? 433.175 : 915.0,
    }));
    setRadioLogs((prev) => [
      `Expedition loaded: "${exp.name}" with ${exp.peers.length} active teammate transceivers`,
      ...prev,
    ]);
  };

  const handleDisconnectHardware = () => {
    if (disconnectHardwareRef.current) {
      disconnectHardwareRef.current();
      disconnectHardwareRef.current = null;
    }
    setHardwareState((prev) => ({
      ...prev,
      isConnected: false,
      deviceName: 'Disconnected',
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f14] text-slate-100 selection:bg-amber-500/20">
      {/* 1-Row 3-Zone Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hardwareState={hardwareState}
        onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
        peersCount={peers.length}
        hasActiveSos={activeSosAlerts.length > 0}
        isOnline={isOnline}
        currentRoomId={currentRoomId}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col">
        {/* Tab View: Live Map & Radar */}
        {currentTab === 'map' && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Split Grid: Left Map (Dominant Viewport), Right Teammate Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
              {/* Map Canvas Zone (7 cols on lg) */}
              <div
                className={`lg:col-span-8 flex flex-col min-h-[480px] lg:min-h-[640px] ${
                  mobileSubTab === 'radar' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                <TacticalMap
                  userLocation={userLocation}
                  compassHeading={compassHeading}
                  peers={peers}
                  activeTrackPoints={activeTrackPoints}
                  importedTrackPoints={importedTrackForMap?.points}
                  waypoints={allWaypoints}
                  selectedPeerId={selectedPeerId}
                  onSelectPeer={setSelectedPeerId}
                  onDropWaypoint={(lat, lng) => handleDropWaypoint(lat, lng)}
                  isRecording={isRecording}
                  isBacktracking={isBacktracking}
                />
              </div>

              {/* Teammate Radar & Quick Stats Panel (4 cols on lg) */}
              <div
                className={`lg:col-span-4 flex flex-col gap-4 overflow-y-auto ${
                  mobileSubTab === 'map' ? 'hidden lg:flex' : 'flex'
                }`}
              >
                {/* Tactical Header Card */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Mesh Teammates ({peers.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      P2P LoRa Link · {hardwareState.frequencyMhz} MHz
                    </p>
                  </div>

                  <button
                    onClick={() => setIsGPXModalOpen(true)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    title="GPX Trail Management & Sharing"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>GPX</span>
                  </button>
                </div>

                {/* Radar Peers List */}
                <TeammateRadar
                  userLocation={userLocation}
                  compassHeading={compassHeading}
                  peers={peers}
                  selectedPeerId={selectedPeerId}
                  onSelectPeer={setSelectedPeerId}
                  activeSosAlerts={activeSosAlerts}
                  onTriggerSos={handleTriggerSos}
                  onResolveSos={handleResolveSos}
                  isUserInSos={isUserInSos}
                  onAddPeer={handleAddPeer}
                  onRemovePeer={handleRemovePeer}
                  onOpenPocketMode={handleOpenPocketMode}
                />
              </div>
            </div>

            {/* Mobile Bottom View Switcher (Visible on mobile only) */}
            <div className="lg:hidden flex items-center justify-center p-1 rounded-xl bg-slate-900 border border-slate-800 sticky bottom-3 z-30 shadow-2xl">
              <button
                onClick={() => setMobileSubTab('map')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  mobileSubTab === 'map' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
                }`}
              >
                Topo Map
              </button>
              <button
                onClick={() => setMobileSubTab('radar')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  mobileSubTab === 'radar' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400'
                }`}
              >
                Team Radar ({peers.length})
              </button>
            </div>
          </div>
        )}

        {/* Tab View: Trail Tracker & GPX Studio */}
        {currentTab === 'tracker' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Trail Tracker & GPX Recorder
                </h2>
                <p className="text-xs text-slate-400">
                  Track breadcrumb GPS coordinates, calculate elevation metrics, and export standard .gpx files
                </p>
              </div>

              <button
                onClick={() => setIsGPXModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <FileCode className="w-4 h-4" />
                <span>Saved GPX Trails ({savedTracks.length})</span>
              </button>
            </div>

            <TrailRecorder
              isRecording={isRecording}
              isPaused={isPaused}
              activeTrackPoints={activeTrackPoints}
              elapsedSeconds={elapsedSeconds}
              onStartRecording={handleStartRecording}
              onPauseRecording={handlePauseRecording}
              onResumeRecording={handleResumeRecording}
              onStopAndSaveRecording={handleStopAndSaveRecording}
              onDropWaypoint={(cat, name, note) => handleDropWaypoint(cat, name, note)}
              isBacktracking={isBacktracking}
              onToggleBacktracking={() => setIsBacktracking(!isBacktracking)}
              activeTrackWaypoints={activeTrackWaypoints}
              onOpenPocketMode={handleOpenPocketMode}
            />
          </div>
        )}

        {/* Tab View: LoRa Mesh Radio Details */}
        {currentTab === 'mesh' && (
          <div className="max-w-4xl w-full mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  LoRa & Bluetooth Mesh Transceiver Network
                </h2>
                <p className="text-xs text-slate-400">
                  Direct off-grid long range radio communication (Sub-GHz 433/915 MHz)
                </p>
              </div>

              <button
                onClick={() => setIsHardwareModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Radio className="w-4 h-4" />
                <span>Configure Radio Link</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Radio Parameters</span>
                </h3>
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Operating Frequency:</span>
                    <span className="text-amber-400 font-bold">{hardwareState.frequencyMhz} MHz</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Transmit Power (TX):</span>
                    <span className="text-emerald-400">+{hardwareState.txPowerDbm} dBm (160mW)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Mesh Max Hops:</span>
                    <span>3 Hops</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Packets RX / TX:</span>
                    <span>{hardwareState.packetsReceived} / {hardwareState.packetsSent}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Link Protocol:</span>
                    <span className="text-slate-200">Meshtastic Sub-GHz Packet</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Connected Radio Nodes ({peers.length})</span>
                </h3>
                <div className="space-y-2">
                  {peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: peer.avatarColor }}
                        />
                        <span className="font-bold text-white font-mono">{peer.callsign}</span>
                        <span className="text-slate-500 font-mono">({peer.role})</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        <span>{peer.rssi} dBm</span> · <span>{peer.batteryPct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Packet Terminal */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">Live LoRa Radio Packet Stream</span>
                <span className="font-mono text-[10px] text-emerald-400">CRC Validated</span>
              </div>
              <div className="h-44 p-3 rounded-xl bg-slate-950 border border-slate-850 font-mono text-[11px] text-emerald-400/90 overflow-y-auto space-y-1">
                {radioLogs.map((log, i) => (
                  <div key={i} className="leading-snug truncate">
                    <span className="text-slate-500 mr-2">#{i + 1}</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab View: Field Guide & Technical Manual */}
        {currentTab === 'guide' && <FieldGuide />}
      </main>

      {/* Hardware Modal */}
      <MeshHardwareModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        hardwareState={hardwareState}
        onConnectBluetooth={handleConnectBluetooth}
        onConnectSerial={handleConnectSerial}
        onSelectSimulatedExpedition={handleSelectSimulatedExpedition}
        onDisconnect={handleDisconnectHardware}
        radioLogs={radioLogs}
      />

      {/* GPX Trails & Offline Sharing Modal */}
      <GPXManagerModal
        isOpen={isGPXModalOpen}
        onClose={() => setIsGPXModalOpen(false)}
        savedTracks={savedTracks}
        onSelectTrackForMap={(track) => {
          setImportedTrackForMap(track);
          setCurrentTab('map');
        }}
        onDeleteTrack={async (trackId) => {
          await deleteTrackFromDB(trackId);
          const list = await getAllTracksFromDB();
          setSavedTracks(list);
        }}
        onImportTrack={async (track) => {
          await saveTrackToDB(track);
          const list = await getAllTracksFromDB();
          setSavedTracks(list);
          setImportedTrackForMap(track);
        }}
        waypoints={allWaypoints}
        userLocation={userLocation}
        onAddManualPeer={(callsign, lat, lng) => {
          const newPeer: MeshPeer = {
            id: `manual-peer-${Date.now()}`,
            callsign,
            role: 'Scout',
            lat,
            lng,
            altitude: userLocation?.altitude ?? 780,
            batteryPct: 90,
            lastSeen: Date.now(),
            rssi: -82,
            snr: 8.5,
            status: 'active',
            channel: 'Voice Grid (ว.2)',
            avatarColor: '#10B981',
            heading: 0,
            speedKmh: 0,
          };
          setPeers((prev) => [newPeer, ...prev]);
          setSelectedPeerId(newPeer.id);
        }}
      />

      {/* Cloud Sync & Expedition Room Modal */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        isOnline={isOnline}
        currentRoomId={currentRoomId}
        onUpdateRoomId={(newRoom) => {
          setCurrentRoomId(newRoom);
          cloudSync.setRoomId(newRoom);
          setIsCloudModalOpen(false);
        }}
        activeCloudPeersCount={activeCloudPeersCount}
        lastCloudSync={lastCloudSync}
      />

      {/* Pocket Mode / Screen-Off Continuous Background Tracking HUD */}
      <PocketModeModal
        isOpen={isPocketModeOpen}
        onExit={handleExitPocketMode}
        userLocation={userLocation}
        compassHeading={compassHeading}
        isRecording={isRecording}
        recordedDistanceMeters={computeTrackMetrics(activeTrackPoints).totalDistanceMeters}
        elapsedSeconds={elapsedSeconds}
        onTriggerSos={handleTriggerSos}
        isUserInSos={isUserInSos}
      />
    </div>
  );
}
