import z from "zod";

export const addCartItemZodSchema = z.object({
  productId: z.string().min(1, "Product id is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const updateCartItemZodSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
});
