import { DiscountType } from "@prisma/client";
import z from "zod";

const couponCodeSchema = z
  .string()
  .min(1, "Coupon code is required")
  .transform((v) => v.trim().toUpperCase());

const productIdsSchema = z.array(z.string().min(1)).optional();

export const createCouponZodSchema = z
  .object({
    code: couponCodeSchema,
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),

    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive("Discount value must be > 0"),
    maxDiscount: z.number().positive().optional(),

    minOrderAmount: z.number().nonnegative().optional(),
    usageLimit: z.number().int().positive().optional(),

    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),

    isActive: z.boolean().optional(),

    productIds: productIdsSchema,
  })
  .refine(
    (v) => (v.endsAt && v.startsAt ? v.endsAt > v.startsAt : true),
    { message: "endsAt must be after startsAt", path: ["endsAt"] },
  )
  .refine(
    (v) => (v.discountType === DiscountType.PERCENT ? v.discountValue <= 100 : true),
    { message: "Percent discount cannot exceed 100", path: ["discountValue"] },
  );

export const updateCouponZodSchema = z
  .object({
    code: couponCodeSchema.optional(),
    title: z.string().min(1).nullable().optional(),
    description: z.string().min(1).nullable().optional(),

    discountType: z.nativeEnum(DiscountType).optional(),
    discountValue: z.number().positive().optional(),
    maxDiscount: z.number().positive().nullable().optional(),

    minOrderAmount: z.number().nonnegative().nullable().optional(),
    usageLimit: z.number().int().positive().nullable().optional(),

    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),

    isActive: z.boolean().optional(),

    productIds: productIdsSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  })
  .refine(
    (v) => (v.endsAt && v.startsAt ? v.endsAt > v.startsAt : true),
    { message: "endsAt must be after startsAt", path: ["endsAt"] },
  )
  .refine(
    (v) => (v.discountType === DiscountType.PERCENT && v.discountValue !== undefined ? v.discountValue <= 100 : true),
    { message: "Percent discount cannot exceed 100", path: ["discountValue"] },
  );

export const validateCouponZodSchema = z.object({
  code: couponCodeSchema,
  deliveryMethodKey: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "At least one item is required"),
});
