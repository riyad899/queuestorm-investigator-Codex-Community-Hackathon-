import { Router } from "express";
import { Role } from "@prisma/client";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import * as orderController from "./order.controller.js";
import {
  createOrderZodSchema,
  updateOrderDeliveryZodSchema,
  updateOrderPaymentZodSchema,
} from "./order.validation.js";

const router = Router();

// Checkout (public)
router.post("/order", validateZodSchema(createOrderZodSchema), orderController.createOrder);

// Dashboard (protected)
router.get("/order", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF), orderController.getOrders);
router.get("/order/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF), orderController.getOrderById);
router.patch(
  "/order/:id/payment",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(updateOrderPaymentZodSchema),
  orderController.updateOrderPayment,
);
router.patch(
  "/order/:id/delivery",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.STAFF),
  validateZodSchema(updateOrderDeliveryZodSchema),
  orderController.updateOrderDelivery,
);

export const OrderRoute = router;
