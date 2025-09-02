import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initializeDatabase() {
  if (db) return db;

  try {
    const dbPath = path.resolve(__dirname, 'database.sqlite');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    console.log('Connected to the SQLite database.');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT,
        email TEXT,
        profilePicture TEXT
      );
    `);

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS closed_trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset TEXT NOT NULL,
        direction TEXT NOT NULL,
        size REAL NOT NULL,
        entryPrice REAL NOT NULL,
        exitPrice REAL NOT NULL,
        pnl REAL NOT NULL,
        timestamp TEXT NOT NULL,
        strategy TEXT,
        regime TEXT
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // [Praetorian X] - New table for AI's long-term memory
    await db.exec(`
      CREATE TABLE IF NOT EXISTS trade_journal (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset TEXT NOT NULL,
          strategy TEXT NOT NULL,
          regime TEXT NOT NULL,
          h1_trend_strength REAL,
          m15_rsi REAL,
          m15_atr REAL,
          outcome TEXT NOT NULL, -- 'WIN' or 'LOSS'
          pnl REAL NOT NULL,
          timestamp TEXT NOT NULL
      );
    `);

    // Seed initial user if not exists
    const geraldExists = await db.get("SELECT 1 FROM users WHERE username = 'Gerald'");
    if (!geraldExists) {
        await db.run(
            `INSERT INTO users (username, password, fullName, email, profilePicture) VALUES (?, ?, ?, ?, ?)`,
            'Gerald',
            '123456', // In a real app, this should be a securely hashed password
            'Gerald R.',
            'gerald.r@nexus.ai',
            'https://i.pravatar.cc/100?u=gerald' // Placeholder image
        );
        console.log("Seeded initial user 'Gerald'.");
    }

    // Ensure default AI state exists
    await db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('isAiActive', 'false')");

    return db;
  } catch (err) {
    console.error('Could not connect to the database', err);
    throw err;
  }
}

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};