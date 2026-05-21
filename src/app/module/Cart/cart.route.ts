import { Router } from "express";
import { Role } from "@prisma/client";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { checkAuth } from "../../../middleware/checkAuth.js";
import { CartController } from "./cart.controller.js";
import { addCartItemZodSchema, updateCartItemZodSchema } from "./cart.validation.js";

const router = Router();

router.get("/cart", CartController.getCart);
router.post("/cart/items", validateZodSchema(addCartItemZodSchema), CartController.addItem);
router.patch(
  "/cart/items/:productId",
  validateZodSchema(updateCartItemZodSchema),
  CartController.updateItem,
);
router.delete("/cart/items/:productId", CartController.removeItem);

export const CartRoute = router;
