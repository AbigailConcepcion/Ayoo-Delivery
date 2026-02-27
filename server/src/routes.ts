import { Application, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import Stripe from 'stripe';

/**
 * Ayoo Delivery - Routes Configuration
 * Optimized for Node v22 ESM & TypeScript NodeNext
 */

// Local Imports (DAPAT may .js extension para sa ESM compatibility)
import { getDb } from './db.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authMiddleware, 
  AuthRequest 
} from './auth.js';

// Global declaration para sa process variables
declare const process: {
  env: {
    STRIPE_SECRET?: string;
    [key: string]: string | undefined;
  };
};

// --- Validation Schemas (Zod) ---
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
  paymentId: z.string().nullable().optional(),
  transactionId: z.string().nullable().optional()
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
  // Lazy-init database connection
  const db: any = getDb();

  // Enforce authentication for all endpoints except auth and public config
  app.use((req: any, res: any, next: any) => {
    if (req.path.startsWith('/auth') || req.path === '/config') {
      return next();
    }
    return authMiddleware(req as AuthRequest, res, next);
  });

  // --- Authentication Endpoints ---
  app.post('/auth/register', async (req: Request, res: Response) => {
    try {
      const user = registerSchema.parse(req.body);
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
    } catch (err: any) {
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Registration failed' });
    }
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
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // --- User Management ---
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

  // --- Restaurant Endpoints ---
  app.get('/restaurants', (req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM restaurants').all();
    const restaurants = rows.map((r: any) => ({ 
      ...r, 
      items: JSON.parse(r.items || '[]'), 
      reviews: JSON.parse(r.reviews || '[]') 
    }));
    res.json({ restaurants });
  });

  // --- Order Management ---
  app.post('/orders', (req: any, res: Response) => {
    try {
      const o = orderSchema.parse(req.body);
      if (!o.id) o.id = `AYO-${Math.floor(Math.random() * 90000) + 10000}`;
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
      if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Order creation failed' });
    }
  });

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

  // --- Payment & Wallet Endpoints ---
  app.post('/payments/process', async (req: any, res: Response) => {
    try {
      const { email, methodId, amount, orderId } = paymentProcessSchema.parse(req.body);
      if (email.toLowerCase() !== req.user?.email && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const pay = db.prepare('SELECT * FROM payments WHERE id = ? AND email = ?').get(methodId, email.toLowerCase());
      if (!pay) return res.status(404).json({ success: false, error: 'Method not found' });

      // Stripe Logic
      if (['VISA', 'MASTERCARD'].includes(pay.type)) {
        if (!process.env.STRIPE_SECRET) return res.status(500).json({ error: 'Stripe not configured' });
        
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET, { apiVersion: '2024-12-18.acacia' as any });
          const charge = await stripe.charges.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            source: pay.token || pay.source || 'tok_visa',
            description: `Order ${orderId}`
          });

          const ref = charge.balance_transaction || charge.id;
          const entry = { id: uuidv4(), amount, type: 'DEBIT', description: `Stripe: ${orderId}`, timestamp: new Date().toISOString(), orderId, methodType: pay.type, referenceId: ref, status: 'SETTLED', ownerId: email.toLowerCase() };
          
          db.prepare(`INSERT INTO ledger (ownerId,id,amount,type,description,timestamp,orderId,methodType,referenceId,status) VALUES (@ownerId,@id,@amount,@type,@description,@timestamp,@orderId,@methodType,@referenceId,@status)`).run(entry);
          
          return res.json({ success: true, transactionId: charge.id, reference: ref });
        } catch (stripeErr: any) {
          return res.status(502).json({ success: false, error: stripeErr.message });
        }
      }

      // Wallet Balance Logic
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
      if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.errors });
      res.status(500).json({ success: false, error: 'Internal payment error' });
    }
  });

  // Config Endpoint
  app.get('/config', (_req: Request, res: Response) => {
    res.json({ deliveryFee: 45, masterPin: '1234' });
  });
}