import { z } from "zod";

export const createBlogCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

export const createAuthorSchema = z.object({
  name: z.string().min(1, "Author name is required"),
  avatar: z.string().url().optional(),
});

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  thumbnail: z.string().url().optional(),
  categoryId: z.string().min(1, "Category ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  readTime: z.number().int().positive("Read time must be a positive integer"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
});

export const createBlogBulkSchema = z
  .array(createBlogSchema)
  .min(1, "At least one blog is required");

export const updateBlogSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  thumbnail: z.string().url().optional(),
  categoryId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  readTime: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type CreateBlogBulkInput = z.infer<typeof createBlogBulkSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
