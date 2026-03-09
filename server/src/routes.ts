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
  AuthRequest
} from './auth.js';

declare const process: {
  env: {
    STRIPE_SECRET?: string;
    STRIPE_SECRET_KEY?: string;
    PAYMONGO_SECRET_KEY?: string;
    PAYMONGO_WEBHOOK_SECRET?: string;
    APP_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};

const getStripeSecret = () => process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
const getPayMongoSecret = () => process.env.PAYMONGO_SECRET_KEY;
const getAppBaseUrl = () => process.env.APP_BASE_URL || 'http://localhost:5173';
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
  orderId: z.string()
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
  referenceId: z.string(),
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

async function payMongoRequest(path: string, payload?: any, method: 'POST' | 'GET' = 'POST') {
  const secret = getPayMongoSecret();
  if (!secret) throw new Error('PayMongo secret is not configured');

  const auth = Buffer.from(`${secret}:`).toString('base64');
  const response = await fetch(`${PAYMONGO_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    ...(method === 'POST' ? { body: JSON.stringify(payload || {}) } : {})
  });
  const text = await response.text();
  const data = text ? parseJsonField(text, {}) : {};
  if (!response.ok) {
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

function resolveOrderContextFromReferences(db: any, references: string[]) {
  for (const reference of references) {
    if (!reference) continue;
    const row = db.prepare('SELECT ownerId, orderId FROM ledger WHERE referenceId = ? ORDER BY timestamp DESC LIMIT 1').get(reference);
    if (row?.orderId) {
      return {
        orderId: String(row.orderId),
        email: String(row.ownerId || '').toLowerCase()
      };
    }
  }
  return { orderId: '', email: '' };
}

function syncOrderPaymentState(
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
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.orderId);
  if (!existing) return null;

  const method = mapPayMongoOrderMethod(params.sourceType);
  const paymentId = params.paymentId || null;
  const transactionId = params.transactionId || params.paymentId || null;
  const receiptUrl = params.receiptUrl || null;

  if (params.status === 'SETTLED') {
    db.prepare(`UPDATE orders
      SET isPaid = 1,
          paymentId = COALESCE(?, paymentId),
          transactionId = COALESCE(?, transactionId),
          paymentMethod = COALESCE(NULLIF(paymentMethod,''), ?),
          receiptUrl = COALESCE(?, receiptUrl)
      WHERE id = ?`).run(paymentId, transactionId, method, receiptUrl, params.orderId);
  } else if (params.status === 'FAILED') {
    db.prepare(`UPDATE orders
      SET isPaid = 0,
          paymentId = COALESCE(?, paymentId),
          transactionId = COALESCE(?, transactionId),
          paymentMethod = COALESCE(NULLIF(paymentMethod,''), ?),
          status = CASE WHEN status = 'PENDING' THEN 'CANCELLED' ELSE status END,
          receiptUrl = COALESCE(?, receiptUrl)
      WHERE id = ?`).run(paymentId, transactionId, method, receiptUrl, params.orderId);
  } else {
    db.prepare(`UPDATE orders
      SET paymentId = COALESCE(?, paymentId),
          paymentMethod = COALESCE(NULLIF(paymentMethod,''), ?),
          receiptUrl = COALESCE(?, receiptUrl)
      WHERE id = ?`).run(paymentId, method, receiptUrl, params.orderId);
  }

  const ownerEmail = (params.email || existing.customerEmail || '').toLowerCase();
  if (ownerEmail) {
    db.prepare('UPDATE ledger SET status = ? WHERE ownerId = ? AND orderId = ?').run(params.status, ownerEmail, params.orderId);
  } else {
    db.prepare('UPDATE ledger SET status = ? WHERE orderId = ?').run(params.status, params.orderId);
  }

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(params.orderId);
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

export function setupRoutes(app: Application) {
  const db: any = getDb();

  app.use((req: any, res: any, next: any) => {
    const isPublicAuth = req.path.startsWith('/auth');
    const isPublicConfig = req.path === '/config' && req.method === 'GET';
    const isPublicRestaurants = req.path === '/restaurants' && req.method === 'GET';
    const isPublicPayMongoWebhook = req.path === '/webhooks/paymongo' && req.method === 'POST';
    if (isPublicAuth || isPublicConfig || isPublicRestaurants || isPublicPayMongoWebhook) return next();
    return authMiddleware(req as AuthRequest, res, next);
  });

  app.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const user = registerSchema.parse(req.body);
      const email = user.email.toLowerCase();
      const existing = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
      if (existing) return res.status(409).json({ error: 'Email already exists' });

      const hashed = await hashPassword(user.password);
      db.prepare(`INSERT INTO users (email,name,password,points,xp,level,streak,badges,preferredCity,role,merchantId,earnings,manualsSeen)
                  VALUES (@email,@name,@password,500,0,1,1,'[]',@preferredCity,@role,@merchantId,0,'[]')`).run({
        email,
        name: user.name,
        password: hashed,
        preferredCity: user.preferredCity || null,
        role: user.role || 'CUSTOMER',
        merchantId: user.merchantId || null
      });

      const token = generateToken({ email, role: user.role || 'CUSTOMER' });
      res.json({ success: true, token });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await comparePassword(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const normalized = normalizeUser(user);
      const token = generateToken({ email: normalized.email.toLowerCase(), role: normalized.role });
      res.json({ user: normalized, token });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Login failed' });
    }
  });

  app.get('/users', (_req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM users').all();
    res.json({ users: rows.map(normalizeUser) });
  });

  app.get('/users/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user: normalizeUser(user) });
  });

  app.put('/users/:email', async (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const current = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!current) return res.status(404).json({ error: 'Not found' });

    const incoming = req.body || {};

    // Handle password update - hash the new password
    let hashedPassword = current.password;
    if (incoming.password && incoming.password.length >= 6) {
      hashedPassword = await hashPassword(incoming.password);
    } else if (incoming.password && incoming.password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const merged = {
      ...current,
      ...incoming,
      email,
      password: hashedPassword,
      badges: JSON.stringify(Array.isArray(incoming.badges) ? incoming.badges : parseJsonField(current.badges, [])),
      manualsSeen: JSON.stringify(Array.isArray(incoming.manualsSeen) ? incoming.manualsSeen : parseJsonField(current.manualsSeen, [])),
    };

    db.prepare(`UPDATE users
      SET name=@name, avatar=@avatar, password=@password, points=@points, xp=@xp, level=@level, streak=@streak,
          badges=@badges, preferredCity=@preferredCity, role=@role, merchantId=@merchantId,
          earnings=@earnings, manualsSeen=@manualsSeen
      WHERE email=@email`).run(merged);

    res.json({ user: normalizeUser(merged) });
  });

  app.get('/restaurants', (_req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM restaurants').all();
    const restaurants = rows.map((r: any) => ({
      ...r,
      items: parseJsonField(r.items, []),
      reviews: parseJsonField(r.reviews, [])
    }));
    res.json({ restaurants });
  });

  app.post('/restaurants', (req: Request, res: Response) => {
    try {
      const rest = restaurantSchema.parse(req.body);
      db.prepare(`INSERT INTO restaurants (id,name,rating,deliveryTime,image,cuisine,items,isPartner,address,hasLiveCam,reviews)
        VALUES (@id,@name,@rating,@deliveryTime,@image,@cuisine,@items,@isPartner,@address,@hasLiveCam,@reviews)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          rating=excluded.rating,
          deliveryTime=excluded.deliveryTime,
          image=excluded.image,
          cuisine=excluded.cuisine,
          items=excluded.items,
          isPartner=excluded.isPartner,
          address=excluded.address,
          hasLiveCam=excluded.hasLiveCam,
          reviews=excluded.reviews`).run({
        ...rest,
        items: JSON.stringify(rest.items || []),
        reviews: JSON.stringify(rest.reviews || []),
        isPartner: rest.isPartner ? 1 : 0,
        hasLiveCam: rest.hasLiveCam ? 1 : 0
      });
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Restaurant upsert failed' });
    }
  });

  app.post('/orders', (req: any, res: Response) => {
    try {
      const o = orderSchema.parse(req.body);
      if (!o.id) o.id = `AYO-${Math.floor(Math.random() * 90000) + 10000}`;
      o.customerEmail = (req.user?.email || o.customerEmail || '').toLowerCase();

      db.prepare(`INSERT INTO orders (id,date,items,total,status,restaurantName,customerEmail,customerName,riderName,riderEmail,deliveryAddress,tipAmount,pointsEarned,paymentMethod,paymentId,isPaid,transactionId,rating,comment,receiptUrl)
                  VALUES (@id,@date,@items,@total,@status,@restaurantName,@customerEmail,@customerName,@riderName,@riderEmail,@deliveryAddress,@tipAmount,@pointsEarned,@paymentMethod,@paymentId,@isPaid,@transactionId,@rating,@comment,@receiptUrl)`).run({
        ...o,
        items: JSON.stringify(o.items || []),
        riderName: o.riderName || null,
        riderEmail: o.riderEmail || null,
        tipAmount: o.tipAmount || 0,
        pointsEarned: o.pointsEarned || 0,
        paymentMethod: o.paymentMethod || 'COD',
        paymentId: o.paymentId || null,
        isPaid: o.isPaid || 0,
        transactionId: o.transactionId || null,
        rating: o.rating || null,
        comment: o.comment || null,
        receiptUrl: o.receiptUrl || null
      });
      res.json({ success: true, order: o });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Order creation failed' });
    }
  });

  app.get('/orders/customer/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM orders WHERE customerEmail = ? ORDER BY rowid DESC').all(email);
    res.json({ orders: rows.map(normalizeOrder) });
  });

  app.get('/orders/merchant/:restaurantName', (_req: any, res: Response) => {
    const restaurantName = decodeURIComponent(_req.params.restaurantName || '');
    const rows = db.prepare("SELECT * FROM orders WHERE restaurantName = ? AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY rowid DESC").all(restaurantName);
    res.json({ orders: rows.map(normalizeOrder) });
  });

  app.get('/orders/market', (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM orders WHERE status = 'READY_FOR_PICKUP' AND (riderEmail IS NULL OR riderEmail = '') ORDER BY rowid DESC").all();
    res.json({ orders: rows.map(normalizeOrder) });
  });

  app.get('/orders/rider/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare("SELECT * FROM orders WHERE riderEmail = ? AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY rowid DESC").all(email);
    res.json({ orders: rows.map(normalizeOrder) });
  });

  app.get('/orders/live', (_req: Request, res: Response) => {
    const rows = db.prepare("SELECT * FROM orders WHERE status NOT IN ('DELIVERED','CANCELLED') ORDER BY rowid DESC").all();
    res.json({ orders: rows.map(normalizeOrder) });
  });

  app.get('/orders/live/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const row = db.prepare("SELECT * FROM orders WHERE customerEmail = ? AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY rowid DESC LIMIT 1").get(email);
    if (!row) return res.json({ order: null });
    res.json({ order: normalizeOrder(row) });
  });

  app.put('/orders/:id/status', (req: Request, res: Response) => {
    const id = req.params.id;
    const { status, ...extra } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Order not found' });

    const merged = { ...current, ...extra, status };
    db.prepare(`UPDATE orders
      SET status=@status, riderName=@riderName, riderEmail=@riderEmail, tipAmount=@tipAmount,
          rating=@rating, comment=@comment, transactionId=@transactionId, receiptUrl=@receiptUrl
      WHERE id=@id`).run({
      ...merged,
      riderName: merged.riderName || null,
      riderEmail: merged.riderEmail || null,
      tipAmount: merged.tipAmount || 0,
      rating: merged.rating || null,
      comment: merged.comment || null,
      transactionId: merged.transactionId || null,
      receiptUrl: merged.receiptUrl || null
    });

    res.json({ success: true, order: normalizeOrder(merged) });
  });

  app.get('/addresses/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM addresses WHERE email = ? ORDER BY rowid DESC').all(email);
    res.json({ addresses: rows });
  });

  app.post('/addresses/:email', (req: any, res: Response) => {
    try {
      const email = req.params.email.toLowerCase();
      if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
      const address = addressSchema.parse(req.body);
      db.prepare(`INSERT INTO addresses (id,email,label,details,city,latitude,longitude,distanceKm,deliveryFee)
        VALUES (@id,@email,@label,@details,@city,@latitude,@longitude,@distanceKm,@deliveryFee)
        ON CONFLICT(id) DO UPDATE SET label=excluded.label, details=excluded.details, city=excluded.city, latitude=excluded.latitude, longitude=excluded.longitude, distanceKm=excluded.distanceKm, deliveryFee=excluded.deliveryFee`).run({
        ...address,
        email
      });
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Address save failed' });
    }
  });

  app.get('/payments/methods/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM payments WHERE email = ? ORDER BY rowid DESC').all(email);
    res.json({ payments: rows });
  });

  app.post('/payments/methods/:email', (req: any, res: Response) => {
    try {
      const email = req.params.email.toLowerCase();
      if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
      const method = paymentMethodSchema.parse(req.body);
      db.prepare(`INSERT INTO payments (id,email,type,last4,expiry,phoneNumber,balance,token)
        VALUES (@id,@email,@type,@last4,@expiry,@phoneNumber,@balance,@token)
        ON CONFLICT(id) DO UPDATE SET
          type=excluded.type,
          last4=excluded.last4,
          expiry=excluded.expiry,
          phoneNumber=excluded.phoneNumber,
          balance=excluded.balance,
          token=excluded.token`).run({
        ...method,
        email,
        balance: method.balance ?? 0,
        last4: method.last4 || null,
        expiry: method.expiry || null,
        phoneNumber: method.phoneNumber || null,
        token: method.token || null
      });
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Payment method save failed' });
    }
  });

  app.put('/payments/methods/:email/:id/balance', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const id = req.params.id;
    if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
    const balance = Number(req.body?.balance || 0);
    db.prepare('UPDATE payments SET balance = ? WHERE id = ? AND email = ?').run(balance, id, email);
    res.json({ success: true, balance });
  });

  app.post('/payments/methods/:email/topup', (req: any, res: Response) => {
    try {
      const email = req.params.email.toLowerCase();
      if (!canAccessEmail(req, email)) return res.status(403).json({ error: 'Forbidden' });
      const { methodId, amount } = topUpSchema.parse(req.body);
      const pay = db.prepare('SELECT * FROM payments WHERE id = ? AND email = ?').get(methodId, email);
      if (!pay) return res.status(404).json({ error: 'Method not found' });
      const newBal = Number(pay.balance || 0) + amount;
      db.prepare('UPDATE payments SET balance = ? WHERE id = ? AND email = ?').run(newBal, methodId, email);
      res.json({ success: true, balance: newBal });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Top-up failed' });
    }
  });

  app.post('/payments/paymongo/checkout-session', async (req: any, res: Response) => {
    try {
      const { email, orderId, amount, preferredType } = payMongoCheckoutSchema.parse(req.body);
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

      const response: any = await payMongoRequest('/checkout_sessions', payload);
      const checkout = response?.data || {};
      const checkoutId = checkout?.id || '';
      const checkoutUrl = checkout?.attributes?.checkout_url || '';
      if (!checkoutId || !checkoutUrl) {
        return res.status(502).json({ success: false, error: 'Missing checkout session URL from PayMongo' });
      }

      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
        VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
        ownerId: email.toLowerCase(),
        id: uuidv4(),
        amount,
        type: 'DEBIT',
        description: `PayMongo checkout created: ${orderId}`,
        timestamp: new Date().toISOString(),
        orderId,
        methodType: preferredType || 'AUTO',
        referenceId: checkoutId,
        status: 'PENDING'
      });

      res.json({
        success: true,
        checkoutId,
        checkoutUrl,
        reference: checkoutId
      });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
      res.status(500).json({ success: false, error: err.message || 'PayMongo checkout creation failed' });
    }
  });

  app.post('/payments/paymongo/payment-intents', async (req: any, res: Response) => {
    try {
      const { email, orderId, amount, preferredType } = payMongoPaymentIntentSchema.parse(req.body);
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

      const response: any = await payMongoRequest('/payment_intents', payload);
      const intent = response?.data || {};
      const intentId = intent?.id || '';
      const intentStatus = intent?.attributes?.status || '';
      const clientKey = intent?.attributes?.client_key || '';
      if (!intentId) {
        return res.status(502).json({ success: false, error: 'Missing payment intent id from PayMongo' });
      }

      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
        VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
        ownerId: email.toLowerCase(),
        id: uuidv4(),
        amount,
        type: 'DEBIT',
        description: `PayMongo intent created: ${orderId}`,
        timestamp: new Date().toISOString(),
        orderId,
        methodType: preferredType || 'AUTO',
        referenceId: intentId,
        status: 'PENDING'
      });

      res.json({
        success: true,
        intentId,
        clientKey,
        status: intentStatus,
        reference: intentId
      });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
      res.status(500).json({ success: false, error: err.message || 'PayMongo payment intent creation failed' });
    }
  });

  app.post('/payments/paymongo/payment-methods', async (req: any, res: Response) => {
    try {
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
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
      res.status(500).json({ success: false, error: err.message || 'PayMongo payment method creation failed' });
    }
  });

  app.post('/payments/paymongo/payment-intents/:intentId/attach', async (req: any, res: Response) => {
    try {
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

      const updated = syncOrderPaymentState(db, {
        orderId,
        status: state,
        email,
        paymentId: intent?.id || intentId,
        transactionId: intent?.id || intentId,
        sourceType,
        receiptUrl: nextActionUrl || undefined
      });

      if (state === 'PENDING') {
        db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
          VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
          ownerId: email.toLowerCase(),
          id: uuidv4(),
          amount: Number(updated?.total || 0),
          type: 'DEBIT',
          description: `PayMongo intent attached: ${orderId}`,
          timestamp: new Date().toISOString(),
          orderId,
          methodType: mapPayMongoOrderMethod(sourceType),
          referenceId: intent?.id || intentId,
          status: 'PENDING'
        });
      }

      res.json({
        success: true,
        intentId: intent?.id || intentId,
        status: attrs?.status || 'unknown',
        nextActionUrl: nextActionUrl || null,
        order: updated ? normalizeOrder(updated) : null
      });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
      res.status(500).json({ success: false, error: err.message || 'PayMongo attach payment intent failed' });
    }
  });

  app.get('/payments/paymongo/orders/:orderId/status', async (req: any, res: Response) => {
    try {
      const orderId = String(req.params.orderId || '');
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const email = String(order.customerEmail || '').toLowerCase();
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const paymentRef = String(order.paymentId || order.transactionId || '').trim();
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

      const updated = syncOrderPaymentState(db, {
        orderId,
        status: syncState,
        email,
        paymentId,
        transactionId: paymentId,
        sourceType,
        receiptUrl
      });

      res.json({
        success: true,
        synced: true,
        state: syncState,
        order: normalizeOrder(updated || order),
        remoteStatus
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'PayMongo order sync failed' });
    }
  });

  app.post('/webhooks/paymongo', (req: any, res: Response) => {
    try {
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
      const fromLedger = resolveOrderContextFromReferences(db, references);
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

      syncOrderPaymentState(db, {
        orderId,
        status: state,
        email,
        paymentId,
        transactionId: paymentId,
        sourceType,
        receiptUrl
      });

      res.json({ received: true });
    } catch (err: any) {
      res.status(500).json({ received: false, error: err.message || 'Webhook processing failed' });
    }
  });

  app.post('/payments/process', async (req: any, res: Response) => {
    try {
      const { email, methodId, amount, orderId } = paymentProcessSchema.parse(req.body);
      if (!canAccessEmail(req, email)) return res.status(403).json({ success: false, error: 'Forbidden' });

      const pay = db.prepare('SELECT * FROM payments WHERE id = ? AND email = ?').get(methodId, email.toLowerCase());
      if (!pay) return res.status(404).json({ success: false, error: 'Method not found' });

      if (['VISA', 'MASTERCARD'].includes(pay.type)) {
        const stripeSecret = getStripeSecret();
        if (!stripeSecret) return res.status(500).json({ success: false, error: 'Stripe not configured' });
        try {
          const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' as any });
          const charge = await stripe.charges.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            source: pay.token || 'tok_visa',
            description: `Order ${orderId}`
          });
          const ref = (charge.balance_transaction || charge.id) as string;
          db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
            VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
            ownerId: email.toLowerCase(),
            id: uuidv4(),
            amount,
            type: 'DEBIT',
            description: `Stripe: ${orderId}`,
            timestamp: new Date().toISOString(),
            orderId,
            methodType: pay.type,
            referenceId: ref,
            status: 'SETTLED'
          });
          return res.json({ success: true, transactionId: charge.id, reference: ref });
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
      db.prepare('UPDATE payments SET balance = ? WHERE id = ?').run(newBal, methodId);
      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
        VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
        ownerId: email.toLowerCase(),
        id: uuidv4(),
        amount,
        type: 'DEBIT',
        description: `Checkout: ${orderId}`,
        timestamp: new Date().toISOString(),
        orderId,
        methodType: pay.type,
        referenceId: ref,
        status: 'SETTLED'
      });
      res.json({ success: true, transactionId: txnId, reference: ref });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors, transactionId: '', reference: '' });
      res.status(500).json({ success: false, error: 'Internal payment error', transactionId: '', reference: '' });
    }
  });

  app.post('/payments/stripe', async (req: Request, res: Response) => {
    try {
      const amount = Number((req.body as any)?.amount || 0);
      const source = (req.body as any)?.source || 'tok_visa';
      const description = (req.body as any)?.description || 'Ayoo charge';

      const stripeSecret = getStripeSecret();
      if (!stripeSecret) {
        const fakeId = `ch_local_${Math.random().toString(36).slice(2, 10)}`;
        return res.json({ success: true, charge: { id: fakeId, balance_transaction: fakeId } });
      }

      const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' as any });
      const charge = await stripe.charges.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        source,
        description
      });
      res.json({ success: true, charge });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Stripe charge failed' });
    }
  });

  app.get('/ledger/:ownerId', (req: any, res: Response) => {
    const ownerId = req.params.ownerId.toLowerCase();
    if (!canAccessEmail(req, ownerId)) return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM ledger WHERE ownerId = ? ORDER BY timestamp DESC').all(ownerId);
    res.json({ ledger: rows });
  });

  app.post('/ledger/:ownerId', (req: any, res: Response) => {
    try {
      const ownerId = req.params.ownerId.toLowerCase();
      if (!canAccessEmail(req, ownerId)) return res.status(403).json({ error: 'Forbidden' });
      const entry = ledgerSchema.parse(req.body);
      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
        VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run({
        ...entry,
        ownerId
      });
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Ledger insert failed' });
    }
  });

  app.get('/config', (_req: Request, res: Response) => {
    const row = db.prepare('SELECT deliveryFee, masterPin FROM system_config WHERE id = 1').get();
    res.json({
      deliveryFee: row?.deliveryFee ?? 45,
      masterPin: row?.masterPin ?? '1234'
    });
  });

  app.put('/config', (req: Request, res: Response) => {
    try {
      const payload = configSchema.parse(req.body || {});
      const current = db.prepare('SELECT deliveryFee, masterPin FROM system_config WHERE id = 1').get() || { deliveryFee: 45, masterPin: '1234' };
      db.prepare('UPDATE system_config SET deliveryFee = ?, masterPin = ? WHERE id = 1').run(
        payload.deliveryFee ?? current.deliveryFee,
        payload.masterPin ?? current.masterPin
      );
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Config update failed' });
    }
  });
}
