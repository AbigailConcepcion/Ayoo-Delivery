import { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import Stripe from 'stripe';
import { createHmac, timingSafeEqual } from 'crypto';

import { getDb } from './db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  asyncHandler,
  AuthRequest
} from './auth.js';
import { createStripePaymentIntent, stripe as stripeInstance } from './payments.js';
import winston from 'winston';

declare const process: {
  env: {
    STRIPE_SECRET?: string;
    STRIPE_SECRET_KEY?: string;
    PAYMONGO_SECRET_KEY?: string;
    PAYMONGO_WEBHOOK_SECRET?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    APP_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};

const getStripeSecret = () => process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
const getPayMongoSecret = () => process.env.PAYMONGO_SECRET_KEY;
const getAppBaseUrl = () => process.env.APP_BASE_URL || 'http://localhost:5173';

// Structured Logger for routes
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});
const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';

const PAYMONGO_METHODS: Record<string, string[]> = {
  GCASH: ['gcash'],
  MAYA: ['paymaya'],
  VISA: ['card'],
  MASTERCARD: ['card']
};

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  preferredCity: z.string().optional(),
  role: z.string().optional(),
  merchantId: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const orderSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  items: z.array(z.any()),
  total: z.number(),
  status: z.string(),
  restaurantName: z.string(),
  customerEmail: z.string().email().optional(),
  customerName: z.string(),
  riderName: z.string().optional(),
  riderEmail: z.string().optional(),
  deliveryAddress: z.string(),
  tipAmount: z.number().optional(),
  pointsEarned: z.number().optional(),
  paymentMethod: z.string().optional(),
  paymentId: z.string().nullable().optional(),
  isPaid: z.number().optional(),
  transactionId: z.string().nullable().optional(),
  rating: z.number().optional(),
  comment: z.string().optional(),
  receiptUrl: z.string().optional()
});

const paymentProcessSchema = z.object({
  email: z.string().email(),
  methodId: z.string(),
  amount: z.number().min(0),
  orderId: z.string(),
  idempotencyKey: z.string().uuid()
});

const payMongoCheckoutSchema = z.object({
  email: z.string().email(),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  preferredType: z.enum(['GCASH', 'MAYA', 'VISA', 'MASTERCARD']).optional()
});

const payMongoPaymentIntentSchema = z.object({
  email: z.string().email(),
  orderId: z.string().min(1),
  amount: z.number().positive(),
  preferredType: z.enum(['GCASH', 'MAYA', 'VISA', 'MASTERCARD']).optional()
});

const payMongoPaymentMethodCreateSchema = z.object({
  email: z.string().email(),
  type: z.enum(['gcash', 'paymaya', 'card']),
  details: z.record(z.any()).default({}),
  billing: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

const payMongoAttachIntentSchema = z.object({
  email: z.string().email(),
  orderId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  clientKey: z.string().optional()
});

const paymentMethodSchema = z.object({
  id: z.string(),
  type: z.string(),
  last4: z.string().optional(),
  expiry: z.string().optional(),
  phoneNumber: z.string().optional(),
  balance: z.number().nullable().optional(),
  token: z.string().optional()
});

const topUpSchema = z.object({
  methodId: z.string(),
  amount: z.number().min(0)
});

const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  details: z.string(),
  city: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  distanceKm: z.number().optional(),
  deliveryFee: z.number().optional()
});

const ledgerSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.string(),
  description: z.string(),
  timestamp: z.string(),
  orderId: z.string().optional(),
  methodType: z.string().optional(),
  referenceId: z.string().optional(),
  idempotencyKey: z.string().uuid().optional(),
  status: z.string()
});

const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  rating: z.number(),
  deliveryTime: z.string(),
  image: z.string(),
  cuisine: z.string(),
  items: z.array(z.any()),
  isPartner: z.union([z.boolean(), z.number()]).optional(),
  address: z.string().optional(),
  hasLiveCam: z.union([z.boolean(), z.number()]).optional(),
  reviews: z.array(z.any()).optional()
});

const configSchema = z.object({
  deliveryFee: z.number().min(0).optional(),
  masterPin: z.string().min(4).max(10).optional()
});

const fcmTokenSchema = z.object({ token: z.string() });

function parseJsonField(value: any, fallback: any) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function normalizeHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function verifyPayMongoSignature(rawBody: string, signatureHeader: string | undefined) {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) return true;
  if (!signatureHeader) return false;
  const parts = signatureHeader
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  const entries = new Map<string, string>();
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    entries.set(part.slice(0, idx), part.slice(idx + 1));
  }

  const timestamp = entries.get('t') || '';
  const expectedRaw = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedTimed = timestamp
    ? createHmac('sha256', webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex')
    : '';

  const candidates = Array.from(entries.values()).filter(Boolean);
  return candidates.some(candidate => (
    constantTimeEquals(candidate, expectedRaw)
    || (expectedTimed ? constantTimeEquals(candidate, expectedTimed) : false)
  ));
}

