import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import inventoryRoutes from "./routes/inventoryRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.INVENTORY_PORT || 8003;

app.use(cors());
app.use(express.json());

app.use("/", inventoryRoutes);

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
});
