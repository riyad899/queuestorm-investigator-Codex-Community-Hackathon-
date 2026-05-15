import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { InventoryAlertController } from "./inventoryAlert.controller.js";

const router = Router();

router.get(
  "/inventory-alert/low-stock",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  InventoryAlertController.getLowStockAlerts,
);

export const InventoryAlertRoute = router;
