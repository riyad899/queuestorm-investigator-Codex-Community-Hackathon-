import z from "zod";

export const updateDashboardNotificationSettingZodSchema = z
  .object({
    orderUpdates: z.boolean().optional(),
    lowStockAlerts: z.boolean().optional(),
    newUserRegistrations: z.boolean().optional(),
    revenueReports: z.boolean().optional(),
    promotionsOffers: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one notification setting is required for update",
  });