async function payMongoRequest(path: string, payload?: any, method: 'POST' | 'GET' = 'POST', idempotencyKey?: string) {
  const secret = getPayMongoSecret();
  if (!secret) throw new Error('PayMongo secret is not configured');

  const auth = Buffer.from(`${secret}:`).toString('base64');
  const response = await fetch(`${PAYMONGO_API_BASE}${path}`, {
    method,
    headers: { // PayMongo API expects Basic Auth
      'Authorization': `Basic ${auth}`,
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      'Content-Type': 'application/json'
    },
    ...(method === 'POST' ? { body: JSON.stringify(payload || {}) } : {})
  });
  const text = await response.text();
  const data = text ? parseJsonField(text, {}) : {};
  if (!response.ok) { // PayMongo API returns 4xx/5xx for errors
    const details = data?.errors?.[0]?.detail || data?.errors?.[0]?.code || `HTTP ${response.status}`;
    throw new Error(`PayMongo error: ${details}`);
  }
  return data;
}

function mapPayMongoOrderMethod(sourceType?: string) {
  const value = (sourceType || '').toLowerCase();
  if (!value) return 'PAYMONGO';
  if (value.includes('gcash')) return 'GCASH';
  if (value.includes('paymaya') || value.includes('maya')) return 'MAYA';
  if (value.includes('master')) return 'MASTERCARD';
  if (value.includes('visa')) return 'VISA';
  if (value.includes('card')) return 'CARD';
  return value.toUpperCase();
}

function resolvePayMongoState(eventTypeRaw: string, statusRaw: string): 'SETTLED' | 'FAILED' | 'PENDING' {
  const eventType = eventTypeRaw.toLowerCase();
  const status = statusRaw.toLowerCase();
  if (
    eventType.includes('paid')
    || eventType.includes('succeed')
    || status === 'paid'
    || status === 'succeeded'
  ) {
    return 'SETTLED';
  }
  if (
    eventType.includes('failed')
    || eventType.includes('expired')
    || eventType.includes('cancel')
    || status === 'failed'
    || status === 'expired'
    || status === 'canceled'
    || status === 'cancelled'
  ) {
    return 'FAILED';
  }
  return 'PENDING';
}

async function resolveOrderContextFromReferences(db: any, references: string[]) {
  for (const reference of references) {
    if (!reference) continue;
    const result = await db.query('SELECT "ownerId", "orderId" FROM ledger WHERE "referenceId" = $1 ORDER BY timestamp DESC LIMIT 1', [reference]);
    const row = result.rows[0];
    if (row?.orderId) {
      return {
        orderId: String(row.orderId),
        email: String(row.ownerId || '').toLowerCase()
      };
    }
  }
  return { orderId: '', email: '' };
}

async function syncOrderPaymentState( // This function is used by both webhook and manual status check
  db: any,
  params: {
    orderId: string;
    status: 'SETTLED' | 'FAILED' | 'PENDING';
    email?: string;
    paymentId?: string;
    transactionId?: string;
    sourceType?: string;
    receiptUrl?: string;
  }
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const resExisting = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [params.orderId]);
    const existing = resExisting.rows[0];
    if (!existing) {
      await client.query('ROLLBACK');
      return null;
    }

    const refId = params.paymentId || params.transactionId;
    if (refId) {
      await client.query('UPDATE ledger SET status = $1 WHERE "referenceId" = $2 AND "orderId" = $3', [params.status, refId, params.orderId]);
    } // Note: idempotencyKey is used for initial ledger entry, not for status updates

    const ledgerRes = await client.query('SELECT SUM(amount) as settled FROM ledger WHERE "orderId" = $1 AND status = \'SETTLED\' AND type = \'DEBIT\'', [params.orderId]);
    const totalSettled = Number(ledgerRes.rows[0].settled || 0);
    const isFullyPaid = totalSettled >= Number(existing.total);

    const method = mapPayMongoOrderMethod(params.sourceType);
    const paymentId = params.paymentId || null;
    const transactionId = params.transactionId || params.paymentId || null;
    const receiptUrl = params.receiptUrl || null;

    await client.query(`UPDATE orders
      SET "isPaid" = $1,
          "amountPaid" = $2,
          "paymentId" = COALESCE($3, "paymentId"),
          "transactionId" = COALESCE($4, "transactionId"),
          "paymentMethod" = COALESCE(NULLIF("paymentMethod",''), $5),
          "receiptUrl" = COALESCE($6, "receiptUrl"),
          status = CASE WHEN $7 = 'FAILED' AND $1 = 0 AND status = 'PENDING' THEN 'CANCELLED' ELSE status END
      WHERE id = $8`, [
        isFullyPaid ? 1 : 0, 
        totalSettled, 
        paymentId, transactionId, method, receiptUrl, 
        params.status, params.orderId
      ]);

    const ownerEmail = (params.email || existing.customerEmail || '').toLowerCase();
    if (ownerEmail) {
      await client.query('UPDATE ledger SET status = $1 WHERE "ownerId" = $2 AND "orderId" = $3', [params.status, ownerEmail, params.orderId]);
    } else {
      await client.query('UPDATE ledger SET status = $1 WHERE "orderId" = $2', [params.status, params.orderId]);
    }

    await client.query('COMMIT');

    // After successful payment settlement, notify all participants
    if (params.status === 'SETTLED') {
      try {
        // Find everyone who has contributed to this order via the ledger
        const participantsRes = await client.query(
          'SELECT DISTINCT u."fcmToken", u.name FROM users u JOIN ledger l ON u.email = l."ownerId" WHERE l."orderId" = $1 AND u."fcmToken" IS NOT NULL',
          [params.orderId]
        );
        
        const remaining = Number(existing.total) - totalSettled;
        const message = remaining > 0 
          ? `A payment was made! ₱${remaining.toFixed(2)} remaining for order ${params.orderId}.`
          : `Order ${params.orderId} is now fully paid!`;

        // Integration point for Firebase Admin SDK or OneSignal
        participantsRes.rows.forEach(p => {
          logger.info(`[PushNotification] Sending to ${p.name} (${p.fcmToken}): ${message}`);
          // Example: admin.messaging().sendToDevice(p.fcmToken, { 
          //   notification: { title: 'Payment Update', body: message } 
          // });
        });
      } catch (pnErr) {
        logger.error('Failed to send push notifications:', pnErr);
      }
    }

    const finalResult = await client.query('SELECT * FROM orders WHERE id = $1', [params.orderId]);
    return finalResult.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function normalizeUser(row: any) {
  if (!row) return row;
  return {
    ...row,
    badges: parseJsonField(row.badges, []),
    manualsSeen: parseJsonField(row.manualsSeen, [])
  };
}

