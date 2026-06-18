import { Router } from "express";
import { Role } from "@prisma/client";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import * as couponController from "./coupon.controller.js";
import {
  createCouponZodSchema,
  updateCouponZodSchema,
  validateCouponZodSchema,
} from "./coupon.validation.js";

const router = Router();

// Public validation endpoint for checkout
router.post("/coupon/validate", validateZodSchema(validateCouponZodSchema), couponController.validateCoupon);

// Dashboard coupon management
router.delete("/coupon/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), couponController.deleteCoupon);
router.post(
  "/coupon",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateZodSchema(createCouponZodSchema),
  couponController.createCoupon,
);
router.get("/coupon", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF), couponController.getCoupons);
router.get("/coupon/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF), couponController.getCouponById);
router.patch(
  "/coupon/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateZodSchema(updateCouponZodSchema),
  couponController.updateCoupon,
);

export const CouponRoute = router;
