import { Router } from "express";
import { Role } from "@prisma/client";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import * as paymentSettingController from "./paymentSetting.controller.js";
import { upsertPaymentSettingZodSchema } from "./paymentSetting.validation.js";

const router = Router();

router.get("/payment-setting", paymentSettingController.getPaymentSetting);
router.put(
  "/payment-setting",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(upsertPaymentSettingZodSchema),
  paymentSettingController.upsertPaymentSetting,
);

export const PaymentSettingRoute = router;
