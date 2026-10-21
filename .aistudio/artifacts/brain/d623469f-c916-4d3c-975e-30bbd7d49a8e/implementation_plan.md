# WildernessMesh: Offline Trail Navigation & LoRa/BLE Mesh Team Tracker

A rugged, offline-first wilderness navigation and peer-to-peer tracking web application designed for off-grid backcountry expeditions, deep forest hikes, and search-and-rescue teams without cellular or internet coverage.

### User Review & Critical Decisions

> [!IMPORTANT]
> **Offline Transmission Architecture (LoRa & Bluetooth Mesh)**:
> In wilderness areas with zero cellular reception, smartphones cannot communicate over the internet. The app solves this via a multi-tiered communication bridge:
> 1. **LoRa (Long Range) via Web Bluetooth / Web Serial**: Connects your phone to battery-efficient LoRa transceiver nodes (e.g., Meshtastic, LilyGO T-Beam, Heltec LoRa32, RAK WisBlock) operating at 433/868/915 MHz, achieving 2–15+ km transmission through trees, valleys, and ridges.
> 2. **Direct Bluetooth Mesh (BLE)**: Connects nearby team members (30–100m) directly phone-to-node or phone-to-phone without external equipment.
> 3. **Integrated Mesh Simulator & Offline Relay**: Enables immediate full-fidelity testing, demonstrating multi-node packet relaying, SOS beacon alerts, and teammate telemetry even before hardware is plugged in.
> 4. **Offline GPX File Sharing & QR Trail Bursts**: Allows instant route and waypoint transfer between team devices completely offline via GPX file exports and compressed QR data transfers.

---

### 1. Overview & Core Concept

**WildernessMesh** empowers hikers, forest rangers, and outdoor adventure teams to explore deep backcountry terrain safely with real-time positional awareness of all teammates, high-precision GPX trail tracking, and offline topographic navigation:

- **True Offline Navigation**: Pre-cache topographic contour maps, hillshading, and vector trail waypoints into IndexedDB with zero dependence on cellular reception.
- **Real-Time Teammate Mesh Radar**: See where your friends are in real time on the topo map, complete with live distance, directional bearing arrows, altitude, battery level, and last ping timestamps.
- **GPX Trail Recording & Elevation Profiling**: Record breadcrumb trails with GPS coordinates, elevation gain/loss, pacing, and custom waypoint drops (campsite, freshwater source, hazardous cliffs, summit).
- **Backtrack & Off-Trail Alerts**: Follow imported or recorded GPX trails with visual cross-track error alerts and one-tap return-to-start reverse navigation.
- **Emergency SOS Mesh Broadcast**: Transmit priority emergency distress packets with precise coordinates, battery level, and nature of emergency across the mesh network.
- **PWA Offline Standalone Installation**: Installable to home screens as a progressive web app with full offline Service Worker caching.

---

### 2. User Experience & Visual Design

#### Aesthetic Direction: High-Contrast Wilderness Tactical
- **Tone**: Utilitarian, reliable, mission-critical field instrument engineered for harsh outdoor sunlight and night-mode dark terrain navigation.
- **Color Palette (60-30-10 Rule)**:
  - Canvas (60%): Deep Topo Slate `#0B0F14` / Pure Field Daylight White `#F8FAFC`.
  - Structural Surfaces (30%): Tactical Dark Slate `#151D26`, hairline borders `#22303E`, topographic contour amber lines `#D97706`.
  - High-Intent Accents (10%): High-visibility Safety Amber `#F59E0B` for user location and active recording, High-Vis Emerald `#10B981` for connected mesh peers, International Safety Orange/Red `#EF4444` for SOS distress.
- **Typography**: 
  - Primary Display & UI: `Plus Jakarta Sans` for clean, unambiguous readability.
  - Telemetry, Coordinates, & Bearing: `JetBrains Mono` with `tabular-nums` for rock-solid coordinate and numerical alignment (`18°47'32.4"N 98°55'14.2"E`, `Alt: 1,420m`, `Dist: 342m`).
- **Touch-First Thumb Ergonomics**:
  - Minimum 48px touch targets for gloved or cold hands.
  - Floating bottom tactical thumb HUD for Quick Waypoint, Rec/Pause Track, Compass Toggle, and SOS trigger.
  - Top Bar adhering strictly to the 1-row, 3-zone contract with brand wordmark, quick mode navigation, and hardware connection button.

---

### 3. Key Product Decisions & Trade-Offs

1. **Hardware Bridge: Web Bluetooth & Web Serial API + Simulated Hardware Node**:
   - *Why*: Browsers can natively connect to Meshtastic / LoRa ESP32 devices via Web Bluetooth and Web Serial without needing an app store download. Adding an interactive built-in mesh node simulator allows users to test peer tracking and multi-node routing immediately on any device.
