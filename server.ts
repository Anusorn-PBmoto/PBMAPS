import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // In-memory Cloud Rooms store: roomId -> peerId -> MeshPeer
  const rooms: Record<string, Record<string, any>> = {};
  const roomSos: Record<string, any[]> = {};

  // Health check
  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', service: 'PBMaps Hybrid Cloud Relay' });
  });

  // Get active peers and SOS alerts in a room
  app.get('/api/rooms/:roomId/peers', (req, res) => {
    const { roomId } = req.params;
    const normalizedRoom = roomId.toUpperCase().trim();
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
  app.post('/api/rooms/:roomId/update', (req, res) => {
    const { roomId } = req.params;
    const normalizedRoom = roomId.toUpperCase().trim();
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
  app.post('/api/rooms/:roomId/resolve-sos', (req, res) => {
    const { roomId } = req.params;
    const normalizedRoom = roomId.toUpperCase().trim();
    const { sosId } = req.body;

    if (roomSos[normalizedRoom]) {
      roomSos[normalizedRoom] = roomSos[normalizedRoom].filter((s) => s.id !== sosId);
    }
    res.json({ success: true });
  });

  // Vite dev middleware vs production static
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    const distPath = path.resolve(__dirname, 'dist');
    const staticDir = fs.existsSync(distPath) ? distPath : __dirname;
    app.use(express.static(staticDir));
    app.get('*', (_, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[PBMaps] Hybrid server listening on port ${port}`);
  });
}

startServer();
