import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost") && !process.env.DATABASE_URL.includes("127.0.0.1") 
    ? { rejectUnauthorized: false } 
    : undefined,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      console.log("Initializing database tables from shared schema.sql...");
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await client.query(schemaSql);
      
      // Seed default users if they don't exist
      const roles = [
        { username: "admin", role: "Admin", pass: "admin123" },
        { username: "sales", role: "Sales", pass: "sales123" },
        { username: "warehouse", role: "Warehouse", pass: "warehouse123" },
        { username: "accounts", role: "Accounts", pass: "accounts123" }
      ];

      for (const r of roles) {
        const existsRes = await client.query("SELECT * FROM users WHERE username = $1", [r.username]);
        if (existsRes.rows.length === 0) {
          const hash = bcrypt.hashSync(r.pass, 10);
          await client.query(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
            [r.username, hash, r.role]
          );
        }
      }
    }
  } catch (err) {
    console.error("Database init error:", err);
  } finally {
    client.release();
  }
}
