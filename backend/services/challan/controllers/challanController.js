import { ChallanModel } from "../models/challanModel.js";

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || "http://localhost:8003";

function generateChallanNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CH-${dateStr}-${rand}`;
}

export const ChallanController = {
  async getList(req, res) {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const { data, total } = await ChallanModel.getChallans({
        status,
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

  async getDetail(req, res) {
    const { id } = req.params;

    try {
      const challan = await ChallanModel.findById(id);
      if (!challan) {
        return res.status(404).json({ error: "Challan not found" });
      }

      const items = await ChallanModel.getItems(id);
      return res.json({ challan, items });
    } catch (error) {
      console.error("Controller getDetail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async create(req, res) {
    const { customerId, status, products } = req.body;

    if (!customerId || !status || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const username = req.user?.username || "Unknown";
    const challanNo = generateChallanNumber();

    try {
      const customerExists = await ChallanModel.verifyCustomerExists(customerId);
      if (!customerExists) {
        return res.status(404).json({ error: "Customer not found" });
      }

      let snapshots = [];
      if (status === "Confirmed") {
        const invRes = await fetch(`${INVENTORY_SERVICE_URL}/internal/verify-and-update-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: products,
            action: "DEDUCT",
            challanNumber: challanNo,
            username
          })
        });
        const invData = await invRes.json();
        if (!invRes.ok) {
          return res.status(invRes.status).json({ error: invData.error || "Inventory check failed" });
        }
        snapshots = invData.snapshots;
      } else {
        // Draft: collect snap details without updating inventory
        for (const item of products) {
          const product = await ChallanModel.fetchProductInfo(item.productId);
          if (!product) {
            return res.status(404).json({ error: `Product ID ${item.productId} not found` });
          }
          snapshots.push({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            unitPrice: product.unit_price,
            quantity: item.quantity
          });
        }
      }

      const challan = await ChallanModel.create({
        customerId,
        status,
        products,
        challanNo,
        username,
        snapshots
      });

      return res.status(201).json(challan);
    } catch (error) {
      console.error("Controller create error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const username = req.user?.username || "Unknown";

    try {
      const challan = await ChallanModel.findById(id);
      if (!challan) {
        return res.status(404).json({ error: "Challan not found" });
      }

      const currentStatus = challan.status;
      if (currentStatus === status) {
        return res.status(400).json({ error: `Challan is already in '${status}' status` });
      }

      if (currentStatus === "Cancelled") {
        return res.status(400).json({ error: "Cancelled challans cannot be updated" });
      }

      const items = await ChallanModel.getItems(id);
      const itemsPayload = items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity
      }));

      // Call Inventory microservice depending on state transitions
      if (currentStatus === "Draft" && status === "Confirmed") {
        const invRes = await fetch(`${INVENTORY_SERVICE_URL}/internal/verify-and-update-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: itemsPayload,
            action: "DEDUCT",
            challanNumber: challan.challan_number,
            username
          })
        });
        const invData = await invRes.json();
        if (!invRes.ok) {
          return res.status(invRes.status).json({ error: invData.error || "Inventory deduction failed" });
        }
      }

      if (currentStatus === "Confirmed" && status === "Cancelled") {
        const invRes = await fetch(`${INVENTORY_SERVICE_URL}/internal/verify-and-update-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: itemsPayload,
            action: "RESTORE",
            challanNumber: challan.challan_number,
            username
          })
        });
        if (!invRes.ok) {
          const invData = await invRes.json();
          return res.status(invRes.status).json({ error: invData.error || "Inventory restore failed" });
        }
      }

      // Save updated status
      const updated = await ChallanModel.updateStatus(id, status);
      return res.json(updated);
    } catch (error) {
      console.error("Controller updateStatus error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
