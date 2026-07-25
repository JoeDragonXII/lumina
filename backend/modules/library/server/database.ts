import "server-only";

import { mkdirSync } from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { schema } from "@backend/modules/library/server/schema";

type DatabaseState = {
  client: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
};

declare global {
  var __photoArchiveDatabases: Map<string, DatabaseState> | undefined;
}

export function getDataRoot() {
  return path.resolve(
    process.env.PHOTO_ARCHIVE_DATA_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), ".local-data"),
  );
}

export function getDatabasePath() {
  return path.resolve(process.env.PHOTO_ARCHIVE_DB_PATH || path.join(getDataRoot(), "library.sqlite"));
}

function createDatabase(): DatabaseState {
  const databasePath = getDatabasePath();
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const client = new Database(databasePath);
  client.pragma("foreign_keys = ON");
  client.pragma("journal_mode = WAL");

  const db = drizzle(client, { schema });
  migrate(db, {
    migrationsFolder: path.join(/* turbopackIgnore: true */ process.cwd(), "backend", "drizzle"),
  });

  return { client, db };
}

export function getDatabase() {
  const databasePath = getDatabasePath();
  globalThis.__photoArchiveDatabases ||= new Map();

  const existing = globalThis.__photoArchiveDatabases.get(databasePath);
  if (existing) return existing;

  const state = createDatabase();
  globalThis.__photoArchiveDatabases.set(databasePath, state);
  return state;
}

export function closeDatabases() {
  for (const state of globalThis.__photoArchiveDatabases?.values() || []) {
    state.client.close();
  }
  globalThis.__photoArchiveDatabases?.clear();
}
