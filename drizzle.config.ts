import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const url = process.env.DATABASE_URL;
const isMySQL = url.startsWith("mysql://");

export default defineConfig(
  isMySQL
    ? {
        out: "./migrations",
        schema: "./shared/schema-mysql.ts",
        dialect: "mysql",
        dbCredentials: { url },
      }
    : {
        out: "./migrations",
        schema: "./shared/schema.ts",
        dialect: "postgresql",
        dbCredentials: { url },
      }
);
