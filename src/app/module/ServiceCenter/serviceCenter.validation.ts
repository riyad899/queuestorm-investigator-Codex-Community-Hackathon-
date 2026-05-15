import z from "zod";

export const createServiceZodSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  icon: z.string().min(1, "Icon must not be empty").optional(),
});

export const createServiceCenterZodSchema = z.object({
  name: z.string().min(1, "Service center name is required"),
  slug: z.string().min(1, "Slug is required"),
  division: z.string().min(1, "Division is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
  mapLink: z.string().min(1, "Map link must not be empty").optional(),
  isFeatured: z.boolean().optional(),
  openTime: z.string().min(1, "Open time is required"),
  closeTime: z.string().min(1, "Close time is required"),
  services: z.array(z.string().min(1)).min(1, "At least one service is required"),
});
