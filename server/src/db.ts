import Database from 'better-sqlite3';
import { join } from 'path';

let db: any;

export function initDb() {
  const path = join(process.cwd(), 'server', 'ayoo.sqlite');
  db = new Database(path);

  // create tables if they don't exist
  db.exec(`
    PRAGMA foreign_keys = ON;

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

}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db;
}
