require('dotenv').config();
const http      = require('http');
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const wsService    = require('./services/websocketService');
const priceEngine  = require('./services/priceEngine');
const errorHandler = require('./middleware/errorHandler');

const productRoutes  = require('./routes/products');
const salesRoutes    = require('./routes/sales');
const authRoutes     = require('./routes/auth');
const sessionRoutes  = require('./routes/sessions');
const reportsRoutes  = require('./routes/reports');
const adminRoutes    = require('./routes/admin');
const customerRoutes = require('./routes/customers');
const alertRoutes    = require('./routes/alerts');

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 3001;

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .concat(['file://', 'null']);   // mantiene compatibilidad web local

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting — solo en login (protección fuerza bruta) ─
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutos
  max: 10,                      // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos. Intenta en 10 minutos.' }
});

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/products',  productRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/auth/login', loginLimiter);   // rate limit antes del router de auth
app.use('/api/auth',      authRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/reports',   reportsRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/alerts',   alertRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    wsClients:  wsService.getClientCount(),
    paused:     priceEngine.isPaused(),
    timestamp:  new Date().toISOString()
  });
});

// ── Error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── WebSocket ───────────────────────────────────────────────
wsService.initialize(server);

// ── Motor de precios ────────────────────────────────────────
priceEngine.startPriceDecreaseScheduler();
priceEngine.scheduleMidnightReset();

// ── Iniciar servidor ────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════╗`);
  console.log(`║  CaféBolsa Backend v2                 ║`);
  console.log(`║  API:       http://localhost:${PORT}   ║`);
  console.log(`║  WebSocket: ws://localhost:${PORT}     ║`);
  console.log(`╚═══════════════════════════════════════╝`);
});

module.exports = { app, server };
