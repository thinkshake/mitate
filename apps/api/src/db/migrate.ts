import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

/**
 * Ensure the migrations table exists.
 */
function ensureMigrationsTable(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )
  `);
}

/**
 * Get list of applied migrations.
 */
function getAppliedMigrations(db: Database): Set<string> {
  const rows = db.query("SELECT name FROM migrations").all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

/**
 * Get list of migration files sorted by name.
 */
function getMigrationFiles(): string[] {
  try {
    const files = readdirSync(MIGRATIONS_DIR);
    return files
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/**
 * Run all pending migrations.
 */
export async function runMigrations(db: Database): Promise<void> {
  ensureMigrationsTable(db);

  const applied = getAppliedMigrations(db);
  const files = getMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    console.log(`Running migration: ${file}`);
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");

    // Run migration in a transaction
    db.exec("BEGIN TRANSACTION");
    try {
      db.exec(sql);
      db.exec(`INSERT INTO migrations (name) VALUES ('${file}')`);
      db.exec("COMMIT");
      console.log(`Migration ${file} applied successfully`);
    } catch (err) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${err}`);
    }
  }
}

// CLI entrypoint
if (import.meta.main) {
  const { initDatabase, closeDatabase } = await import("./index");
  try {
    await initDatabase();
    console.log("All migrations applied successfully");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}
