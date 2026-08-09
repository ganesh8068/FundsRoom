import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import challanRoutes from "./routes/challanRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.CHALLAN_PORT || 8004;

app.use(cors());
app.use(express.json());

app.use("/", challanRoutes);

app.listen(PORT, () => {
  console.log(`Challan Service running on port ${PORT}`);
});
