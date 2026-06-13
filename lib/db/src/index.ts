import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load .env from workspace root or current directory
const possiblePaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(import.meta.dirname, "../../../.env"),
  path.resolve(import.meta.dirname, "../../.env"),
];
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const dbPath = path.resolve(import.meta.dirname, "../../../sqlite.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export * from "./schema";
