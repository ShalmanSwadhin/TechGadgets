import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from '../config/db.js';
import { getRateLimitStore } from '../config/rateLimitStore.js';
import { notFound, errorHandler } from '../middleware/errorHandler.js';
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import cartRoutes from '../routes/cartRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import reviewRoutes from '../routes/reviewRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import settingsRoutes from '../routes/settingsRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import newsletterRoutes from '../routes/newsletterRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
// CLIENT_URL may be a single origin or a comma-separated allow-list (e.g. a
// custom domain plus the *.vercel.app URL). In development it falls back to
// the local Vite dev server on both localhost and 127.0.0.1.
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173';
const allowedOrigins = clientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Shared across instances via Redis when REDIS_URL is set; otherwise the
  // default per-process in-memory store (fine for a single instance).
  store: getRateLimitStore(),
  // Never rate-limit liveness/readiness probes: platform health checks (e.g.
  // Render) and the client's readiness gate poll these frequently and must
  // not receive 429s while the backend is starting up.
  skip: (req) => req.path === '/api/health' || req.path === '/api/health/ready',
});

// Backend readiness lifecycle. The server begins listening immediately (see
// bottom of file) so the port is always open; the actual DB state is derived
// live from Mongoose so it stays accurate across reconnects.
//   STARTING       -> process booted, DB connection not yet attempted
//   DB_CONNECTING  -> listening, waiting for the MongoDB handshake
//   READY          -> DB connected, safe to serve data/writes
//   FAILED         -> DB connection failed (process will restart)
const LIFECYCLE = {
  STARTING: 'starting',
  DB_CONNECTING: 'db_connecting',
  READY: 'ready',
  FAILED: 'failed',
};
let lifecycle = LIFECYCLE.STARTING;

const DB_STATE_LABELS = ['disconnected', 'connected', 'connecting', 'disconnecting'];
const isReady = () => mongoose.connection.readyState === 1 && lifecycle === LIFECYCLE.READY;

// Keep the lifecycle in sync with the real connection so a dropped/restored
// MongoDB connection is reported accurately (important on hosted Mongo/Atlas).
mongoose.connection.on('connected', () => {
  lifecycle = LIFECYCLE.READY;
});
mongoose.connection.on('disconnected', () => {
  if (lifecycle === LIFECYCLE.READY) lifecycle = LIFECYCLE.DB_CONNECTING;
});
mongoose.connection.on('error', () => {
  if (lifecycle !== LIFECYCLE.READY) lifecycle = LIFECYCLE.DB_CONNECTING;
});

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin header (server-to-server, curl, health
      // probes) and any explicitly whitelisted origin. Everything else is
      // rejected — we never blanket-allow every origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'TechGadgets API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      reviews: '/api/reviews',
      admin: '/api/admin',
      upload: '/api/upload',
      newsletter: '/api/newsletter',
    },
    client: clientOrigin,
  });
});

// Health/readiness endpoints.
//   /api/health        -> liveness: always 200 while the process is up.
//   /api/health/ready  -> readiness: 200 only when the DB is connected,
//                         otherwise 503 so clients can wait before sending
//                         critical requests (order creation, etc.).
const healthPayload = () => {
  const dbState = mongoose.connection.readyState;
  const ready = isReady();
  return {
    status: ready ? 'ok' : lifecycle === LIFECYCLE.FAILED ? 'error' : 'starting',
    database: DB_STATE_LABELS[dbState] || 'unknown',
    ready,
    uptime: Math.round(process.uptime()),
  };
};

app.get('/api/health', (_req, res) => {
  res.status(200).json(healthPayload());
});

app.get('/api/health/ready', (_req, res) => {
  const payload = healthPayload();
  res.status(payload.ready ? 200 : 503).json(payload);
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);

app.use(notFound);
app.use(errorHandler);

// Open the port immediately so the frontend proxy never hits a closed socket
// during startup. Mongoose buffers model queries until the connection is
// ready, so requests that arrive during the DB handshake (e.g. the first
// login after a restart) resolve as soon as the connection is established
// instead of failing with ECONNREFUSED. This is the root-cause fix for the
// "login fails on the first attempts after server startup" issue.
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other server (netstat -ano | findstr :${PORT}) or run only one "npm run dev".`
    );
    process.exit(1);
  }
  throw err;
});

lifecycle = LIFECYCLE.DB_CONNECTING;
connectDB()
  .then(() => {
    lifecycle = LIFECYCLE.READY;
  })
  .catch((err) => {
    lifecycle = LIFECYCLE.FAILED;
    console.error('Database connection failed:', err.message);
    // Exit so the process manager (Render, nodemon, node --watch) restarts
    // with a fresh connection attempt rather than serving without a database.
    server.close(() => process.exit(1));
  });

// Graceful shutdown. On a dev restart (`node --watch`) or a production
// redeploy the process receives SIGTERM/SIGINT. Draining in-flight requests
// before the socket closes prevents the ECONNRESET that made the first
// order after a restart fail. A short safety-net timeout guarantees the
// process still exits promptly so the port is released for the new instance.
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    mongoose.connection
      .close(false)
      .catch(() => {})
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(0), 3000).unref();
};

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});
