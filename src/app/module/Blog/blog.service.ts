import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";

import { ICreateBlogCategoryPayload, ICreateAuthorPayload, ICreateBlogPayload, IUpdateBlogPayload } from "./blog.interface";

export class BlogService {
  // Blog Category Methods
  static async createBlogCategory(data: ICreateBlogCategoryPayload) {
    try {
      // Check if category already exists
      const existingCategory = await prisma.blogCategory.findUnique({
        where: { name: data.name },
      });

      if (existingCategory) {
        throw new AppError("Blog category already exists", 400);
      }

      const category = await prisma.blogCategory.create({
        data: {
          name: data.name,
        },
      });

      return category;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create blog category", 500);
    }
  }

  static async getBlogCategories() {
    try {
      const categories = await prisma.blogCategory.findMany({
        orderBy: { createdAt: "desc" },
      });

      return categories;
    } catch (error) {
      throw new AppError("Failed to fetch blog categories", 500);
    }
  }

  // Author Methods
  static async createAuthor(data: ICreateAuthorPayload) {
    try {
      const author = await prisma.author.create({
        data: {
          name: data.name,
          avatar: data.avatar,
        },
      });

      return author;
    } catch (error) {
      throw new AppError("Failed to create author", 500);
    }
  }

  static async getAuthors() {
    try {
      const authors = await prisma.author.findMany({
        orderBy: { createdAt: "desc" },
      });

      return authors;
    } catch (error) {
      throw new AppError("Failed to fetch authors", 500);
    }
  }

  // Blog Methods
  static async createBlog(data: ICreateBlogPayload) {
    try {
      // Validate category exists
      const category = await prisma.blogCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new AppError("Blog category not found", 404);
      }

      // Validate author exists
      const author = await prisma.author.findUnique({
        where: { id: data.authorId },
      });

      if (!author) {
        throw new AppError("Author not found", 404);
      }

      // Check if slug already exists
      const existingBlog = await prisma.blog.findUnique({
        where: { slug: data.slug },
      });

      if (existingBlog) {
        throw new AppError("Blog with this slug already exists", 400);
      }

      const blog = await prisma.blog.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          thumbnail: data.thumbnail,
          categoryId: data.categoryId,
          authorId: data.authorId,
          readTime: data.readTime,
          tags: {
            create: data.tags.map((name: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        },
        include: {
          category: true,
          author: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      return blog;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create blog", 500);
    }
  }

  static async getBlogs(category?: string, search?: string) {
    try {
      const blogs = await prisma.blog.findMany({
        where: {
          AND: [
            category
              ? {
                  category: {
                    name: {
                      equals: category,
                      mode: "insensitive",
                    },
                  },
                }
              : {},
            search
              ? {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                }
              : {},
          ],
        },
        include: {
          category: true,
          author: true,
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { publishedAt: "desc" },
      });

      return blogs;
    } catch (error) {
      throw new AppError("Failed to fetch blogs", 500);
    }
  }

  static async getBlogBySlug(slug: string) {
    try {
      const blog = await prisma.blog.findUnique({
        where: { slug },
        include: {
          category: true,
          author: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      if (!blog) {
        throw new AppError("Blog not found", 404);
      }

      return blog;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to fetch blog", 500);
    }
  }

  static async updateBlog(id: string, data: IUpdateBlogPayload) {
    try {
      // Verify blog exists
      const blog = await prisma.blog.findUnique({
        where: { id },
      });

      if (!blog) {
        throw new AppError("Blog not found", 404);
      }

      // Validate category if provided
      if (data.categoryId) {
        const category = await prisma.blogCategory.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          throw new AppError("Blog category not found", 404);
        }
      }

      // Validate author if provided
      if (data.authorId) {
        const author = await prisma.author.findUnique({
          where: { id: data.authorId },
        });

        if (!author) {
          throw new AppError("Author not found", 404);
        }
      }

      // Check if new slug conflicts
      if (data.slug && data.slug !== blog.slug) {
        const existingBlog = await prisma.blog.findUnique({
          where: { slug: data.slug },
        });

        if (existingBlog) {
          throw new AppError("Blog with this slug already exists", 400);
        }
      }

      // Handle tags update
      let tagsUpdate = undefined;
      if (data.tags) {
        // Delete existing tags for this blog
        await prisma.blogTag.deleteMany({
          where: { blogId: id },
        });

        // Create new tags
        tagsUpdate = {
          create: data.tags.map((name: string) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        };
      }

      const updatedBlog = await prisma.blog.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          thumbnail: data.thumbnail,
          categoryId: data.categoryId,
          authorId: data.authorId,
          readTime: data.readTime,
          ...(tagsUpdate && { tags: tagsUpdate }),
        },
        include: {
          category: true,
          author: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      return updatedBlog;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update blog", 500);
    }
  }

  static async deleteBlog(id: string) {
    try {
      const blog = await prisma.blog.findUnique({
        where: { id },
      });

      if (!blog) {
        throw new AppError("Blog not found", 404);
      }

      await prisma.blog.delete({
        where: { id },
      });

      return { message: "Blog deleted successfully" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete blog", 500);
    }
  }
}
