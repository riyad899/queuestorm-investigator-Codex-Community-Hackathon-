import z from "zod";

export const upsertBigAdZodSchema = z.object({
  bigAdImage: z.string().url("Big ad image must be a valid URL"),
});

export const upsertSideAdsZodSchema = z.object({
  sideAdImages: z.array(z.string().url("Each side ad image must be a valid URL")).min(2, "At least two side ad images are required").max(2, "Exactly two side ad images are required"),
});
