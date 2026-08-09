import { pool } from "../../shared/db.js";

export const ChallanModel = {
  async getChallans({ status, limit, offset }) {
    let query = `
      SELECT c.*, cust.name as customer_name, cust.business_name as customer_business
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      WHERE 1=1
    `;
    const values = [];
    let valIndex = 1;

    if (status) {
      query += ` AND c.status = $${valIndex}`;
      values.push(status);
      valIndex++;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM challans c WHERE 1=1 ${status ? `AND c.status = $1` : ""}`,
      status ? [status] : []
    );
    const total = parseInt(countRes.rows[0].count, 10);

    query += ` ORDER BY c.created_at DESC LIMIT $${valIndex} OFFSET $${valIndex + 1}`;
    values.push(limit, offset);

    const dataRes = await pool.query(query, values);
    return { data: dataRes.rows, total };
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT c.*, cust.name as customer_name, cust.business_name as customer_business, cust.email as customer_email, cust.mobile as customer_mobile, cust.address as customer_address, cust.gst_number as customer_gst
       FROM challans c
       JOIN customers cust ON c.customer_id = cust.id
       WHERE c.id = $1`,
      [id]
    );
    return res.rows[0];
  },

  async getItems(challanId) {
    const res = await pool.query("SELECT * FROM challan_items WHERE challan_id = $1", [challanId]);
    return res.rows;
  },

  async verifyCustomerExists(customerId) {
    const res = await pool.query("SELECT id FROM customers WHERE id = $1", [customerId]);
    return res.rows.length > 0;
  },

  async fetchProductInfo(productId) {
    const res = await pool.query("SELECT * FROM products WHERE id = $1", [productId]);
    return res.rows[0];
  },

  async create({ customerId, status, products, challanNo, username, snapshots }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const totalQty = products.reduce((acc, item) => acc + item.quantity, 0);

      // Insert Challan
      const challanInsert = await client.query(
        `INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [challanNo, customerId, status, totalQty, username]
      );
      const newChallan = challanInsert.rows[0];

      // Insert snapshots
      for (const snap of snapshots) {
        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, quantity, unit_price_snapshot, product_name_snapshot, sku_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newChallan.id, snap.productId, snap.quantity, snap.unitPrice, snap.name, snap.sku]
        );
      }

      await client.query("COMMIT");
      return newChallan;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, status) {
    const res = await pool.query(
      `UPDATE challans SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0];
  }
};
