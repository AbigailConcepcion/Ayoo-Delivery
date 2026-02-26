import { Application, Request, Response } from 'express';

declare function require(name: string): any;

declare const process: any;

// load db util dynamically (avoid TS confusion with client db.ts)
const { getDb }: any = require('./db');
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthRequest } from './auth';
import { z } from 'zod';

// stripe may not exist in this environment; types stubbed in shims
import Stripe from 'stripe';

// validation schemas
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
  deliveryAddress: z.string(),
  pointsEarned: z.number().optional(),
  paymentMethod: z.string().optional(),
  isPaid: z.number().optional(),
  paymentId: z.string().nullable().optional()
});

const paymentProcessSchema = z.object({
  email: z.string().email(),
  methodId: z.string(),
  amount: z.number(),
  orderId: z.string()
});

const payOrderSchema = z.object({
  method: z.string(),
  transactionId: z.string().optional()
});

const topUpSchema = z.object({
  methodId: z.string(),
  amount: z.number().min(0)
});

export function setupRoutes(app: Application) {
  // lazy-init database
  const db: any = getDb();

  // enforce authentication for all endpoints except auth and config
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/auth') || req.path === '/config') {
      return next();
    }
    return authMiddleware(req as AuthRequest, res, next);
  });

  // --- auth ---
  app.post('/auth/register', async (req: Request, res: Response) => {
    const user = req.body;
    if (!user.email || !user.name || !user.password) {
      return res.status(400).json({ error: 'missing fields' });
    }
    const stmt = db.prepare('SELECT email FROM users WHERE email = ?');
    const existing = stmt.get(user.email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    const hashed = await hashPassword(user.password);
    db.prepare(`INSERT INTO users (email,name,password,points,xp,level,streak,badges,preferredCity,role,merchantId,earnings,manualsSeen)
                VALUES (@email,@name,@password,0,0,1,0,'[]',@preferredCity,@role,@merchantId,0,'[]')`).run({
      email: user.email.toLowerCase(),
      name: user.name,
      password: hashed,
      preferredCity: user.preferredCity || null,
      role: user.role || 'CUSTOMER',
      merchantId: user.merchantId || null
    });
    const token = generateToken({ email: user.email.toLowerCase(), role: user.role || 'CUSTOMER' });
    res.json({ success: true, token });
  });

  app.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = generateToken({ email: user.email.toLowerCase(), role: user.role });
      res.json({ user, token });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: err.errors });
      }
      throw err;
    }
  });

  // --- users ---
  app.get('/users', (req: any, res: Response) => {
    // only admin may view the full registry
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM users').all();
    res.json({ users: rows });
  });

  app.get('/users/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  });

  app.put('/users/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updates = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const newData = { ...user, ...updates };
    db.prepare(`UPDATE users SET name=@name, avatar=@avatar, points=@points, xp=@xp, level=@level, streak=@streak, badges=@badges, preferredCity=@preferredCity, role=@role, merchantId=@merchantId, earnings=@earnings, manualsSeen=@manualsSeen WHERE email=@email`).run(newData);
    res.json({ user: newData });
  });

  // --- restaurants ---
  app.get('/restaurants', (req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM restaurants').all();
    const restaurants = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items || '[]'), reviews: JSON.parse(r.reviews || '[]') }));
    res.json({ restaurants });
  });

  app.post('/restaurants', (req: Request, res: Response) => {
    const r = req.body;
    r.id = r.id || uuidv4();
    db.prepare(`INSERT OR REPLACE INTO restaurants (id,name,rating,deliveryTime,image,cuisine,items,isPartner,address,hasLiveCam,reviews)
                VALUES (@id,@name,@rating,@deliveryTime,@image,@cuisine,@items,@isPartner,@address,@hasLiveCam,@reviews)`).run({
      ...r,
      items: JSON.stringify(r.items || []),
      reviews: JSON.stringify(r.reviews || [])
    });
    res.json({ success: true, restaurant: r });
  });

  // --- orders ---
  app.post('/orders', (req: any, res: Response) => {
    try {
      const o = orderSchema.parse(req.body);
      if (!o.id) o.id = `AYO-${Math.floor(Math.random() * 90000) + 10000}`;
      // override customer email with authenticated user
      o.customerEmail = req.user?.email;
      db.prepare(`INSERT INTO orders (id,date,items,total,status,restaurantName,customerEmail,customerName,deliveryAddress,pointsEarned,paymentMethod,paymentId,isPaid,transactionId)
                  VALUES (@id,@date,@items,@total,@status,@restaurantName,@customerEmail,@customerName,@deliveryAddress,@pointsEarned,@paymentMethod,@paymentId,@isPaid,@transactionId)`).run({
        ...o,
        items: JSON.stringify(o.items || []),
        paymentMethod: o.paymentMethod || null,
        paymentId: o.paymentId || null,
        isPaid: o.isPaid || 0,
        transactionId: o.transactionId || null
      });
      res.json({ success: true, order: o });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: err.errors });
      }
      throw err;
    }
  });

  app.get('/orders/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const rows = db.prepare('SELECT * FROM orders WHERE customerEmail = ? ORDER BY date DESC').all(email);
    const orders = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items) }));
    res.json({ orders });
  });

  app.put('/orders/:id/status', (req: Request, res: Response) => {
    const status = req.body.status;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  });

  // live single order for a customer
  app.get('/orders/live/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const row = db.prepare("SELECT * FROM orders WHERE customerEmail = ? AND status NOT IN ('DELIVERED','CANCELLED') ORDER BY date DESC LIMIT 1").get(email);
    if (!row) return res.json({ order: null });
    row.items = JSON.parse(row.items);
    res.json({ order: row });
  });

  // all live orders (admin/rider)?
  app.get('/orders/live', (req: any, res: Response) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'RIDER') return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare("SELECT * FROM orders WHERE status NOT IN ('DELIVERED','CANCELLED')").all();
    const orders = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items) }));
    res.json({ orders });
  });

  app.get('/orders/merchant/:restaurantName', (req: Request, res: Response) => {
    const name = req.params.restaurantName;
    const rows = db.prepare('SELECT * FROM orders WHERE restaurantName = ?').all(name);
    const orders = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items) }));
    res.json({ orders });
  });

  app.get('/orders/rider/:email', (req: Request, res: Response) => {
    const email = req.params.email.toLowerCase();
    const rows = db.prepare('SELECT * FROM orders WHERE riderEmail = ?').all(email);
    const orders = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items) }));
    res.json({ orders });
  });

  app.get('/orders/market', (req: Request, res: Response) => {
    const city = req.query.city || '';
    const rows = db.prepare("SELECT * FROM orders WHERE status = 'READY_FOR_PICKUP' AND riderEmail IS NULL").all();
    const orders = rows.map((r: any) => ({ ...r, items: JSON.parse(r.items) }));
    res.json({ orders });
  });

  // accept / assign orders
  app.put('/orders/:id/assign', (req: Request, res: Response) => {
    const { riderEmail, riderName } = req.body;
    db.prepare('UPDATE orders SET riderEmail = ?, riderName = ? WHERE id = ?').run(riderEmail, riderName, req.params.id);
    res.json({ success: true });
  });

  // --- addresses ---
  app.get('/addresses/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM addresses WHERE email = ?').all(email);
    res.json({ addresses: rows });
  });
  app.post('/addresses/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const addr = { ...req.body, id: req.body.id || uuidv4(), email };
    db.prepare('INSERT OR REPLACE INTO addresses (id,email,label,details,city) VALUES (@id,@email,@label,@details,@city)').run(addr);
    res.json({ address: addr });
  });
  app.delete('/addresses/:email/:id', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM addresses WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- payments ---
  app.get('/payments/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const rows = db.prepare('SELECT * FROM payments WHERE email = ?').all(email);
    res.json({ payments: rows });
  });
  app.post('/payments/:email', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const pay = { ...req.body, id: req.body.id || uuidv4(), email };
    db.prepare('INSERT OR REPLACE INTO payments (id,email,type,last4,expiry,phoneNumber,balance,token) VALUES (@id,@email,@type,@last4,@expiry,@phoneNumber,@balance,@token)').run(pay);
    res.json({ payment: pay });
  });
  app.delete('/payments/:email/:id', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
  app.put('/payments/:email/:id/balance', (req: any, res: Response) => {
    const email = req.params.email.toLowerCase();
    const caller = req.user?.email;
    if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { balance } = req.body;
    db.prepare('UPDATE payments SET balance = ? WHERE id = ?').run(balance, req.params.id);
    res.json({ success: true });
  });

  // --- vouchers ---
  app.get('/vouchers/claimed/:email', (req: any, res: any) => {
    const rows = db.prepare('SELECT v.* FROM vouchers v JOIN claimed_vouchers c ON v.id = c.voucherId WHERE c.email = ?').all(req.params.email.toLowerCase());
    res.json({ vouchers: rows });
  });
  app.post('/vouchers/claim/:email', (req: any, res: any) => {
    const { voucherId } = req.body;
    db.prepare('INSERT OR IGNORE INTO claimed_vouchers (email, voucherId) VALUES (?,?)').run(req.params.email.toLowerCase(), voucherId);
    res.json({ success: true });
  });

  // --- ledger ---
  app.get('/ledger/:ownerId', (req: any, res: any) => {
    const rows = db.prepare('SELECT * FROM ledger WHERE ownerId = ? ORDER BY timestamp DESC').all(req.params.ownerId.toLowerCase());
    res.json({ ledger: rows });
  });
  app.post('/ledger/:ownerId', (req: any, res: any) => {
    const entry = { ...req.body, ownerId: req.params.ownerId.toLowerCase(), id: req.body.id || uuidv4() };
    db.prepare(`INSERT OR REPLACE INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status)
                VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run(entry);
    res.json({ entry });
  });

  // simple config
  let config = { deliveryFee: 45, masterPin: '1234' };

  // stripe support: endpoint to create a charge directly
  app.post('/payments/stripe', async (req: any, res: any) => {
    const { amount, currency = 'usd', source, description } = req.body;
    if (!process.env.STRIPE_SECRET) {
      return res.status(500).json({ success: false, error: 'Stripe secret not configured' });
    }
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2022-11-15' });
      const charge = await stripe.charges.create({ amount: Math.round(amount*100), currency, source, description });
      res.json({ success: true, charge });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message });
    }
  });
  app.get('/config', (req: any, res: any) => {
    res.json(config);
  });
  app.put('/config', (req: any, res: Response) => {
    // only admin may change
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { deliveryFee, masterPin } = req.body;
    if (deliveryFee !== undefined) config.deliveryFee = deliveryFee;
    if (masterPin !== undefined) config.masterPin = masterPin;
    res.json({ success: true, config });
  });

  // wallet / real payments (including Stripe support)
  app.post('/payments/process', async (req: any, res: Response) => {
    try {
      const { email, methodId, amount, orderId } = paymentProcessSchema.parse(req.body);
      if (email.toLowerCase() !== req.user?.email && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const pay = db.prepare('SELECT * FROM payments WHERE id = ? AND email = ?').get(methodId, email.toLowerCase());
      if (!pay) {
        return res.status(404).json({ success: false, error: 'Method not found' });
      }

      // if the method is a card, route through Stripe
      if (['VISA', 'MASTERCARD'].includes(pay.type)) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET || '', { apiVersion: '2022-11-15' });
          // for demonstration we assume pay.token or pay.source contains a valid token/id
          const charge = await stripe.charges.create({
            amount: Math.round(amount * 100), // cents
            currency: 'usd',
            source: pay.token || pay.source || 'tok_visa',
            description: `Order ${orderId}`
          });
          // record ledger entry for card payment
          const ref = charge.balance_transaction || charge.id;
          const txnId = charge.id;
          const entry = { id: uuidv4(), amount, type: 'DEBIT', description: `Stripe: ${orderId}`, timestamp: new Date().toISOString(), orderId, methodType: pay.type, referenceId: ref, status: 'SETTLED', ownerId: email.toLowerCase() };
          db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status) VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run(entry);
          return res.json({ success: true, transactionId: txnId, reference: ref });
        } catch (stripeErr: any) {
          return res.status(502).json({ success: false, error: stripeErr.message || 'Stripe error' });
        }
      }

      if (pay.balance !== null && pay.balance < amount) {
        return res.json({ success: false, error: 'Insufficient funds' });
      }
      const txnId = `TXN-${uuidv4()}`;
      const newBal = pay.balance !== null ? pay.balance - amount : null;
      db.prepare('UPDATE payments SET balance = ? WHERE id = ?').run(newBal, methodId);
      const ref = `AYO-${Math.floor(Math.random()*1000000).toString().padStart(6,'0')}`;
      const entry = { id: uuidv4(), amount, type: 'DEBIT', description: `Checkout: ${orderId}`, timestamp: new Date().toISOString(), orderId, methodType: pay.type, referenceId: ref, status: 'SETTLED', ownerId: email.toLowerCase() };
      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status) VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run(entry);
      res.json({ success: true, transactionId: txnId, reference: ref });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ success: false, error: err.errors });
      }
      throw err;
    }
  });

  // mark an order as paid (for COD or external payments)
  app.put('/orders/:id/pay', (req: any, res: Response) => {
    try {
      const orderId = req.params.id;
      const { method, transactionId } = payOrderSchema.parse(req.body);
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      // only customer or involved parties may mark paid
      const caller = req.user?.email;
      if (caller !== order.customerEmail && req.user?.role !== 'ADMIN' && caller !== order.riderEmail && caller !== order.merchantEmail) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      db.prepare('UPDATE orders SET isPaid = 1, paymentMethod = ?, transactionId = ? WHERE id = ?').run(method, transactionId, orderId);
      res.json({ success: true });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: err.errors });
      }
      throw err;
    }
  });

  // allow wallet top-ups
  app.post('/payments/:email/topup', (req: any, res: Response) => {
    try {
      const email = req.params.email.toLowerCase();
      const caller = req.user?.email;
      if (caller !== email && req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
      const { methodId, amount } = topUpSchema.parse(req.body);
      const pay = db.prepare('SELECT * FROM payments WHERE id = ? AND email = ?').get(methodId, email);
      if (!pay) return res.status(404).json({ error: 'Method not found' });
      const newBal = (pay.balance || 0) + amount;
      db.prepare('UPDATE payments SET balance = ? WHERE id = ?').run(newBal, methodId);
      const ref = `TOPUP-${uuidv4()}`;
      const entry = { id: uuidv4(), amount, type: 'CREDIT', description: `Top-up`, timestamp: new Date().toISOString(), orderId: null, methodType: pay.type, referenceId: ref, status: 'SETTLED', ownerId: email };
      db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status) VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run(entry);
      res.json({ success: true, balance: newBal, reference: ref });
    } catch (err: any) {
      if (err.name === 'ZodError') {
        return res.status(400).json({ error: err.errors });
      }
      throw err;
    }
  });
}
