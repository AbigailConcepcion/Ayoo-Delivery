import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from "@socket.io/redis-adapter";
import winston from 'winston';
import { Redis } from "ioredis";

import { initDb, getDb } from './db.js';
import { setupRoutes } from './routes.js';
import { verifyToken } from './auth.js';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Structured Logger
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Production Readiness: Validate required ENV variables
const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL', 'MASTER_PIN', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
requiredEnvs.forEach(v => {
  if (!process.env[v]) {
    logger.error(`❌ Missing critical environment variable: ${v}`);
    process.exit(1);
  }
});

const app = express();
const port = process.env.PORT || 4000;
const httpServer = createServer(app);

// Middlewares
app.use(helmet()); // Basic security headers
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Socket.io Initialization
const pubClient = new Redis(process.env.REDIS_URL as string);
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  },
  adapter: createAdapter(pubClient, subClient)
});

app.set('io', io); // Make io accessible in routes via req.app.get('io')

// Socket.io Middleware: Verify JWT Token on connection
io.use((socket: any, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: No token provided'));

  try {
    const decoded = verifyToken(token) as any;
    (socket as any).user = decoded; // Attach user info to socket
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Rate Limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/auth/', limiter);

// Real-time Logic
io.on('connection', (socket: any) => {
  logger.info(`📱 New client connected: ${socket.id}`);
  const user = (socket as any).user;
  logger.info(`📱 Authorized client connected: ${socket.id}, User: ${user?.email}`);

  socket.on('SUBSCRIBE_TRACKING', async (orderId: string) => {
    try {
      const pool = getDb();
      // Verify if the authenticated user is the customer, merchant, or assigned rider for this order
      const result = await pool.query('SELECT "customerEmail", "riderEmail", "restaurantName" FROM orders WHERE id = $1', [orderId]);
      
      if (result.rowCount > 0) {
        const order = result.rows[0];
        const isMerchant = user.role === 'MERCHANT' && user.name === order.restaurantname;

        if (user.email === order.customeremail || user.email === order.rideremail || user.role === 'ADMIN' || isMerchant) {
          socket.join(`order_${orderId}`);
          logger.info(`📡 ${user.email} authorized for order room: ${orderId}`);
        }
      }
    } catch (err) {
      logger.error(`Tracking authorization failed for ${user?.email} on order ${orderId}:`, err);
    }
  });

  socket.on('LOCATION_UPDATE', async (payload: any) => {
    const { orderId } = payload;
    const pool = getDb();
    const result = await pool.query('SELECT "riderEmail" FROM orders WHERE id = $1', [orderId]);

    // Only allow the assigned rider to broadcast their location for this order
    if (result.rowCount > 0 && result.rows[0].rideremail === user.email) {
      io.to(`order_${orderId}`).emit('LOCATION_UPDATE', payload);
    }
  });

  socket.on('JOIN_CHAT', async (orderId: string) => {
    try {
      const pool = getDb();
      const result = await pool.query('SELECT "customerEmail", "riderEmail" FROM orders WHERE id = $1', [orderId]);
      if (result.rowCount > 0) {
        const order = result.rows[0];
        if (user.email === order.customeremail || user.email === order.rideremail || user.role === 'ADMIN') {
          socket.join(`chat_${orderId}`);
          logger.info(`💬 ${user.email} joined chat room: ${orderId}`);
        }
      }
    } catch (err) {
      logger.error(`Chat join failed for ${user?.email} on order ${orderId}:`, err);
    }
  });

  socket.on('SEND_MESSAGE', async (payload: { orderId: string, text: string }) => {
    try {
      const { orderId, text } = payload;
      const pool = getDb();
      const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const timestamp = new Date().toISOString();

      await pool.query(
        'INSERT INTO messages (id, "orderId", "senderEmail", "senderName", text, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [messageId, orderId, user.email, user.name, text, timestamp]
      );

      // Broadcast to everyone in the chat room (including sender if they have multiple tabs)
      io.to(`chat_${orderId}`).emit('RECEIVE_MESSAGE', {
        id: messageId, orderId, senderEmail: user.email, senderName: user.name, text, timestamp, read: false
      });
    } catch (err) {
      logger.error(`Message sending failed for ${user?.email} in order ${payload.orderId}:`, err);
    }
  });

  socket.on('MARK_AS_READ', async (payload: { orderId: string }) => {
    try {
      const { orderId } = payload;
      const pool = getDb();
      
      await pool.query(
        'UPDATE messages SET "isRead" = 1 WHERE "orderId" = $1 AND "senderEmail" != $2 AND "isRead" = 0',
        [orderId, user.email]
      );

      // Notify other participants in the room
      io.to(`chat_${orderId}`).emit('MESSAGES_READ', { orderId, readerEmail: user.email });
    } catch (err) {
      logger.error(`Mark as read failed for ${user?.email} in order ${payload.orderId}:`, err);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Initialize Database
async function startServer() {
  await initDb();
  
  // Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
  });

  // Setup Routes
  setupRoutes(app);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Global Error on ${req.method} ${req.path}:`, {
      message: err.message,
      stack: err.stack,
      code: err.code,
      status: err.status,
      details: err.errors // For Zod errors
    });

    let status = err.status || 500;
    let message = isProduction ? 'Internal Server Error' : err.message;

    // Handle Zod Validation Errors
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }

    // PostgreSQL Specific Error Mapping
    if (err.code === '23505') {
      status = 409; // Conflict
      message = 'A resource with this identifier already exists.';
    } else if (err.code === '23503') {
      status = 400; // Bad Request
      message = 'Database reference constraint violation.';
    }

    res.status(status).json({
      error: message,
      ...(isProduction ? {} : { pgCode: err.code, stack: err.stack })
    });
  });

  httpServer.listen(port, () => {
    logger.info(`🚀 Ayoo Delivery Server [${isProduction ? 'PROD' : 'DEV'}] listening on port ${port}`);
  });

  // Graceful Shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      getDb().end().then(() => {
        logger.info('PostgreSQL pool closed');
        pubClient.quit();
        subClient.quit();
        logger.info('Redis clients closed');
        process.exit(0);
      }).catch((err: any) => {
        logger.error('Error closing PostgreSQL pool:', err);
        process.exit(1);
      });
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1); // Exit with failure
  });
}

startServer();
