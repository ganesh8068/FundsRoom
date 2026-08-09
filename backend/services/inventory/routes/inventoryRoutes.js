import { Router } from "express";
import { InventoryController } from "../controllers/inventoryController.js";
import { authenticateToken, authorizeRoles } from "../../shared/auth.js";

const router = Router();

router.get("/", authenticateToken, InventoryController.getList);
router.get("/:id/movements", authenticateToken, InventoryController.getMovements);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Warehouse"),
  InventoryController.create
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Warehouse"),
  InventoryController.update
);

// Internal API route called by Challan Service
router.post("/internal/verify-and-update-stock", InventoryController.verifyAndUpdateStock);

export default router;
