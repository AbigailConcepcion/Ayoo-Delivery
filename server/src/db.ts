import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Ayoo Delivery - Database Configuration
 * Optimized for Better-SQLite3 and Node v22 ESM
 */

// Dahil sa ESM, kailangan nating i-derive ang __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: any;

export function initDb() {
  if (db) return db;

  try {
    // Tinitiyak na ang database file ay mapupunta sa tamang folder (isang level up mula sa src)
    const dbPath = join(__dirname, '..', 'ayoo.sqlite');
    
    console.log(`🗄️ Initializing database at: ${dbPath}`);
    
    db = new Database(dbPath, { verbose: console.log });
    
    // Performance and integrity settings
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables if they don't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT,
        avatar TEXT,
        points INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak INTEGER DEFAULT 0,
        badges TEXT DEFAULT '[]',
        preferredCity TEXT,
        role TEXT DEFAULT 'CUSTOMER',
        merchantId TEXT,
        earnings REAL DEFAULT 0,
        manualsSeen TEXT DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS restaurants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rating REAL,
        deliveryTime TEXT,
        image TEXT,
        cuisine TEXT,
        items TEXT,
        isPartner INTEGER DEFAULT 0,
        address TEXT,
        hasLiveCam INTEGER DEFAULT 0,
        reviews TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        date TEXT,
        items TEXT,
        total REAL,
        status TEXT,
        restaurantName TEXT,
        customerEmail TEXT,
        customerName TEXT,
        riderName TEXT,
        riderEmail TEXT,
        deliveryAddress TEXT,
        tipAmount REAL,
        pointsEarned INTEGER,
        paymentMethod TEXT,
        paymentId TEXT,
        isPaid INTEGER DEFAULT 0,
        transactionId TEXT,
        rating INTEGER,
        comment TEXT,
        receiptUrl TEXT
      );

      CREATE TABLE IF NOT EXISTS addresses (
        id TEXT PRIMARY KEY,
        email TEXT,
        label TEXT,
        details TEXT,
        city TEXT
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        email TEXT,
        type TEXT,
        last4 TEXT,
        expiry TEXT,
        phoneNumber TEXT,
        balance REAL,
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
        amount REAL,
        type TEXT,
        description TEXT,
        timestamp TEXT,
        orderId TEXT,
        methodType TEXT,
        referenceId TEXT,
        status TEXT,
        PRIMARY KEY(ownerId, id)
      );
    `);

    console.log("✅ Database schema is up to date.");
    return db;
  } catch (error) {
    console.error("❌ Critical Error initializing database:", error);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    return initDb();
  }
  return db;
}