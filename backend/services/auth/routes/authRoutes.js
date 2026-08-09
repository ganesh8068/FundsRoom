import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticateToken } from "../../shared/auth.js";

const router = Router();

router.post("/login", AuthController.login);
router.get("/me", authenticateToken, AuthController.me);

export default router;
