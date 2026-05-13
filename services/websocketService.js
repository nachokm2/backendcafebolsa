const WebSocket = require('ws');
const jwt       = require('jsonwebtoken');
const url       = require('url');

let wss = null;
const clients = new Set();

const verifyToken = (request) => {
  try {
    const { query } = url.parse(request.url, true);
    const token = query.token;
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const initialize = (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, request) => {
    // Verificación opcional: si hay token lo validamos; si no, es cliente público (solo lectura)
    const user = verifyToken(request);
    ws.user = user;

    clients.add(ws);
    console.log(`[WS] Client connected (${user ? user.name : 'anónimo'}) — total: ${clients.size}`);

    ws.send(JSON.stringify({
      type: 'connected',
      data: { message: 'CaféBolsa WebSocket activo', authenticated: !!user },
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected — total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      clients.delete(ws);
    });
  });

  console.log('[WS] WebSocket server initialized');
};

const broadcast = (type, data) => {
  if (!wss) return;

  const payload = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });

  let sent = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sent++;
    }
  });

  console.log(`[WS] Broadcast "${type}" → ${sent} client(s)`);
};

const getClientCount = () => clients.size;

/** Send a targeted message to a single authenticated user (by id). */
const broadcastToUser = (userId, type, data) => {
  if (!wss) return;
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.user?.id === userId) {
      client.send(payload);
    }
  });
};

module.exports = { initialize, broadcast, broadcastToUser, getClientCount };
