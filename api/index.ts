import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// In-memory Cloud Rooms store: roomId -> peerId -> MeshPeer
const rooms: Record<string, Record<string, any>> = {};
const roomSos: Record<string, any[]> = {};

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PBMaps Hybrid Cloud Relay (Serverless)' });
});

// Get active peers and SOS alerts in a room
app.get('/api/rooms/:roomId/peers', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const normalizedRoom = (roomId || '').toUpperCase().trim();
  const peersMap = rooms[normalizedRoom] || {};
  const now = Date.now();

  // Filter peers seen in the last 5 minutes
  const activePeers = Object.values(peersMap).filter(
    (p: any) => now - (p.lastSeen || 0) < 300000
  );

  res.json({
    roomId: normalizedRoom,
    peers: activePeers,
    sos: roomSos[normalizedRoom] || [],
  });
});

// Broadcast peer location and SOS to room
app.post('/api/rooms/:roomId/update', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const normalizedRoom = (roomId || '').toUpperCase().trim();
  const { peer, sos } = req.body;

  if (!rooms[normalizedRoom]) {
    rooms[normalizedRoom] = {};
  }

  if (peer && peer.id) {
    rooms[normalizedRoom][peer.id] = {
      ...peer,
      lastSeen: Date.now(),
      networkBearer: '4G/5G Internet Cloud',
    };
  }

  if (sos && sos.id) {
    if (!roomSos[normalizedRoom]) {
      roomSos[normalizedRoom] = [];
    }
    if (!roomSos[normalizedRoom].some((s) => s.id === sos.id)) {
      roomSos[normalizedRoom].push(sos);
    }
  }

  res.json({ success: true, activeCount: Object.keys(rooms[normalizedRoom]).length });
});

// Resolve SOS
app.post('/api/rooms/:roomId/resolve-sos', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const normalizedRoom = (roomId || '').toUpperCase().trim();
  const { sosId } = req.body;

  if (roomSos[normalizedRoom]) {
    roomSos[normalizedRoom] = roomSos[normalizedRoom].filter((s) => s.id !== sosId);
  }
  res.json({ success: true });
});

export default app;