2. **Offline Tile & Vector Storage in IndexedDB**:
   - *Why*: LocalStorage is limited to 5MB, which cannot hold offline map tiles. IndexedDB provides hundreds of megabytes of persistent offline storage for topo tiles, elevation profiles, and GPX archives.
3. **GPX 1.1 Specification Standards**:
   - *Why*: Standards-compliant XML GPX `<trk>`, `<trkseg>`, `<trkpt>`, and `<wpt>` support ensures 100% interoperability with Garmin, Strava, Gaia GPS, and OsmAnd.
4. **Compass & Heading Orientation Engine**:
   - *Why*: Incorporates device orientation (`DeviceOrientationEvent` / magnetometers) with graceful fallback to GPS movement bearing to render real-time friend direction pointers.

---

### 4. Technical Architecture & System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WildernessMesh PWA Client                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Top Navigation (Brand • Nav Views • PWA Install • LoRa/BLE Hardware Sync) │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐  ┌──────────────────────────────────────────┐  │
│  │    Leaflet Topo Map     │  │          Teammate Mesh Radar             │  │
│  │   & Canvas GPX Layer    │  │  - Peer List & Distance/Bearing Vector   │  │
│  │                         │  │  - LoRa Signal (RSSI/SNR), Battery       │  │
│  │ - OpenTopo / Terrain    │  │  - One-tap Friend Bearing Lock-on        │  │
│  │ - Waypoint Pins & Icons │  │  - Offline SOS Distress Alert Banner     │  │
│  │ - Live Trail Polyline   │  └──────────────────────────────────────────┘  │
│  │ - Breadcrumb Recorder   │  ┌──────────────────────────────────────────┐  │
│  └─────────────────────────┘  │      Trail Manager & GPX Studio          │  │
│  ┌─────────────────────────┐  │  - Elevation Profile (Min/Max/Gain)      │  │
│  │   Tactical Thumb HUD    │  │  - Export / Import GPX Files             │  │
│  │ [Rec/Stop] [Drop Waypt] │  │  - Offline QR Route Share Code Generator │  │
│  │ [Compass] [SOS Beacon]  │  │  - Turn-by-Turn Backtrack Mode          │  │
│  └─────────────────────────┘  └──────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Offline Infrastructure                              │
│  ┌────────────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │
│  │  IndexedDB Cache Store │  │ Geolocation Engine │  │ LoRa/BLE Bridge   │  │
│  │  - Topo Map Tiles      │  │ - High Accuracy GPS│  │ - Web Bluetooth   │  │
│  │  - Recorded GPX Tracks │  │ - Magnetometer HUD │  │ - Web Serial API  │  │
│  │  - Waypoint Registry   │  │ - Heading / Speed  │  │ - Mesh Simulator  │  │
│  └────────────────────────┘  └────────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Implementation Phases & Features

#### Phase 1: Core Map Engine & Offline Topographic Architecture
- Interactive Leaflet mapping engine with offline-first tile caching.
- Custom military-grade topographic tile styling, hillshading toggle, and offline tile downloader (caching bounds for selected wilderness regions).
- Current user GPS tracking with high-accuracy Geolocation API and compass bearing display.

#### Phase 2: Peer-to-Peer Mesh Telemetry & LoRa/BLE Bridge
- LoRa and Bluetooth Mesh communication engine supporting:
  - Web Bluetooth GATT service connection for Meshtastic nodes.
  - Web Serial for USB-connected LoRa ESP32 devices.
  - Active peer simulation mode with multiple virtual teammates moving through wilderness paths to demonstrate real-time packet exchange.
- Teammate status cards with bearing arrow, distance calculation (Haversine formula), elevation differential, and radio signal strength (RSSI/SNR).
- Emergency SOS beacon broadcast with coordinates and priority alert sound/visual cues.

#### Phase 3: GPX Trail Recording, Elevation Profiling & Navigation
- Active trail recorder with start, pause, resume, and finish actions.
- Real-time trail stats: Total distance, elapsed time, average moving speed, cumulative elevation gain and loss.
- Interactive SVG elevation profile graph displaying current altitude position along the track.
- Waypoint dropping with categories (Campsite, Water, Danger, Summit, Trailhead).
- Backtrack mode to reverse-navigate back to the starting point.

#### Phase 4: GPX File Import/Export & Offline Peer Sharing
- Import any standard `.gpx` file from local device storage to render on the map.
- Export recorded tracks to `.gpx` with complete trackpoints, timestamps, and waypoints.
- Compressed Offline QR Code generator and reader to share waypoints and tracks between phones directly screen-to-camera with zero internet.

#### Phase 5: PWA Compliance & Field Verification
- Service Worker configuration with asset caching.
- Web App Manifest (`standalone` display, outdoor tactical icons, theme color).
- In-app `PWAInstallButton` with installation guidance.
