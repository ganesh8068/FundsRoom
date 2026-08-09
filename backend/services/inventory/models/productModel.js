import { pool } from "../../shared/db.js";

export const ProductModel = {
  async getProducts({ search, category, alert, limit, offset }) {
    let query = "SELECT * FROM products WHERE 1=1";
    const values = [];
    let valIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${valIndex} OR sku ILIKE $${valIndex})`;
      values.push(`%${search}%`);
      valIndex++;
    }

    if (category) {
      query += ` AND category = $${valIndex}`;
      values.push(category);
      valIndex++;
    }

    if (alert === "true") {
      query += ` AND current_stock <= min_stock_alert`;
    }

    const countRes = await pool.query(query.replace("SELECT *", "SELECT COUNT(*)"), values);
    const total = parseInt(countRes.rows[0].count, 10);

    query += ` ORDER BY name ASC LIMIT $${valIndex} OFFSET $${valIndex + 1}`;
    values.push(limit, offset);

    const dataRes = await pool.query(query, values);
    return { data: dataRes.rows, total };
  },

  async findById(id) {
    const res = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    return res.rows[0];
  },

  async findBySku(sku) {
    const res = await pool.query("SELECT id FROM products WHERE sku = $1", [sku.toUpperCase().trim()]);
    return res.rows[0];
  },

  async getMovements(productId) {
    const res = await pool.query(
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [productId]
    );
    return res.rows;
  },

  async create(data, username) {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = data;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insertQuery = `
        INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const values = [name, sku.toUpperCase().trim(), category, unit_price, current_stock, min_stock_alert || 0, location];
      const newProduct = await client.query(insertQuery, values);
      const product = newProduct.rows[0];

      if (current_stock > 0) {
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, current_stock, "IN", "Initial Stock Inward", username]
        );
      }

      await client.query("COMMIT");
      return product;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async update(id, data, username) {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location, reason } = data;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const prodRes = await client.query("SELECT * FROM products WHERE id = $1 FOR UPDATE", [id]);
      if (prodRes.rows.length === 0) {
        await client.query("ROLLBACK");
        client.release();
        return null;
      }

      const oldProduct = prodRes.rows[0];
      const stockDiff = current_stock !== undefined ? current_stock - oldProduct.current_stock : 0;

      const updateQuery = `
        UPDATE products
        SET name = COALESCE($1, name),
            sku = COALESCE($2, sku),
            category = COALESCE($3, category),
            unit_price = COALESCE($4, unit_price),
            current_stock = COALESCE($5, current_stock),
            min_stock_alert = COALESCE($6, min_stock_alert),
            location = COALESCE($7, location),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;
      const values = [name, sku ? sku.toUpperCase().trim() : undefined, category, unit_price, current_stock, min_stock_alert, location, id];
      const updatedRes = await client.query(updateQuery, values);
      const updatedProduct = updatedRes.rows[0];

      if (stockDiff !== 0) {
        const movementType = stockDiff > 0 ? "IN" : "OUT";
        const logReason = reason || (stockDiff > 0 ? "Manual stock addition" : "Manual stock correction");
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, Math.abs(stockDiff), movementType, logReason, username]
        );
      }

      await client.query("COMMIT");
      return updatedProduct;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async verifyAndUpdateStock({ items, action, challanNumber, username }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const snapshots = [];

      for (const item of items) {
        const prodRes = await client.query("SELECT * FROM products WHERE id = $1 FOR UPDATE", [item.productId]);
        if (prodRes.rows.length === 0) {
          await client.query("ROLLBACK");
          client.release();
          return { error: `Product ID ${item.productId} not found` };
        }

        const product = prodRes.rows[0];

        if (action === "DEDUCT") {
          if (product.current_stock < item.quantity) {
            await client.query("ROLLBACK");
            client.release();
            return { error: `Insufficient stock for product '${product.name}'. Available: ${product.current_stock}, Required: ${item.quantity}` };
          }

          await client.query("UPDATE products SET current_stock = current_stock - $1 WHERE id = $2", [item.quantity, item.productId]);
          await client.query(
            `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [item.productId, item.quantity, "OUT", `Sales Challan ${challanNumber} Confirmed`, username]
          );
        } else if (action === "RESTORE") {
          await client.query("UPDATE products SET current_stock = current_stock + $1 WHERE id = $2", [item.quantity, item.productId]);
          await client.query(
            `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, $3, $4, $5)`,
            [item.productId, item.quantity, "IN", `Sales Challan ${challanNumber} Cancelled`, username]
          );
        }

        snapshots.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: product.unit_price,
          quantity: item.quantity
        });
      }

      await client.query("COMMIT");
      client.release();
      return { success: true, snapshots };
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      throw err;
    }
  }
};
