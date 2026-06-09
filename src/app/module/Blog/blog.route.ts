import { Router } from "express";
import { BlogController } from "./blog.controller.js";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { createBlogCategorySchema, createAuthorSchema, createBlogBulkSchema, createBlogSchema, updateBlogSchema } from "./blog.validation.js";

const router = Router();

// Blog Category Routes
router.post(
  "/blog-category",
  validateZodSchema(createBlogCategorySchema),
  BlogController.createBlogCategory
);

router.get("/blog-category", BlogController.getBlogCategories);

// Author Routes
router.post(
  "/author",
  validateZodSchema(createAuthorSchema),
  BlogController.createAuthor
);

router.get("/author", BlogController.getAuthors);

// Blog Routes
router.post(
  "/blog",
  validateZodSchema(createBlogSchema),
  BlogController.createBlog
);

router.post(
  "/blog/bulk",
  validateZodSchema(createBlogBulkSchema),
  BlogController.createBlogBulk
);

router.get("/blog", BlogController.getBlogs);

router.get("/blog/:slug", BlogController.getBlogBySlug);

router.patch(
  "/blog/:id",
  validateZodSchema(updateBlogSchema),
  BlogController.updateBlog
);

router.delete("/blog/:id", BlogController.deleteBlog);

export const BlogRoute = router;
