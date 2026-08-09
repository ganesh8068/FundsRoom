import { Router } from "express";
import { ChallanController } from "../controllers/challanController.js";
import { authenticateToken, authorizeRoles } from "../../shared/auth.js";

const router = Router();

router.get("/", authenticateToken, ChallanController.getList);
router.get("/:id", authenticateToken, ChallanController.getDetail);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Sales"),
  ChallanController.create
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Sales", "Warehouse", "Accounts"),
  ChallanController.updateStatus
);

export default router;
