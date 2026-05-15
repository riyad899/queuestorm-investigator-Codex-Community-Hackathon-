import z from "zod";

export const updateCustomerNotificationSettingZodSchema = z
  .object({
    newProductsArrive: z.boolean().optional(),
    latestOffersAdd: z.boolean().optional(),
    orderPurchasedSuccessfully: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one customer notification field is required for update",
  });
