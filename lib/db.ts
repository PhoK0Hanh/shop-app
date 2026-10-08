import { Pool } from "pg";

// Pool tự đọc PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD.
export const pool = new Pool({
  max: 5,
  connectionTimeoutMillis: 5000,
});
