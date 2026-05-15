import z from "zod";

const methodKeySchema = z
  .string()
  .min(1, "Key is required")
  .transform((v) => v.trim());

const paymentMethodSchema = z.object({
  key: methodKeySchema,
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  isActive: z.boolean().optional(),
  accountNumber: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  qrCodeUrl: z.string().url().optional(),
});

const deliveryMethodSchema = z.object({
  key: methodKeySchema,
  name: z.string().min(1, "Name is required").transform((v) => v.trim()),
  fee: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const upsertPaymentSettingZodSchema = z
  .object({
    topMessage: z.string().min(1).optional(),
    paymentMethods: z.array(paymentMethodSchema).optional(),
    deliveryMethods: z.array(deliveryMethodSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one payment setting field is required",
  });
