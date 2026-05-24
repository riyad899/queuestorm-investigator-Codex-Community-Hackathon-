import z from "zod";

export const createBrandZodSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  slug: z.string().min(1, "Brand slug is required"),
  logo: z.string().url().nullable().optional(),
  country: z.string().nullable().optional(),
  slogan: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const createBrandBulkZodSchema = z.array(createBrandZodSchema).min(1, "At least one brand is required");

export const assignBrandCategoryZodSchema = z.object({
  brandId: z.string().min(1, "Brand id is required"),
  categoryId: z.string().min(1, "Category id is required"),
});
