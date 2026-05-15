import z from "zod";

const colorHexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const categoryOrderItemSchema = z.object({
  categoryId: z.string().min(1, "Category id is required"),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const upsertHomeBannerSettingZodSchema = z.object({
  middleBanner: z.array(z.string().url()).min(1, "At least one middle banner is required").max(3, "Middle banners maximum is 3"),
  sideBanner: z.array(z.string().url()).max(2, "Side banners maximum is 2").optional().default([]),
  recommendedBanners: z.array(z.string().url()).max(2, "Recommended banners maximum is 2").optional().default([]),
});

export const createLogoSliderItemZodSchema = z.object({
  name: z.string().min(1, "Slider item name is required"),
  logoUrl: z.string().url("Valid logo url is required"),
  linkUrl: z.string().url().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateLogoSliderItemZodSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional(),
  linkUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one slider item field is required for update",
});

export const createSiteThemeZodSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  colorPrimaryBg: z.string().regex(colorHexRegex, "Invalid colorPrimaryBg"),
  colorSecondaryCard: z.string().regex(colorHexRegex, "Invalid colorSecondaryCard"),
  colorButton: z.string().regex(colorHexRegex, "Invalid colorButton"),
  colorIcon: z.string().regex(colorHexRegex, "Invalid colorIcon"),
  colorIconMuted: z.string().regex(colorHexRegex, "Invalid colorIconMuted"),
  colorBar: z.string().regex(colorHexRegex, "Invalid colorBar"),
  colorFont: z.string().regex(colorHexRegex, "Invalid colorFont"),
  colorBorderShade: z.string().regex(colorHexRegex, "Invalid colorBorderShade"),
  isActive: z.boolean().optional(),
});

export const updateSiteThemeZodSchema = z.object({
  name: z.string().min(1).optional(),
  colorPrimaryBg: z.string().regex(colorHexRegex).optional(),
  colorSecondaryCard: z.string().regex(colorHexRegex).optional(),
  colorButton: z.string().regex(colorHexRegex).optional(),
  colorIcon: z.string().regex(colorHexRegex).optional(),
  colorIconMuted: z.string().regex(colorHexRegex).optional(),
  colorBar: z.string().regex(colorHexRegex).optional(),
  colorFont: z.string().regex(colorHexRegex).optional(),
  colorBorderShade: z.string().regex(colorHexRegex).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one theme field is required for update",
});

export const setFeaturedCategoriesZodSchema = z.object({
  categoryIds: z.array(z.string().min(1)).min(1, "At least one category id is required"),
});

export const setPopularCategoriesZodSchema = z.object({
  items: z.array(categoryOrderItemSchema),
});

export const setRecommendedCategoriesZodSchema = z.object({
  items: z.array(categoryOrderItemSchema),
});

export const createTestimonialZodSchema = z.object({
  description: z.string().min(1, "Description is required"),
  userImage: z.string().url("Valid user image url is required"),
  userName: z.string().min(1, "User name is required"),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const updateTestimonialZodSchema = z.object({
  description: z.string().min(1).optional(),
  userImage: z.string().url().optional(),
  userName: z.string().min(1).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one testimonial field is required for update",
});
