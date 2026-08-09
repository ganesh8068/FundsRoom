import { ProductModel } from "../models/productModel.js";

export const InventoryController = {
  async getList(req, res) {
    const { search, category, alert, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const { data, total } = await ProductModel.getProducts({
        search,
        category,
        alert,
        limit: Number(limit),
        offset
      });

      return res.json({
        data,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Controller getList error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async getMovements(req, res) {
    const { id } = req.params;

    try {
      const exists = await ProductModel.findById(id);
      if (!exists) {
        return res.status(404).json({ error: "Product not found" });
      }

      const logs = await ProductModel.getMovements(id);
      return res.json(logs);
    } catch (error) {
      console.error("Controller getMovements error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async create(req, res) {
    const { name, sku, category, unit_price, current_stock, location } = req.body;

    if (!name || !sku || !category || unit_price === undefined || current_stock === undefined || !location) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    try {
      const exists = await ProductModel.findBySku(sku);
      if (exists) {
        return res.status(400).json({ error: "Product SKU already exists" });
      }

      const username = req.user?.username || "Unknown";
      const product = await ProductModel.create(req.body, username);
      return res.status(201).json(product);
    } catch (error) {
      console.error("Controller create error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async update(req, res) {
    const { id } = req.params;

    try {
      const username = req.user?.username || "Unknown";
      const product = await ProductModel.update(id, req.body, username);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.json(product);
    } catch (error) {
      console.error("Controller update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async verifyAndUpdateStock(req, res) {
    const { items, action, challanNumber, username } = req.body;
    
    if (!items || !Array.isArray(items) || !action) {
      return res.status(400).json({ error: "Invalid payload parameters" });
    }

    try {
      const result = await ProductModel.verifyAndUpdateStock({ items, action, challanNumber, username });
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      return res.json(result);
    } catch (error) {
      console.error("Controller verifyAndUpdateStock error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
