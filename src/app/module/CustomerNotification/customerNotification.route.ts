import { Role } from "@prisma/client";
import { Router } from "express";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { CustomerNotificationController } from "./customerNotification.controller.js";
import { updateCustomerNotificationSettingZodSchema } from "./customerNotification.validation.js";

const router = Router();

router.get(
  "/customer-notification",
  checkAuth(Role.CUSTOMER),
  CustomerNotificationController.getMyNotificationSetting,
);

router.put(
  "/customer-notification",
  checkAuth(Role.CUSTOMER),
  validateZodSchema(updateCustomerNotificationSettingZodSchema),
  CustomerNotificationController.updateMyNotificationSetting,
);

router.patch(
  "/customer-notification/disable-all",
  checkAuth(Role.CUSTOMER),
  CustomerNotificationController.disableAllMyNotifications,
);

router.patch(
  "/customer-notification/enable-all",
  checkAuth(Role.CUSTOMER),
  CustomerNotificationController.enableAllMyNotifications,
);

export const CustomerNotificationRoute = router;
