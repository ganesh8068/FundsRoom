import { CustomerModel } from "../models/customerModel.js";

export const CustomerController = {
  async getList(req, res) {
    const { search, type, status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const { data, total } = await CustomerModel.getCustomers({
        search,
        type,
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
      const customer = await CustomerModel.findById(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const notes = await CustomerModel.getNotes(id);
      return res.json({ customer, notes });
    } catch (error) {
      console.error("Controller getDetail error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async create(req, res) {
    const { name, mobile, email, business_name, type, address } = req.body;

    if (!name || !mobile || !email || !business_name || !type || !address) {
      return res.status(400).json({ error: "Required fields are missing" });
    }

    try {
      const customer = await CustomerModel.create(req.body);
      return res.status(201).json(customer);
    } catch (error) {
      console.error("Controller create error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async update(req, res) {
    const { id } = req.params;

    try {
      const exists = await CustomerModel.findById(id);
      if (!exists) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const customer = await CustomerModel.update(id, req.body);
      return res.json(customer);
    } catch (error) {
      console.error("Controller update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async addNote(req, res) {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: "Note content is required" });
    }

    try {
      const exists = await CustomerModel.findById(id);
      if (!exists) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const username = req.user?.username || "Unknown";
      const newNote = await CustomerModel.addNote(id, note, username);
      return res.status(201).json(newNote);
    } catch (error) {
      console.error("Controller addNote error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};
