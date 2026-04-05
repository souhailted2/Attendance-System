import { Pool } from "pg";
import mysql2 from "mysql2/promise";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import * as pgSchema from "../shared/schema";
import * as mysqlSchema from "../shared/schema-mysql";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const url = process.env.DATABASE_URL;
export const IS_MYSQL = url.startsWith("mysql://");

let _db: any;
let _pool: any;

if (IS_MYSQL) {
  _pool = mysql2.createPool(url);
  _db = drizzleMysql(_pool, { schema: mysqlSchema, mode: "default" });
} else {
  _pool = new Pool({ connectionString: url });
  _db = drizzlePg(_pool, { schema: pgSchema });
}

export const pool = _pool;
export const db: any = _db;
