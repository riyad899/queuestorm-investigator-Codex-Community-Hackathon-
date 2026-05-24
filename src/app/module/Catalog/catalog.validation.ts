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

export const createCategoryBulkZodSchema = z
  .array(createCategoryZodSchema)
  .min(1, "At least one category is required");

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

export const createSpecificationGroupBulkZodSchema = z
  .array(createSpecificationGroupZodSchema)
  .min(1, "At least one specification group is required");

export const createSpecificationFieldZodSchema = z.object({
  name: z.string().min(1, "Specification field name is required"),
  groupId: z.string().min(1, "Group id is required"),
  type: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).optional(),
  isFeatured: z.boolean().optional(),
});

export const createSpecificationFieldBulkZodSchema = z
  .array(createSpecificationFieldZodSchema)
  .min(1, "At least one specification field is required");

export const setSpecificationFieldFeatureZodSchema = z.object({
  fieldIds: z.array(z.string()).optional(),
  isFeatured: z.boolean(),
});

export const createProductZodSchema = z.object({
  title: z.string().min(1, "Product title is required"),
  description: z.string().optional(),
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
  subCategoryIds: z.array(z.string().min(1)).optional(),
  specifications: z.array(specificationItemSchema).optional(),
});

export const createProductBulkZodSchema = z
  .array(createProductZodSchema)
  .min(1, "At least one product is required");

export const updateProductZodSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
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
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one product field is required for update",
});

export const updateProductSpecificationZodSchema = z.object({
  fieldId: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
}).refine((v) => !!v.fieldId || !!v.value, {
  message: "At least one of fieldId or value is required",
});

export const updateProductSpecificationsBulkZodSchema = z.object({
  specifications: z
    .array(
      z.object({
        id: z.string().optional(),
        fieldId: z.string().min(1, "Field id is required"),
        value: z.string().min(1, "Specification value is required"),
      }),
    )
    .min(1, "At least one specification is required"),
});