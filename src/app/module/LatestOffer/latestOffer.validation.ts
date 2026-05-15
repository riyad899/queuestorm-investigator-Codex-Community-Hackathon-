import z from "zod";

export const createLatestOfferZodSchema = z.object({
  title: z.string().min(1, "Latest offer title is required"),
  description: z.string().optional(),
  offerStartAt: z.coerce.date(),
  offerEndAt: z.coerce.date(),
  isActive: z.boolean().optional(),
}).refine((value) => value.offerEndAt > value.offerStartAt, {
  message: "Offer end time must be after start time",
  path: ["offerEndAt"],
});

export const updateLatestOfferZodSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  offerStartAt: z.coerce.date().optional(),
  offerEndAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => {
  if (value.offerStartAt && value.offerEndAt) {
    return value.offerEndAt > value.offerStartAt;
  }

  return true;
}, {
  message: "Offer end time must be after start time",
  path: ["offerEndAt"],
});
