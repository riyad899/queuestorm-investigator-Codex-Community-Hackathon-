import { Role } from "@prisma/client";
import { Router } from "express";
import { checkAuth } from "../../../middleware/checkAuth.js";
import * as DashboardOverviewController from "./dashboardOverview.controller.js";

const router = Router();

router.get(
  "/dashboard-overview/cards",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getOverviewCards,
);

router.get(
  "/dashboard-overview/monthly-revenue",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getMonthlyRevenue,
);

router.get(
  "/dashboard-overview/orders-by-status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getOrdersByStatus,
);

router.get(
  "/dashboard-overview/recent-orders",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getRecentOrders,
);

router.get(
  "/dashboard-overview/sales-by-category",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getSalesByCategory,
);

router.get(
  "/dashboard-overview/low-stock-alerts",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getLowStockAlerts,
);

router.get(
  "/dashboard-overview/full",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardOverviewController.getFullOverview,
);

export const DashboardOverviewRoute = router;
