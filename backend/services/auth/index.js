import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "../shared/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 8001;

app.use(cors());
app.use(express.json());

await initDb();

// Apply auth routes
app.use("/", authRoutes);

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