function normalizeOrder(row: any) {
  if (!row) return row;
  return {
    ...row,
    items: parseJsonField(row.items, [])
  };
}

function canAccessEmail(req: any, email: string) {
  const caller = (req.user?.email || '').toLowerCase();
  return caller === email.toLowerCase() || req.user?.role === 'ADMIN';
}

export function setupRoutes(app: Application) { // Main function to set up all API routes
  const db: any = getDb();

  app.use((req: any, res: any, next: any) => {
    const isPublicAuth = req.path.startsWith('/auth');
    const isPublicConfig = req.path === '/config' && req.method === 'GET';
    const isPublicRestaurants = req.path === '/restaurants' && req.method === 'GET';
    const isPublicPayMongoWebhook = req.path === '/webhooks/paymongo' && req.method === 'POST';
    const isPublicStripeWebhook = req.path === '/webhooks/stripe' && req.method === 'POST';
    if (isPublicAuth || isPublicConfig || isPublicRestaurants || isPublicPayMongoWebhook || isPublicStripeWebhook) return next();
    return authMiddleware(req as AuthRequest, res, next);
  });

  app.post('/auth/register', asyncHandler(async (req: Request, res: Response) => {
    const user = registerSchema.parse(req.body);
    const email = user.email.toLowerCase();
    const hashed = await hashPassword(user.password);

    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert the new user into the database
      await client.query(`
        INSERT INTO users (email, name, password, points, xp, level, streak, badges, "preferredCity", role, "merchantId", earnings, "manualsSeen")
        VALUES ($1, $2, $3, 500, 0, 1, 1, '[]', $4, $5, $6, 0, '[]')
      `, [email, user.name, hashed, user.preferredCity || null, user.role || 'CUSTOMER', user.merchantId || null]);

      // 2. Initialize Metadata: Record the 500 welcome points in the financial ledger
      await client.query(`
        INSERT INTO ledger ("ownerId", id, amount, type, description, timestamp, status, "methodType", "referenceId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [email, uuidv4(), 500, 'CREDIT', 'Welcome Gift Points', new Date().toISOString(), 'SETTLED', 'SYSTEM', 'WELCOME_PROMO']);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err; // Global handler in index.ts will catch this and send the error response
    } finally {
      client.release();
    }

    const token = generateToken({ 
      email, 
      role: user.role || 'CUSTOMER',
      name: user.name,
      merchantId: user.merchantId || null
    });
    res.json({ success: true, token });
  }));

  app.post('/auth/login', asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const normalized = normalizeUser(user);
    const token = generateToken({ 
      email: normalized.email.toLowerCase(), 
      role: normalized.role,
      name: normalized.name,
      merchantId: normalized.merchantId || null
    });
    res.json({ user: normalized, token });
  }));

  app.get('/users', asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query('SELECT * FROM users');
    res.json({ users: result.rows.map(normalizeUser) });
  }));

  app.get('/users/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user: normalizeUser(user) });
  }));

  app.put('/users/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const current = result.rows[0];
    if (!current) return res.status(404).json({ error: 'Not found' });

    const incoming = req.body || {};
    const merged = {
      ...current,
      ...incoming,
      email,
      badges: JSON.stringify(Array.isArray(incoming.badges) ? incoming.badges : parseJsonField(current.badges, [])),
      manualsSeen: JSON.stringify(Array.isArray(incoming.manualsSeen) ? incoming.manualsSeen : parseJsonField(current.manualsSeen, [])),
    };

    await db.query(`UPDATE users
      SET name=$1, avatar=$2, points=$3, xp=$4, level=$5, streak=$6,
          badges=$7, "preferredCity"=$8, role=$9, "merchantId"=$10,
          earnings=$11, "manualsSeen"=$12
      WHERE email=$13`, [
        merged.name, merged.avatar, merged.points, merged.xp, merged.level, merged.streak,
        merged.badges, merged.preferredCity, merged.role, merged.merchantId, merged.earnings, merged.manualsSeen, email
      ]);

    res.json({ user: normalizeUser(merged) });
  }));

  app.put('/users/:email/fcm-token', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const { token } = fcmTokenSchema.parse(req.body);
    await db.query('UPDATE users SET "fcmToken" = $1 WHERE email = $2', [token, email]);
    res.json({ success: true });
  }));

  app.get('/restaurants', asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query('SELECT * FROM restaurants');
    const restaurants = result.rows.map((r: any) => ({
      ...r,
      items: parseJsonField(r.items, []),
      reviews: parseJsonField(r.reviews, [])
    }));
    res.json({ restaurants });
  }));

  app.post('/restaurants', asyncHandler(async (req: Request, res: Response) => {
    const rest = restaurantSchema.parse(req.body);
    await db.query(`INSERT INTO restaurants (id,name,rating,"deliveryTime",image,cuisine,items,"isPartner",address,"hasLiveCam",reviews)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT(id) DO UPDATE SET
        name=EXCLUDED.name,
        rating=EXCLUDED.rating,
        "deliveryTime"=EXCLUDED."deliveryTime",
        image=EXCLUDED.image,
        cuisine=EXCLUDED.cuisine,
        items=EXCLUDED.items,
        "isPartner"=EXCLUDED."isPartner",
        address=EXCLUDED.address,
        "hasLiveCam"=EXCLUDED."hasLiveCam",
        reviews=EXCLUDED.reviews`, [
          rest.id, rest.name, rest.rating, rest.deliveryTime, rest.image, rest.cuisine, 
          JSON.stringify(rest.items || []), rest.isPartner ? 1 : 0, rest.address, rest.hasLiveCam ? 1 : 0, JSON.stringify(rest.reviews || [])
        ]);
    res.json({ success: true });
  }));

  app.post('/orders', asyncHandler(async (req: any, res: Response) => {
    const client = await db.connect();
    try {
      const o = orderSchema.parse(req.body);
      if (!o.id) o.id = `AYO-${Math.floor(Math.random() * 90000) + 10000}`;
      o.customerEmail = (req.user?.email || o.customerEmail || '').toLowerCase();

      await client.query('BEGIN');

      await client.query(`INSERT INTO orders (id,date,items,total,status,"restaurantName","customerEmail","customerName","riderName","riderEmail","deliveryAddress","tipAmount","pointsEarned","paymentMethod","paymentId","isPaid","transactionId",rating,comment,"receiptUrl")
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [
                    o.id, o.date, JSON.stringify(o.items || []), o.total, o.status, o.restaurantName, o.customerEmail, o.customerName, 
                    o.riderName || null, o.riderEmail || null, o.deliveryAddress, o.tipAmount || 0, o.pointsEarned || 0, 
                    o.paymentMethod || 'COD', o.paymentId || null, o.isPaid || 0, o.transactionId || null, o.rating || null, 
                    o.comment || null, o.receiptUrl || null
                  ]);

      await client.query('COMMIT');
      res.json({ success: true, order: o });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err; // Passed to global handler via asyncHandler
    } finally {
      client.release();
    }
  }));

  app.get('/orders/customer/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM orders WHERE "customerEmail" = $1 ORDER BY date DESC', [email]);
    res.json({ orders: result.rows.map(normalizeOrder) });
  }));

  app.get('/orders/merchant/:restaurantName', asyncHandler(async (_req: any, res: Response) => {
    const restaurantName = decodeURIComponent(_req.params.restaurantName || '');
    const result = await db.query("SELECT * FROM orders WHERE \"restaurantName\" = $1 AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY date DESC", [restaurantName]);
    res.json({ orders: result.rows.map(normalizeOrder) });
  }));

  app.get('/orders/market', asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query("SELECT * FROM orders WHERE status = 'READY_FOR_PICKUP' AND (\"riderEmail\" IS NULL OR \"riderEmail\" = '') ORDER BY date DESC");
    res.json({ orders: result.rows.map(normalizeOrder) });
  }));

  app.get('/orders/rider/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query("SELECT * FROM orders WHERE \"riderEmail\" = $1 AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY date DESC", [email]);
    res.json({ orders: result.rows.map(normalizeOrder) });
  }));

  app.get('/orders/live', asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query("SELECT * FROM orders WHERE status NOT IN ('DELIVERED','CANCELLED') ORDER BY date DESC");
    res.json({ orders: result.rows.map(normalizeOrder) });
  }));

  app.get('/orders/live/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query("SELECT * FROM orders WHERE \"customerEmail\" = $1 AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY date DESC LIMIT 1", [email]);
    if (result.rowCount === 0) return res.json({ order: null });
    res.json({ order: normalizeOrder(result.rows[0]) });
  }));

  app.put('/orders/:id/status', asyncHandler(async (req: any, res: Response) => {
    const id = req.params.id;
    const { status, ...extra } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    const current = result.rows[0];
    if (!current) return res.status(404).json({ error: 'Order not found' });

    const merged = { ...current, ...extra, status };
    await db.query(`UPDATE orders
      SET status=$1, "riderName"=$2, "riderEmail"=$3, "tipAmount"=$4,
          rating=$5, comment=$6, "transactionId"=$7, "receiptUrl"=$8
      WHERE id=$9`, [
        merged.status, merged.riderName || null, merged.riderEmail || null, merged.tipAmount || 0, 
        merged.rating || null, merged.comment || null, merged.transactionId || null, merged.receiptUrl || null, id
      ]);

    const normalized = normalizeOrder(merged);
    const io = req.app.get('io');
    io.to(`order_${id}`).emit('ORDER_UPDATED', normalized);

    res.json({ success: true, order: normalized });
  }));

  app.get('/addresses/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM addresses WHERE email = $1', [email]);
    res.json({ addresses: result.rows });
  }));

  app.post('/addresses/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const address = addressSchema.parse(req.body);
    await db.query(`INSERT INTO addresses (id,email,label,details,city,latitude,longitude,"distanceKm","deliveryFee")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label, details=EXCLUDED.details, city=EXCLUDED.city, latitude=EXCLUDED.latitude, longitude=EXCLUDED.longitude, "distanceKm"=EXCLUDED."distanceKm", "deliveryFee"=EXCLUDED."deliveryFee"`, [
        address.id, email, address.label, address.details, address.city, address.latitude, address.longitude, address.distanceKm, address.deliveryFee
      ]);
    res.json({ success: true });
  }));

  app.get('/payments/methods/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM payments WHERE email = $1', [email]);
    res.json({ payments: result.rows });
  }));

  app.post('/payments/methods/:email', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const method = paymentMethodSchema.parse(req.body);
    await db.query(`INSERT INTO payments (id,email,type,last4,expiry,"phoneNumber",balance,token)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(id) DO UPDATE SET
        type=EXCLUDED.type,
        last4=EXCLUDED.last4,
        expiry=EXCLUDED.expiry,
        "phoneNumber"=EXCLUDED."phoneNumber",
        balance=EXCLUDED.balance,
        token=EXCLUDED.token`, [
          method.id, email, method.type, method.last4 || null, method.expiry || null, method.phoneNumber || null, method.balance ?? 0, method.token || null
        ]);
    res.json({ success: true });
  }));

  app.put('/payments/methods/:email/:id/balance', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const id = req.params.id;
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const balance = Number(req.body?.balance || 0);
    await db.query('UPDATE payments SET balance = $1 WHERE id = $2 AND email = $3', [balance, id, email]);
    res.json({ success: true, balance });
  }));

  app.post('/payments/methods/:email/topup', asyncHandler(async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const { methodId, amount } = topUpSchema.parse(req.body);
    const result = await db.query('SELECT * FROM payments WHERE id = $1 AND email = $2', [methodId, email]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Method not found' });
    const pay = result.rows[0];
    const newBal = Number(pay.balance || 0) + amount;
    await db.query('UPDATE payments SET balance = $1 WHERE id = $2 AND email = $3', [newBal, methodId, email]);
    res.json({ success: true, balance: newBal });
  }));

  app.post('/payments/paymongo/checkout-session', asyncHandler(async (req: any, res: Response) => {
    const { email, orderId, amount, preferredType, idempotencyKey } = payMongoCheckoutSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const paymentMethodTypes = preferredType ? (PAYMONGO_METHODS[preferredType] || ['gcash', 'paymaya', 'card']) : ['gcash', 'paymaya', 'card'];
      const appBase = getAppBaseUrl();

      const payload = {
        data: {
          attributes: {
            billing: {
              name: email.split('@')[0],
              email
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [
              {
                currency: 'PHP',
                amount: Math.round(amount * 100),
                name: `Ayoo Order ${orderId}`,
                quantity: 1
              }
            ],
            payment_method_types: paymentMethodTypes,
            metadata: {
              orderId,
              customerEmail: email
            },
            success_url: `${appBase}/?paymongo=success&orderId=${encodeURIComponent(orderId)}`,
            cancel_url: `${appBase}/?paymongo=cancel&orderId=${encodeURIComponent(orderId)}`
          }
        }
      };

      const response: any = await payMongoRequest('/checkout_sessions', payload, 'POST', idempotencyKey);
      const checkout = response?.data || {};
      const checkoutId = checkout?.id || '';
      const checkoutUrl = checkout?.attributes?.checkout_url || '';
      if (!checkoutId || !checkoutUrl) {
        return res.status(502).json({ success: false, error: 'Missing checkout session URL from PayMongo' });
      }

      await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId","idempotencyKey",status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
          email.toLowerCase(), uuidv4(), amount, 'DEBIT', `PayMongo checkout created: ${orderId}`,
          new Date().toISOString(), orderId, preferredType || 'AUTO', checkoutId, idempotencyKey, 'PENDING'
        ]);

      return res.json({
        success: true,
        checkoutId,
        checkoutUrl,
        reference: checkoutId
      });
  }));

  app.post('/payments/paymongo/payment-intents', asyncHandler(async (req: any, res: Response) => {
      const { email, orderId, amount, preferredType, idempotencyKey } = payMongoPaymentIntentSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const paymentMethodAllowed = preferredType
        ? (PAYMONGO_METHODS[preferredType] || ['gcash', 'paymaya', 'card'])
        : ['gcash', 'paymaya', 'card'];

      const payload = {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            capture_type: 'automatic',
            payment_method_allowed: paymentMethodAllowed,
            description: `Ayoo Order ${orderId}`,
            statement_descriptor: 'AYOO DELIVERY',
            metadata: {
              orderId,
              customerEmail: email
            }
          }
        }
      };

      const response: any = await payMongoRequest('/payment_intents', payload, 'POST', idempotencyKey);
      const intent = response?.data || {};
      const intentId = intent?.id || '';
      const intentStatus = intent?.attributes?.status || '';
      const clientKey = intent?.attributes?.client_key || '';
      if (!intentId) {
        return res.status(502).json({ success: false, error: 'Missing payment intent id from PayMongo' });
      }

      await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId","idempotencyKey",status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
          email.toLowerCase(), uuidv4(), amount, 'DEBIT', `PayMongo intent created: ${orderId}`,
          new Date().toISOString(), orderId, preferredType || 'AUTO', intentId, idempotencyKey, 'PENDING'
        ]);

      res.json({
        success: true,
        intentId,
        clientKey,
        status: intentStatus,
        reference: intentId
      });
  }));

  app.post('/payments/paymongo/payment-methods', asyncHandler(async (req: any, res: Response) => {
      const { email, type, details, billing, metadata } = payMongoPaymentMethodCreateSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const payload: any = {
        data: {
          attributes: {
            type,
            details,
            metadata: {
              ...(metadata || {}),
              customerEmail: email
            }
          }
        }
      };
      if (billing) payload.data.attributes.billing = billing;

      const response: any = await payMongoRequest('/payment_methods', payload);
      const paymentMethod = response?.data || {};
      const methodId = paymentMethod?.id || '';
      if (!methodId) {
        return res.status(502).json({ success: false, error: 'Missing payment method id from PayMongo' });
      }

      res.json({
        success: true,
        paymentMethodId: methodId,
        type: paymentMethod?.attributes?.type || type,
        details: paymentMethod?.attributes?.details || details
      });
  }));

  app.post('/payments/paymongo/payment-intents/:intentId/attach', asyncHandler(async (req: any, res: Response) => {
      const intentId = req.params.intentId;
      const { email, orderId, paymentMethodId, clientKey } = payMongoAttachIntentSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const payload = {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            ...(clientKey ? { client_key: clientKey } : {}),
            return_url: `${getAppBaseUrl()}/?paymongo=return&orderId=${encodeURIComponent(orderId)}`
          }
        }
      };

      const response: any = await payMongoRequest(`/payment_intents/${intentId}/attach`, payload);
      const intent = response?.data || {};
      const attrs = intent?.attributes || {};
      const state = resolvePayMongoState('', String(attrs?.status || ''));
      const nextActionUrl = attrs?.next_action?.redirect?.url || '';
      const sourceType = attrs?.payment_method_allowed?.[0] || attrs?.payment_method?.type || '';

      const updated = await syncOrderPaymentState(db, {
        orderId,
        status: state,
        email,
        paymentId: intent?.id || intentId,
        transactionId: intent?.id || intentId,
        sourceType,
        receiptUrl: nextActionUrl || undefined
      });

      if (state === 'PENDING') {
        await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId",status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
            email.toLowerCase(), uuidv4(), Number(updated?.total || 0), 'DEBIT', `PayMongo intent attached: ${orderId}`,
            new Date().toISOString(), orderId, mapPayMongoOrderMethod(sourceType), intent?.id || intentId, 'PENDING'
          ]);
      }

      res.json({
        success: true,
        intentId: intent?.id || intentId,
        status: attrs?.status || 'unknown',
        nextActionUrl: nextActionUrl || null,
        order: updated ? normalizeOrder(updated) : null
      });
  }));

  app.get('/payments/paymongo/orders/:orderId/status', asyncHandler(async (req: any, res: Response) => {
      const orderId = String(req.params.orderId || '');
      const result = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      const order = result.rows[0];
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const email = String(order.customerEmail || '').toLowerCase();
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const paymentRef = String(order.paymentId || order.transactionId || order.paymentid || '').trim();
      if (!paymentRef || paymentRef === 'COD') {
        return res.json({ success: true, synced: false, state: 'NO_REFERENCE', order: normalizeOrder(order) });
      }

      let remote: any = null;
      if (paymentRef.startsWith('cs_')) {
        remote = await payMongoRequest(`/checkout_sessions/${paymentRef}`, undefined, 'GET');
      } else if (paymentRef.startsWith('pi_')) {
        remote = await payMongoRequest(`/payment_intents/${paymentRef}`, undefined, 'GET');
      } else if (paymentRef.startsWith('pay_')) {
        remote = await payMongoRequest(`/payments/${paymentRef}`, undefined, 'GET');
      } else {
        return res.json({ success: true, synced: false, state: 'UNSUPPORTED_REFERENCE', order: normalizeOrder(order) });
      }

      const resource = remote?.data || {};
      const attrs = resource?.attributes || {};
      const checkoutPayments = Array.isArray(attrs?.payments) ? attrs.payments : [];
      const checkoutPaid = checkoutPayments.find((p: any) => {
        const pStatus = String(p?.attributes?.status || p?.status || '').toLowerCase();
        return pStatus === 'paid' || pStatus === 'succeeded';
      });
      const remoteStatus = String(attrs?.status || (checkoutPaid ? 'paid' : '') || '').toLowerCase();
      const syncState = resolvePayMongoState('', remoteStatus);
      const paymentId = String(checkoutPaid?.id || resource?.id || paymentRef);
      const sourceType = String(
        checkoutPaid?.attributes?.source?.type
        || attrs?.source?.type
        || attrs?.payment_method_details?.type
        || attrs?.payment_method?.type
        || attrs?.payment_method_allowed?.[0]
        || ''
      );
      const receiptUrl = String(
        attrs?.next_action?.redirect?.url
        || attrs?.checkout_url
        || order.receiptUrl
        || ''
      );

      const updated = await syncOrderPaymentState(db, {
        orderId,
        status: syncState,
        email,
        paymentId,
        transactionId: paymentId,
        sourceType,
        receiptUrl
      });

      const io = req.app.get('io');
      if (updated) io.to(`order_${orderId}`).emit('ORDER_UPDATED', normalizeOrder(updated));

      res.json({
        success: true,
        synced: true,
        state: syncState,
        order: normalizeOrder(updated || order),
        remoteStatus
      });
  }));

  app.post('/webhooks/paymongo', asyncHandler(async (req: any, res: Response) => {
      const rawBody = req.rawBody || JSON.stringify(req.body || {});
      const signature = normalizeHeaderValue(
        (req.headers['x-paymongo-signature'] || req.headers['paymongo-signature']) as string | string[] | undefined
      );
      if (!verifyPayMongoSignature(rawBody, signature)) {
        return res.status(401).json({ received: false, error: 'Invalid PayMongo signature' });
      }

      const event = req.body?.data?.attributes || {};
      const eventType = String(event?.type || '');
      const resource = event?.data || {};
      const attrs = resource?.attributes || {};
      const metadata = attrs?.metadata || {};

      const fallbackOrderId = metadata.orderId || metadata.order_id || attrs?.description?.match(/AYO-\d+/)?.[0] || '';
      const fallbackEmail = String(metadata.customerEmail || metadata.customer_email || '').toLowerCase();
      const references = [
        String(resource?.id || ''),
        String(attrs?.checkout_session_id || ''),
        String(attrs?.payment_intent_id || ''),
        String(attrs?.payment_intent?.id || ''),
        String(attrs?.source?.id || ''),
        String(attrs?.reference_number || '')
      ].filter(Boolean);
      const fromLedger = await resolveOrderContextFromReferences(db, references);
      const orderId = fromLedger.orderId || fallbackOrderId;
      const email = fromLedger.email || fallbackEmail;

      if (!orderId || !email) {
        return res.json({ received: true, ignored: 'Missing orderId/email metadata' });
      }

      const checkoutPayments = Array.isArray(attrs?.payments) ? attrs.payments : [];
      const checkoutPaid = checkoutPayments.find((p: any) => {
        const pStatus = String(p?.attributes?.status || p?.status || '').toLowerCase();
        return pStatus === 'paid' || pStatus === 'succeeded';
      });
      const resourceStatus = String(attrs?.status || (checkoutPaid ? 'paid' : '') || '');
      const state = resolvePayMongoState(eventType, resourceStatus);
      const paymentId = String(checkoutPaid?.id || resource?.id || references[0] || '');
      const sourceType = String(
        checkoutPaid?.attributes?.source?.type
        || attrs?.source?.type
        || attrs?.payment_method_details?.type
        || attrs?.payment_method?.type
        || attrs?.payment_method_allowed?.[0]
        || ''
      );
      const receiptUrl = String(attrs?.next_action?.redirect?.url || attrs?.checkout_url || '');

      const updated = await syncOrderPaymentState(db, {
        orderId,
        status: state,
        email,
        paymentId,
        transactionId: paymentId,
        sourceType,
        receiptUrl
      });

      const io = req.app.get('io');
      if (updated) io.to(`order_${orderId}`).emit('ORDER_UPDATED', normalizeOrder(updated));

      res.json({ received: true });
  }));

  app.post('/webhooks/stripe', asyncHandler(async (req: any, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event: Stripe.Event;

    try {
      event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      logger.warn(`Stripe Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (orderId) {
      const state = event.type === 'payment_intent.succeeded' ? 'SETTLED' : 
                    event.type === 'payment_intent.payment_failed' ? 'FAILED' : null;

      if (state) {
        const updated = await syncOrderPaymentState(db, {
          orderId,
          status: state,
          paymentId: intent.id,
          transactionId: intent.id,
          sourceType: 'card'
        });

        const io = req.app.get('io');
        if (updated) io.to(`order_${orderId}`).emit('ORDER_UPDATED', normalizeOrder(updated));
        logger.info(`Stripe payment event ${event.type} for order: ${orderId}`);
      }
    }

    res.json({ received: true });
  }));

  app.post('/payments/process', asyncHandler(async (req: any, res: Response) => {
      const { email, methodId, amount, orderId, idempotencyKey } = paymentProcessSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      // Idempotency check: If a ledger entry with this key already exists and is settled/pending, return it.
      const existingLedgerEntry = await db.query('SELECT * FROM ledger WHERE "idempotencyKey" = $1 AND ("status" = \'SETTLED\' OR "status" = \'PENDING\') LIMIT 1', [idempotencyKey]);
      if (existingLedgerEntry.rowCount > 0) {
        const entry = existingLedgerEntry.rows[0];
        logger.info(`Idempotent request for order ${orderId} with key ${idempotencyKey} already processed. Returning existing result.`);
        // Depending on the payment method, you might need to fetch the clientSecret again for Stripe
        // or the checkoutUrl for PayMongo if the frontend needs it.
        // For simplicity, we'll return a success with the existing transaction ID.
        return res.json({ success: true, transactionId: entry.referenceId, reference: entry.referenceId, clientSecret: entry.clientSecret || undefined, pending: entry.status === 'PENDING' });
      }

      const resPay = await db.query('SELECT * FROM payments WHERE id = $1 AND email = $2', [methodId, email.toLowerCase()]);
      const pay = resPay.rows[0];
      if (!pay) return res.status(404).json({ success: false, error: 'Method not found' });

      if (['VISA', 'MASTERCARD'].includes(pay.type)) {
      const stripeSecret = getStripeSecret();
      if (!stripeSecret) return res.status(500).json({ success: false, error: 'Stripe not configured' }); // This should be caught by the global env check
      try {
          const intent = await createStripePaymentIntent(amount, 'php', orderId, idempotencyKey);
          const ref = intent.id;

          await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId","idempotencyKey",status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
              email.toLowerCase(), uuidv4(), amount, 'DEBIT', `Stripe: ${orderId}`,
              new Date().toISOString(), orderId, pay.type, ref, idempotencyKey, 'PENDING'
          return res.json({ 
            success: true, 
            transactionId: intent.id, 
            clientSecret: intent.client_secret, 
            reference: ref 
          });
        } catch (stripeErr: any) {
          return res.status(502).json({ success: false, error: stripeErr.message, reference: '' });
        }
      }

      if (pay.balance !== null && Number(pay.balance) < amount) {
        return res.json({ success: false, error: 'Insufficient funds', transactionId: '', reference: '' });
      }

      const txnId = `TXN-${uuidv4()}`;
      const ref = `AYO-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      const newBal = pay.balance !== null ? Number(pay.balance) - amount : null;
      await db.query('UPDATE payments SET balance = $1 WHERE id = $2 AND email = $3', [newBal, methodId, email]);
      await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId","idempotencyKey",status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
          email.toLowerCase(), uuidv4(), amount, 'DEBIT', `Checkout: ${orderId}`,
          new Date().toISOString(), orderId, pay.type, ref, idempotencyKey, 'SETTLED'
        ]);
      res.json({ success: true, transactionId: txnId, reference: ref });
  }));

  app.post('/payments/stripe', asyncHandler(async (req: Request, res: Response) => {
      const amount = Number((req.body as any)?.amount || 0);
      const source = (req.body as any)?.source || 'tok_visa';
      const description = (req.body as any)?.description || 'Ayoo charge';

      const stripeSecret = getStripeSecret();
      if (!stripeSecret) {
        const fakeId = `ch_local_${Math.random().toString(36).slice(2, 10)}`;
      return res.json({ success: true, charge: { id: fakeId, balance_transaction: fakeId } });
    }

      const charge = await stripeInstance.charges.create({
        amount: Math.round(amount * 100),
        currency: 'php',
        source,
        description
      });
      res.json({ success: true, charge });
  }));

  app.get('/ledger/:ownerId', asyncHandler(async (req: any, res: Response) => {
    const ownerId = req.params.ownerId.toLowerCase();
    if (!canAccessEmail(req, ownerId)) return res.status(403).json({ error: 'Forbidden' });
    const result = await db.query('SELECT * FROM ledger WHERE "ownerId" = $1 ORDER BY timestamp DESC', [ownerId]);
    res.json({ ledger: result.rows });
  }));

  app.post('/ledger/:ownerId', asyncHandler(async (req: any, res: Response) => {
    const ownerId = req.params.ownerId.toLowerCase();
    if (!canAccessEmail(req, ownerId)) return res.status(403).json({ error: 'Forbidden' });
    const entry = ledgerSchema.parse(req.body); // idempotencyKey is optional in schema, but should be present for payment attempts
    await db.query(`INSERT INTO ledger ("ownerId",id,amount,type,description,timestamp,"orderId","methodType","referenceId","idempotencyKey",status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
        ownerId, entry.id, entry.amount, entry.type, entry.description, entry.timestamp, entry.orderId, entry.methodType, entry.referenceId, entry.idempotencyKey || null, entry.status
      ]);
    res.json({ success: true });
  }));

  app.get('/config', asyncHandler(async (_req: Request, res: Response) => {
    const result = await db.query('SELECT "deliveryFee", "masterPin" FROM system_config WHERE id = 1');
    const row = result.rows[0];
    res.json({
      deliveryFee: row?.deliveryFee ?? row?.deliveryfee ?? 45,
      masterPin: row?.masterPin ?? row?.masterpin ?? '1234'
    });
  }));

  app.put('/config', asyncHandler(async (req: Request, res: Response) => {
    const payload = configSchema.parse(req.body || {});
    const result = await db.query('SELECT "deliveryFee", "masterPin" FROM system_config WHERE id = 1');
    const current = result.rows[0] || { deliveryFee: 45, masterPin: '1234' };
    
    await db.query('UPDATE system_config SET "deliveryFee" = $1, "masterPin" = $2 WHERE id = 1', [
      payload.deliveryFee ?? (current.deliveryFee || current.deliveryfee),
      payload.masterPin ?? (current.masterPin || current.masterpin)
    ]);
    res.json({ success: true });
  }));

  // Chat History
  app.get('/orders/:id/messages', asyncHandler(async (req: any, res: Response) => {
      const orderId = req.params.id;
      const order = await db.query('SELECT "customerEmail", "riderEmail" FROM orders WHERE id = $1', [orderId]);
      
      if (order.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
      const o = order.rows[0];
      if (req.user.email !== o.customeremail && req.user.email !== o.rideremail && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const result = await db.query(
        'SELECT id, "orderId" as "conversationId", "senderEmail", "senderName", text, timestamp, "isRead" as read FROM messages WHERE "orderId" = $1 ORDER BY timestamp ASC',
        [orderId]
      );
      
      // Map integer isRead to boolean read
      const messages = result.rows.map((m: any) => ({ ...m, read: Boolean(m.read) }));
      res.json({ messages });
  }));

  // Mark messages as read
  app.put('/orders/:id/messages/read', asyncHandler(async (req: any, res: Response) => {
      const orderId = req.params.id;
      const email = req.user.email;
      const pool = getDb();
      
      await pool.query(
        'UPDATE messages SET "isRead" = 1 WHERE "orderId" = $1 AND "senderEmail" != $2 AND "isRead" = 0',
        [orderId, email]
      );
      
      res.json({ success: true });
  }));
}
