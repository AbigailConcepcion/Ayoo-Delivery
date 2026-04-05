import pkg from 'pg';
const { Pool } = pkg;
import { DEFAULT_RESTAURANTS } from './seed.js';
import winston from 'winston';

/**
 * Ayoo Delivery - PostgreSQL Configuration
 * Replaces SQLite for Production scaling.
 */

let pool: any;

const MAX_RETRIES = 3;
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});


const INITIAL_DELAY = 1000; // 1 second

/**
 * Executes a query with retry logic for transient errors
 */
export async function query(text: string, params?: any[]) {
  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      lastError = err;
      // Retry on connection errors (08xxx) or server shutdown (57Pxx) or deadlocks (40P01)
      const isTransient = err.code?.startsWith('08') || err.code?.startsWith('57') || err.code === '40P01';
      if (!isTransient || i === MAX_RETRIES - 1) throw err;
      
      const delay = INITIAL_DELAY * Math.pow(2, i);
      logger.warn(`⚠️ DB Query failed (attempt ${i + 1}). Retrying in ${delay}ms...`, { error: err.message, query: text, params });
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export async function initDb() {
  if (pool) return pool;

  try {
    logger.info(`🗄️ Connecting to PostgreSQL...`);

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT,
        avatar TEXT,
        points INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        badges JSONB DEFAULT '[]',
        preferredCity TEXT,
        role TEXT DEFAULT 'CUSTOMER',
        merchantId TEXT,
        earnings REAL DEFAULT 0,
        manualsSeen TEXT DEFAULT '[]',
        "fcmToken" TEXT
      );

      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rating REAL,
        deliveryTime TEXT,
        image TEXT,
        cuisine TEXT,
        items JSONB,
        isPartner INTEGER DEFAULT 0,
        address TEXT,
        hasLiveCam INTEGER DEFAULT 0,
        reviews JSONB
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        date TEXT,
        items JSONB,
        total DOUBLE PRECISION,
        status TEXT,
        restaurantName TEXT,
        customerEmail TEXT,
        customerName TEXT,
        riderName TEXT,
        riderEmail TEXT,
        deliveryAddress TEXT,
        tipAmount DOUBLE PRECISION,
        pointsEarned INTEGER,
        paymentMethod TEXT,
        paymentId TEXT,
        isPaid INTEGER DEFAULT 0,
        "amountPaid" DOUBLE PRECISION DEFAULT 0,
        transactionId TEXT,
        rating INTEGER,
        comment TEXT,
        receiptUrl TEXT
      );

      ALTER TABLE orders ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION DEFAULT 0;

      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        email TEXT,
        label TEXT,
        details TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        distanceKm REAL,
        deliveryFee REAL
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        email TEXT,
        type TEXT,
        last4 TEXT,
        expiry TEXT,
        phoneNumber TEXT,
        balance DOUBLE PRECISION,
        token TEXT
      );

      CREATE TABLE IF NOT EXISTS vouchers (
        id TEXT PRIMARY KEY,
        code TEXT,
        discount REAL,
        description TEXT,
        type TEXT
      );

      CREATE TABLE IF NOT EXISTS claimed_vouchers (
        email TEXT,
        voucherId TEXT,
        PRIMARY KEY (email, voucherId)
      );

      CREATE TABLE IF NOT EXISTS ledger (
        ownerId TEXT,
        id TEXT,
        amount DOUBLE PRECISION,
        type TEXT,
        description TEXT,
        timestamp TEXT,
        orderId TEXT,
        methodType TEXT,
        referenceId TEXT,
        "idempotencyKey" TEXT,
        status TEXT,        
        PRIMARY KEY(ownerId, id)
      );

      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        deliveryFee DOUBLE PRECISION DEFAULT 45,
        masterPin TEXT DEFAULT '1234'
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "senderEmail" TEXT NOT NULL,
        "senderName" TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        "isRead" INTEGER DEFAULT 0
      );
    `);

    const configRes = await pool.query('SELECT id FROM system_config WHERE id = 1');
    if (configRes.rowCount === 0) {
      if (!process.env.MASTER_PIN) {
        throw new Error('MASTER_PIN environment variable is required for initial config setup.');
      }
      await pool.query('INSERT INTO system_config (id, deliveryFee, masterPin) VALUES (1, 45, $1)', [process.env.MASTER_PIN]);
    }

    const restaurantRes = await pool.query('SELECT COUNT(*) as count FROM restaurants');
    if (parseInt(restaurantRes.rows[0].count) === 0) {
      for (const row of DEFAULT_RESTAURANTS) {
        await pool.query(
          `INSERT INTO restaurants (id,name,rating,deliveryTime,image,cuisine,items,isPartner,address,hasLiveCam,reviews)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [row.id, row.name, row.rating, row.deliveryTime, row.image, row.cuisine, JSON.stringify(row.items || []), row.isPartner || 0, row.address, row.hasLiveCam || 0, JSON.stringify(row.reviews || [])]
        );
      }
      logger.info(`✅ Seeded ${DEFAULT_RESTAURANTS.length} restaurants.`);
    }

    logger.info("✅ Database schema is up to date.");
    return pool;
  } catch (error) {
    logger.error("❌ Critical Error initializing database:", error);
    throw error;
  }
}

export function getDb() {
  return pool;
}
