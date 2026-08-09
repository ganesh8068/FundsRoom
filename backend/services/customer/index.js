import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.CUSTOMER_PORT || 8002;

app.use(cors());
app.use(express.json());

app.use("/", customerRoutes);

app.listen(PORT, () => {
  console.log(`Customer Service running on port ${PORT}`);
});
