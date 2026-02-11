import { Database } from "bun:sqlite";
import { config } from "../config";
import { runMigrations } from "./migrate";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

let db: Database | null = null;

/**
 * Get the database instance.
 * Throws if database is not initialized.
 */
export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Initialize the database connection.
 * Creates the database file and runs migrations.
 */
export async function initDatabase(): Promise<void> {
  if (db) {
    return;
  }

  // Ensure data directory exists
  const dbDir = dirname(config.databasePath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // Open database connection
  db = new Database(config.databasePath, { create: true });

  // Enable WAL mode for better concurrency
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA foreign_keys = ON");

  // Run migrations
  await runMigrations(db);
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Generate a unique ID with prefix.
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}
