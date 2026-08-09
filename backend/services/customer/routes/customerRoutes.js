import { Router } from "express";
import { CustomerController } from "../controllers/customerController.js";
import { authenticateToken, authorizeRoles } from "../../shared/auth.js";

const router = Router();

router.get("/", authenticateToken, CustomerController.getList);
router.get("/:id", authenticateToken, CustomerController.getDetail);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("Admin", "Sales"),
  CustomerController.create
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("Admin", "Sales"),
  CustomerController.update
);

router.post(
  "/:id/notes",
  authenticateToken,
  CustomerController.addNote
);

export default router;
