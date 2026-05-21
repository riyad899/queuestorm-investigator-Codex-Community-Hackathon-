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
router.post(
  "/coupon",
  validateZodSchema(createCouponZodSchema),
  couponController.createCoupon,
);
router.get("/coupon", couponController.getCoupons);
router.get("/coupon/:id", couponController.getCouponById);
router.patch(
  "/coupon/:id",
  validateZodSchema(updateCouponZodSchema),
  couponController.updateCoupon,
);

export const CouponRoute = router;
