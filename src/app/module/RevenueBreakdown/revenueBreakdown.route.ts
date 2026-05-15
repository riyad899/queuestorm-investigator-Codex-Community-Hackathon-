import { Role } from "@prisma/client";
import { Router } from "express";
import { checkAuth } from "../../../middleware/checkAuth.js";
import * as RevenueBreakdownController from "./revenueBreakdown.controller.js";

const router = Router();

router.get(
  "/revenue-breakdown/summary",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getRevenueSummary,
);

router.get(
  "/revenue-breakdown/monthly-overview",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getMonthlyOverview,
);

router.get(
  "/revenue-breakdown/payment-methods",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getPaymentMethodsBreakdown,
);

router.get(
  "/revenue-breakdown/monthly-breakdown",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getMonthlyBreakdownTable,
);

router.get(
  "/revenue-breakdown/category-breakdown",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getCategoryBreakdown,
);

router.get(
  "/revenue-breakdown/full",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  RevenueBreakdownController.getRevenueBreakdownFull,
);

export const RevenueBreakdownRoute = router;
