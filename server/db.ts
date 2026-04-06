import { Pool } from "pg";
import mysql2 from "mysql2/promise";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { MySql2Database } from "drizzle-orm/mysql2";
import * as pgSchema from "../shared/schema";
import * as mysqlSchema from "../shared/schema-mysql";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const rawUrl = process.env.DATABASE_URL;
// Normalize mysql2:// → mysql:// for consistent parsing
const url = rawUrl.startsWith("mysql2://") ? rawUrl.replace("mysql2://", "mysql://") : rawUrl;
export const IS_MYSQL = url.startsWith("mysql://");

export type AppDb = NodePgDatabase<typeof pgSchema> | MySql2Database<typeof mysqlSchema>;
export type AppPool = Pool | mysql2.Pool;

let _db: AppDb;
let _pool: AppPool;

if (IS_MYSQL) {
  const pool = mysql2.createPool(url);
  _pool = pool;
  _db = drizzleMysql(pool, { schema: mysqlSchema, mode: "default" });
} else {
  const pool = new Pool({ connectionString: url });
  _pool = pool;
  _db = drizzlePg(pool, { schema: pgSchema });
}

export const pool: AppPool = _pool;
export const db: AppDb = _db;
