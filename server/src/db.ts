import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_RESTAURANTS } from './seed.js';

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

      CREATE TABLE IF NOT EXISTS system_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        deliveryFee REAL DEFAULT 45,
        masterPin TEXT DEFAULT '1234'
      );
    `);

    const configRow = db.prepare('SELECT id FROM system_config WHERE id = 1').get();
    if (!configRow) {
      db.prepare('INSERT INTO system_config (id, deliveryFee, masterPin) VALUES (1, 45, ?)').run('1234');
    }

    const countRow = db.prepare('SELECT COUNT(*) as count FROM restaurants').get() as { count: number };
    if (countRow.count === 0) {
      const insertRestaurant = db.prepare(`
        INSERT INTO restaurants (id,name,rating,deliveryTime,image,cuisine,items,isPartner,address,hasLiveCam,reviews)
        VALUES (@id,@name,@rating,@deliveryTime,@image,@cuisine,@items,@isPartner,@address,@hasLiveCam,@reviews)
      `);
      const tx = db.transaction((rows: any[]) => {
        for (const row of rows) {
          insertRestaurant.run({
            ...row,
            items: JSON.stringify(row.items || []),
            reviews: JSON.stringify(row.reviews || []),
            isPartner: row.isPartner || 0,
            hasLiveCam: row.hasLiveCam || 0
          });
        }
      });
      tx(DEFAULT_RESTAURANTS);
      console.log(`✅ Seeded ${DEFAULT_RESTAURANTS.length} restaurants.`);
    }

    const addressCols = (db.prepare(`PRAGMA table_info(addresses)`).all() as any[]).map((c: any) => c.name);
    if (!addressCols.includes('latitude')) db.exec('ALTER TABLE addresses ADD COLUMN latitude REAL');
    if (!addressCols.includes('longitude')) db.exec('ALTER TABLE addresses ADD COLUMN longitude REAL');
    if (!addressCols.includes('distanceKm')) db.exec('ALTER TABLE addresses ADD COLUMN distanceKm REAL');
    if (!addressCols.includes('deliveryFee')) db.exec('ALTER TABLE addresses ADD COLUMN deliveryFee REAL');

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
