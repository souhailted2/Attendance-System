import { createRequire } from "module";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const require = createRequire(import.meta.url);
const url = process.env.DATABASE_URL;
const isMySQL = url.startsWith("mysql://");

let _db: any;
let _pool: any;

if (isMySQL) {
  const mysql2 = require("mysql2/promise");
  const { drizzle } = require("drizzle-orm/mysql2");
  const schema = require("../shared/schema-mysql");
  _pool = mysql2.createPool(url);
  _db = drizzle(_pool, { schema, mode: "default" });
} else {
  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  const schema = require("../shared/schema");
  _pool = new Pool({ connectionString: url });
  _db = drizzle(_pool, { schema });
}

export const pool = _pool;
export const db: any = _db;
export const IS_MYSQL = isMySQL;
