import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Replit's managed Postgres requires SSL but presents a cert that doesn't pass
// strict `verify-full`. pg-connection-string in pg >=8.20 now treats
// `sslmode=require` as `verify-full`, which causes silent connection hangs in
// production. Force a permissive SSL config whenever the URL asks for SSL.
const connectionString = process.env.DATABASE_URL;
const wantsSsl = /sslmode=(require|verify-ca|verify-full|prefer)/i.test(
  connectionString,
);

export const pool = new Pool({
  connectionString,
  ...(wantsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
