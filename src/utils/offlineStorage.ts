import { MeshPeer, TrackRecord, Waypoint } from '../types';

const DB_NAME = 'WildernessMeshDB';
const DB_VERSION = 2;
const TRACKS_STORE = 'tracks';
const WAYPOINTS_STORE = 'waypoints';
const PEERS_STORE = 'peers';
const SETTINGS_STORE = 'settings';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(WAYPOINTS_STORE)) {
        db.createObjectStore(WAYPOINTS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(PEERS_STORE)) {
        db.createObjectStore(PEERS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Track operations
export async function saveTrackToDB(track: TrackRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.put(track);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTracksFromDB(): Promise<TrackRecord[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readonly');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result as TrackRecord[]) || [];
      list.sort((a, b) => b.startTime - a.startTime);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTrackFromDB(trackId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRACKS_STORE, 'readwrite');
    const store = tx.objectStore(TRACKS_STORE);
    const req = store.delete(trackId);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Waypoint operations
export async function saveWaypointToDB(waypoint: Waypoint): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WAYPOINTS_STORE, 'readwrite');
    const store = tx.objectStore(WAYPOINTS_STORE);
    const req = store.put(waypoint);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllWaypointsFromDB(): Promise<Waypoint[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WAYPOINTS_STORE, 'readonly');
    const store = tx.objectStore(WAYPOINTS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result as Waypoint[]) || [];
      list.sort((a, b) => b.timestamp - a.timestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteWaypointFromDB(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WAYPOINTS_STORE, 'readwrite');
    const store = tx.objectStore(WAYPOINTS_STORE);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Teammate Peer operations
export async function savePeersToDB(peers: MeshPeer[]): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PEERS_STORE, 'readwrite');
    const store = tx.objectStore(PEERS_STORE);
    store.clear(); // overwrite with current team list
    peers.forEach((p) => store.put(p));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPeersFromDB(): Promise<MeshPeer[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PEERS_STORE, 'readonly');
    const store = tx.objectStore(PEERS_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result as MeshPeer[]) || [];
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}
