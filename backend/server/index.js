import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from '../config/db.js';
import { notFound, errorHandler } from '../middleware/errorHandler.js';
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import cartRoutes from '../routes/cartRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import reviewRoutes from '../routes/reviewRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import settingsRoutes from '../routes/settingsRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tracks whether the MongoDB connection is ready. The server begins
// listening immediately (see bottom of file) so the port is always open;
// Mongoose buffers queries until the connection is established.
let dbReady = false;

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(
  cors({
    origin: clientOrigin,
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
    },
    client: clientOrigin,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'TechGadgets API is running',
    database: dbReady ? 'connected' : 'connecting',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

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

connectDB()
  .then(() => {
    dbReady = true;
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    // Exit so the process manager (Render, nodemon, node --watch) restarts
    // with a fresh connection attempt rather than serving without a database.
    server.close(() => process.exit(1));
  });
