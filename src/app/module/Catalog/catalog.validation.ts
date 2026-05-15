import z from "zod";

const specificationItemSchema = z.object({
  fieldId: z.string().min(1, "Field id is required"),
  value: z.string().min(1, "Specification value is required"),
});

export const createCategoryZodSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  isFeatured: z.boolean().optional(),
  icon: z.string().url().optional(),
  image: z.string().url().optional(),
});

export const updateCategoryZodSchema = z.object({
  name: z.string().min(1).optional(),
  isFeatured: z.boolean().optional(),
  icon: z.string().url().nullable().optional(),
  image: z.string().url().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one category field is required for update",
});

export const createSubCategoryZodSchema = z.object({
  name: z.string().min(1, "Subcategory name is required"),
  categoryId: z.string().min(1, "Category id is required"),
});

export const createSpecificationGroupZodSchema = z.object({
  name: z.string().min(1, "Specification group name is required"),
  subCategoryId: z.string().min(1, "Subcategory id is required"),
});

export const createSpecificationFieldZodSchema = z.object({
  name: z.string().min(1, "Specification field name is required"),
  groupId: z.string().min(1, "Group id is required"),
  type: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).optional(),
});

export const createProductZodSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  price: z.number({ error: "Price is required" }).nonnegative("Price must be greater than or equal to 0"),
  discountPrice: z.number().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  likeCount: z.number().int().nonnegative().optional(),
  brandId: z.string().min(1, "Brand id is required"),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  subCategoryId: z.string().min(1, "Subcategory id is required"),
  specifications: z.array(specificationItemSchema).optional(),
});

export const updateProductZodSchema = z.object({
  title: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  discountPrice: z.number().nonnegative().nullable().optional(),
  quantity: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  likeCount: z.number().int().nonnegative().optional(),
  brandId: z.string().min(1).nullable().optional(),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  subCategoryId: z.string().min(1).optional(),
  specifications: z.array(specificationItemSchema).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one product field is required for update",
});