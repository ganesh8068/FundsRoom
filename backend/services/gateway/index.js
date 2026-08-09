import express from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Route Proxies to individual Microservices
app.use("/api/auth", proxy("http://localhost:8001"));
app.use("/api/customers", proxy("http://localhost:8002"));
app.use("/api/products", proxy("http://localhost:8003"));
app.use("/api/challans", proxy("http://localhost:8004"));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "API Gateway",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
