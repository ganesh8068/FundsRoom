import { pool } from "../../shared/db.js";

export const CustomerModel = {
  async getCustomers({ search, type, status, limit, offset }) {
    let query = "SELECT * FROM customers WHERE 1=1";
    const values = [];
    let valIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${valIndex} OR business_name ILIKE $${valIndex} OR mobile ILIKE $${valIndex} OR email ILIKE $${valIndex})`;
      values.push(`%${search}%`);
      valIndex++;
    }

    if (type) {
      query += ` AND type = $${valIndex}`;
      values.push(type);
      valIndex++;
    }

    if (status) {
      query += ` AND status = $${valIndex}`;
      values.push(status);
      valIndex++;
    }

    // Count
    const countRes = await pool.query(query.replace("SELECT *", "SELECT COUNT(*)"), values);
    const total = parseInt(countRes.rows[0].count, 10);

    query += ` ORDER BY created_at DESC LIMIT $${valIndex} OFFSET $${valIndex + 1}`;
    values.push(limit, offset);

    const dataRes = await pool.query(query, values);
    return { data: dataRes.rows, total };
  },

  async findById(id) {
    const res = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    return res.rows[0];
  },

  async getNotes(customerId) {
    const res = await pool.query(
      "SELECT * FROM customer_notes WHERE customer_id = $1 ORDER BY created_at DESC",
      [customerId]
    );
    return res.rows;
  },

  async create(data) {
    const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = data;
    const query = `
      INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [name, mobile, email, business_name, gst_number || "", type, address, status || "Lead", follow_up_date || null, notes || ""];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async update(id, data) {
    const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = data;
    const query = `
      UPDATE customers
      SET name = COALESCE($1, name),
          mobile = COALESCE($2, mobile),
          email = COALESCE($3, email),
          business_name = COALESCE($4, business_name),
          gst_number = COALESCE($5, gst_number),
          type = COALESCE($6, type),
          address = COALESCE($7, address),
          status = COALESCE($8, status),
          follow_up_date = COALESCE($9, follow_up_date),
          notes = COALESCE($10, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    const values = [name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes, id];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  async addNote(customerId, note, createdBy) {
    const query = "INSERT INTO customer_notes (customer_id, note, created_by) VALUES ($1, $2, $3) RETURNING *";
    const res = await pool.query(query, [customerId, note, createdBy]);
    return res.rows[0];
  }
};
