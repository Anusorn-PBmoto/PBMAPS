import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Navigation,
  Radio,
  Users,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { GeoPoint, MapLayerType, MeshPeer, Waypoint } from '../types';
import { calculateBearing, calculateHaversineDistance, formatDistance, formatDMS } from '../utils/geo';

interface TacticalMapProps {
  userLocation: GeoPoint | null;
  compassHeading: number;
  peers: MeshPeer[];
  activeTrackPoints: GeoPoint[];
  importedTrackPoints?: GeoPoint[];
  waypoints: Waypoint[];
  selectedPeerId: string | null;
  onSelectPeer: (peerId: string | null) => void;
  onDropWaypoint: (lat: number, lng: number) => void;
  isRecording: boolean;
  isBacktracking: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  userLocation,
  compassHeading,
  peers,
  activeTrackPoints,
  importedTrackPoints,
  waypoints,
  selectedPeerId,
  onSelectPeer,
  onDropWaypoint,
  isRecording,
  isBacktracking,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Markers and layers refs
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const peerMarkersRef = useRef<{ [key: string]: L.Marker }>({});
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const activeTrackPolylineRef = useRef<L.Polyline | null>(null);
  const importedTrackPolylineRef = useRef<L.Polyline | null>(null);
  const backtrackPolylineRef = useRef<L.Polyline | null>(null);
  const bearingLineRef = useRef<L.Polyline | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('topo');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isLockedToUser, setIsLockedToUser] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default to Khao Yai / Central Thailand if no location yet
    const initialLat = userLocation?.lat ?? 14.4392;
    const initialLng = userLocation?.lng ?? 101.3724;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom attribution
    map.attributionControl.setPrefix(false);

    mapRef.current = map;

    // Detect user pan/drag to unlock auto-center
    map.on('dragstart', () => {
      setIsLockedToUser(false);
    });

    // Handle map click to drop waypoint
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      onDropWaypoint(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    let attribution = '© OpenTopoMap, OpenStreetMap';
    let maxZoom = 17;

    if (activeLayer === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors';
      maxZoom = 19;
    } else if (activeLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles © Esri, USGS';
      maxZoom = 18;
    } else if (activeLayer === 'tactical-dark') {
      // CartoDB Dark Matter for low light tactical
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '© CARTO, OpenStreetMap';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      maxZoom,
      subdomains: 'abc',
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Update User Location & Heading
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const userPos: [number, number] = [userLocation.lat, userLocation.lng];

    if (isLockedToUser) {
      map.panTo(userPos, { animate: true, duration: 0.5 });
    }

    // User Marker Icon with Compass Heading Cone
    const headingDeg = userLocation.heading ?? compassHeading;
    const userHtml = `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-2 -mt-2">
        <!-- Pulse ring -->
        <div class="absolute inset-0 rounded-full bg-amber-500/20 animate-beacon"></div>
        <!-- Direction cone -->
        <div style="transform: rotate(${headingDeg}deg);" class="absolute -top-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-amber-400 drop-shadow"></div>
        <!-- Core dot -->
        <div class="relative w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'user-location-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(userPos, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(userPos);
      userMarkerRef.current.setIcon(userIcon);
    }

    // Accuracy Circle
    if (userLocation.accuracy && userLocation.accuracy > 5) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle(userPos, {
          radius: userLocation.accuracy,
          color: '#f59e0b',
          weight: 1,
          opacity: 0.4,
          fillColor: '#f59e0b',
          fillOpacity: 0.08,
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng(userPos);
        userAccuracyCircleRef.current.setRadius(userLocation.accuracy);
      }
    } else if (userAccuracyCircleRef.current) {
      map.removeLayer(userAccuracyCircleRef.current);
      userAccuracyCircleRef.current = null;
    }
  }, [userLocation, compassHeading, isLockedToUser]);

  // Update Teammate Mesh Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers not in current peers list
    const currentPeerIds = new Set(peers.map((p) => p.id));
    Object.keys(peerMarkersRef.current).forEach((id) => {
      if (!currentPeerIds.has(id)) {
        map.removeLayer(peerMarkersRef.current[id]);
        delete peerMarkersRef.current[id];
      }
    });

    // Update or create peer markers
    peers.forEach((peer) => {
      const isSelected = peer.id === selectedPeerId;
      const isSos = peer.status === 'sos';

      let distanceText = '';
      if (userLocation) {
        const d = calculateHaversineDistance(userLocation.lat, userLocation.lng, peer.lat, peer.lng);
        distanceText = formatDistance(d);
      }

      const peerHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-110 z-50' : 'hover:scale-105'
        }">
          ${
            isSos
              ? '<div class="absolute -inset-2 rounded-full bg-red-600/50 animate-ping"></div>'
              : ''
          }
          <!-- Callsign Tag -->
          <div class="px-2 py-0.5 mb-1 text-[10px] font-bold font-mono tracking-tight text-white rounded bg-slate-900/90 border border-slate-700 shadow-md whitespace-nowrap flex items-center gap-1">
            ${isSos ? '<span class="text-red-400 animate-pulse">SOS!</span>' : ''}
            <span>${peer.callsign}</span>
            ${distanceText ? `<span class="text-slate-400 font-normal">· ${distanceText}</span>` : ''}
          </div>
          <!-- Marker Pin -->
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${
            isSos ? 'bg-red-600' : 'bg-emerald-600'
          }" style="background-color: ${isSos ? '#EF4444' : peer.avatarColor}">
            <span class="text-[9px] font-bold text-white font-mono">${peer.role[0]}</span>
          </div>
        </div>
      `;

      const peerIcon = L.divIcon({
        html: peerHtml,
        className: 'mesh-peer-marker',
        iconSize: [80, 48],
        iconAnchor: [40, 44],
      });

      if (!peerMarkersRef.current[peer.id]) {
        const marker = L.marker([peer.lat, peer.lng], { icon: peerIcon })
          .addTo(map)
          .on('click', () => {
            onSelectPeer(peer.id === selectedPeerId ? null : peer.id);
          });
        peerMarkersRef.current[peer.id] = marker;
      } else {
        peerMarkersRef.current[peer.id].setLatLng([peer.lat, peer.lng]);
        peerMarkersRef.current[peer.id].setIcon(peerIcon);
      }
    });

    // Update Bearing Line to Selected Peer
    if (selectedPeerId && userLocation) {
      const selectedPeer = peers.find((p) => p.id === selectedPeerId);
      if (selectedPeer) {
        const lineCoords: [number, number][] = [
          [userLocation.lat, userLocation.lng],
          [selectedPeer.lat, selectedPeer.lng],
        ];

        if (!bearingLineRef.current) {
          bearingLineRef.current = L.polyline(lineCoords, {
            color: selectedPeer.status === 'sos' ? '#ef4444' : '#10b981',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.8,
          }).addTo(map);
        } else {
          bearingLineRef.current.setLatLngs(lineCoords);
          bearingLineRef.current.setStyle({
            color: selectedPeer.status === 'sos' ? '#ef4444' : '#10b981',
          });
        }
      }
    } else if (bearingLineRef.current) {
      map.removeLayer(bearingLineRef.current);
      bearingLineRef.current = null;
    }
  }, [peers, selectedPeerId, userLocation]);

  // Update Waypoints
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing waypoint markers
    waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
    waypointMarkersRef.current = [];

    const categoryIcons: { [key in Waypoint['category']]: { label: string; color: string; border: string } } = {
      camp: { label: '⛺ Camp', color: '#3b82f6', border: '#1d4ed8' },
      water: { label: '💧 Water', color: '#06b6d4', border: '#0891b2' },
      summit: { label: '▲ Peak', color: '#8b5cf6', border: '#6d28d9' },
      hazard: { label: '⚠ Hazard', color: '#ef4444', border: '#b91c1c' },
      trailhead: { label: '🚩 Start', color: '#10b981', border: '#047857' },
      poi: { label: '📍 Waypoint', color: '#f59e0b', border: '#d97706' },
    };

    waypoints.forEach((wpt) => {
      const config = categoryIcons[wpt.category] || categoryIcons.poi;

      const wptHtml = `
        <div class="flex flex-col items-center cursor-pointer">
          <div class="px-1.5 py-0.5 text-[9px] font-semibold text-white rounded bg-slate-900/90 border border-slate-700 shadow whitespace-nowrap mb-0.5">
            ${wpt.name}
          </div>
          <div class="w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center" style="background-color: ${config.color}">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `;

      const wptIcon = L.divIcon({
        html: wptHtml,
        className: 'waypoint-marker',
        iconSize: [60, 40],
        iconAnchor: [30, 36],
      });

      const marker = L.marker([wpt.lat, wpt.lng], { icon: wptIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-slate-900">
            <p class="font-bold text-sm text-slate-900">${wpt.name}</p>
            <p class="text-xs text-slate-500 capitalize">${config.label} ${wpt.altitude ? `· ${Math.round(wpt.altitude)}m` : ''}</p>
            ${wpt.note ? `<p class="text-xs text-slate-700 mt-1">${wpt.note}</p>` : ''}
            <p class="text-[10px] text-slate-400 font-mono mt-1">${wpt.lat.toFixed(5)}, ${wpt.lng.toFixed(5)}</p>
          </div>
        `);

      waypointMarkersRef.current.push(marker);
    });
  }, [waypoints]);

  // Update Active Recorded Track Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latlngs: [number, number][] = activeTrackPoints.map((p) => [p.lat, p.lng]);

    if (!activeTrackPolylineRef.current) {
      activeTrackPolylineRef.current = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      activeTrackPolylineRef.current.setLatLngs(latlngs);
    }
  }, [activeTrackPoints]);

  // Update Imported GPX Track Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (importedTrackPoints && importedTrackPoints.length > 0) {
      const latlngs: [number, number][] = importedTrackPoints.map((p) => [p.lat, p.lng]);

      if (!importedTrackPolylineRef.current) {
        importedTrackPolylineRef.current = L.polyline(latlngs, {
          color: '#06b6d4',
          weight: 3,
          opacity: 0.8,
          dashArray: isBacktracking ? '8, 6' : undefined,
        }).addTo(map);
      } else {
        importedTrackPolylineRef.current.setLatLngs(latlngs);
        importedTrackPolylineRef.current.setStyle({
          dashArray: isBacktracking ? '8, 6' : undefined,
        });
      }
    } else if (importedTrackPolylineRef.current) {
      map.removeLayer(importedTrackPolylineRef.current);
      importedTrackPolylineRef.current = null;
    }
  }, [importedTrackPoints, isBacktracking]);

  // Center on User button handler
  const handleCenterUser = () => {
    const map = mapRef.current;
    if (!map) return;
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 15, { animate: true });
      setIsLockedToUser(true);
    }
  };

  // Fit bounds to include all peers and user
  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;

    const points: [number, number][] = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    peers.forEach((p) => points.push([p.lat, p.lng]));
    waypoints.forEach((w) => points.push([w.lat, w.lng]));

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      setIsLockedToUser(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-xl border border-slate-800 bg-[#0d131a] shadow-2xl">
      {/* Leaflet DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Telemetry HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white shadow-lg text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Compass
              className="w-3.5 h-3.5 text-amber-400 transition-transform duration-200"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            />
            <span className="font-bold text-amber-400">{Math.round(compassHeading)}°</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="font-mono text-slate-300">
            {userLocation ? (
              <span>
                {formatDMS(userLocation.lat, true)} {formatDMS(userLocation.lng, false)}
              </span>
            ) : (
              <span className="text-slate-500">Acquiring GPS...</span>
            )}
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 font-mono text-xs text-slate-300" title="Satellite GNSS (GPS/GLONASS) Receiver Active">
            <span className="text-amber-400">🛰</span>
            <span className="text-slate-400">GNSS:</span>
            <span className="text-emerald-400 font-semibold">{userLocation ? '3D Lock' : 'Searching'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="font-mono text-slate-300">
            Alt:{' '}
            <span className="text-emerald-400 font-semibold">
              {userLocation?.altitude ? `${Math.round(userLocation.altitude)}m` : '---'}
            </span>
          </div>
          {isRecording && (
            <>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>REC ({activeTrackPoints.length} pts)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Layer Picker Floating Menu */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white shadow-lg transition active:scale-95"
          title="Switch Map Layers"
        >
          <Layers className="w-4 h-4 text-amber-400" />
        </button>

        {showLayerMenu && (
          <div className="p-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl text-xs space-y-1 w-36">
            <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Map Style</p>
            <button
              onClick={() => {
                setActiveLayer('topo');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md font-medium transition ${
                activeLayer === 'topo' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              OpenTopo (Contours)
            </button>
            <button
              onClick={() => {
                setActiveLayer('osm');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md font-medium transition ${
                activeLayer === 'osm' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Standard Trails (OSM)
            </button>
            <button
              onClick={() => {
                setActiveLayer('satellite');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md font-medium transition ${
                activeLayer === 'satellite' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Satellite Imagery
            </button>
            <button
              onClick={() => {
                setActiveLayer('tactical-dark');
                setShowLayerMenu(false);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md font-medium transition ${
                activeLayer === 'tactical-dark' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Tactical Night Grid
            </button>
          </div>
        )}
      </div>

      {/* Floating Tactical Navigation Action Buttons */}
      <div className="absolute right-3 bottom-6 z-10 flex flex-col gap-2">
        <button
          onClick={handleCenterUser}
          className={`flex items-center justify-center w-11 h-11 rounded-xl backdrop-blur-md border shadow-xl transition active:scale-95 ${
            isLockedToUser
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:text-white'
          }`}
          title="Center on My Location"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={handleFitAll}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white shadow-xl transition active:scale-95"
          title="Fit All Team Members on Screen"
        >
          <Users className="w-5 h-5 text-emerald-400" />
        </button>

        <button
          onClick={() => {
            const map = mapRef.current;
            if (map) map.zoomIn();
          }}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white shadow-xl transition active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const map = mapRef.current;
            if (map) map.zoomOut();
          }}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white shadow-xl transition active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Add Waypoint Hint / Button */}
      <div className="absolute left-3 bottom-6 z-10">
        <button
          onClick={() => {
            if (userLocation) {
              onDropWaypoint(userLocation.lat, userLocation.lng);
            } else {
              const center = mapRef.current?.getCenter();
              if (center) onDropWaypoint(center.lat, center.lng);
            }
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-amber-400 hover:bg-slate-800 text-xs font-semibold shadow-xl transition active:scale-95"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Mark Waypoint Here</span>
        </button>
      </div>
    </div>
  );
};
