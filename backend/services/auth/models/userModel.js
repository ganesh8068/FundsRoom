import { pool } from "../../shared/db.js";

export const UserModel = {
  async findByUsername(username) {
    const res = await pool.query("SELECT * FROM users WHERE username = $1", [username.toLowerCase().trim()]);
    return res.rows[0];
  }
};
