import { Router } from "express";
import { Role } from "@prisma/client";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { CartController } from "./cart.controller.js";
import { addCartItemZodSchema, updateCartItemZodSchema } from "./cart.validation.js";

const router = Router();

router.get("/cart", checkAuth(Role.CUSTOMER), CartController.getCart);
router.post(
  "/cart/items",
  checkAuth(Role.CUSTOMER),
  validateZodSchema(addCartItemZodSchema),
  CartController.addItem,
);
router.patch(
  "/cart/items/:productId",
  checkAuth(Role.CUSTOMER),
  validateZodSchema(updateCartItemZodSchema),
  CartController.updateItem,
);
router.delete("/cart/items/:productId", checkAuth(Role.CUSTOMER), CartController.removeItem);

export const CartRoute = router;
