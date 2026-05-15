import { Role } from "@prisma/client";
import { Router } from "express";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { DashboardNotificationController } from "./dashboardNotification.controller.js";
import { updateDashboardNotificationSettingZodSchema } from "./dashboardNotification.validation.js";

const router = Router();

router.get(
  "/dashboard-notification",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardNotificationController.getNotificationSetting,
);

router.put(
  "/dashboard-notification",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(updateDashboardNotificationSettingZodSchema),
  DashboardNotificationController.updateNotificationSetting,
);

router.patch(
  "/dashboard-notification/disable-all",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardNotificationController.disableAllNotifications,
);

router.patch(
  "/dashboard-notification/enable-all",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  DashboardNotificationController.enableAllNotifications,
);

export const DashboardNotificationRoute = router;
