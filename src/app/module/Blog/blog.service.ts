import status from "http-status";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";

import { ICreateBlogCategoryPayload, ICreateAuthorPayload, ICreateBlogBulkPayload, ICreateBlogPayload, IUpdateBlogPayload } from "./blog.interface.js";

const createBlogRecord = async (
  db: Prisma.TransactionClient,
  data: ICreateBlogPayload
) => {
  const category = await db.blogCategory.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new AppError("Blog category not found", status.NOT_FOUND);
  }

  const author = await db.author.findUnique({
    where: { id: data.authorId },
  });

  if (!author) {
    throw new AppError("Author not found", status.NOT_FOUND);
  }

  const existingBlog = await db.blog.findUnique({
    where: { slug: data.slug },
  });

  if (existingBlog) {
    throw new AppError("Blog with this slug already exists", status.CONFLICT);
  }

  return db.blog.create({
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
};

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
      return await createBlogRecord(prisma, data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create blog", 500);
    }
  }

  static async createBlogBulk(payload: ICreateBlogBulkPayload) {
    try {
      const slugCounts = payload.reduce((acc, blog) => {
        acc[blog.slug] = (acc[blog.slug] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicateSlugs = Object.keys(slugCounts).filter((slug) => slugCounts[slug] > 1);

      if (duplicateSlugs.length > 0) {
        throw new AppError(
          `Duplicate blog slugs in payload: ${duplicateSlugs.join(", ")}`,
          status.BAD_REQUEST,
        );
      }

      // Batch strategy:
      // 1. Validate slugs don't exist
      // 2. Ensure categories/authors exist
      // 3. Collect unique tags, create missing tags via createMany
      // 4. Create blogs via createMany (assign ids) and then create BlogTag join rows via createMany

      const slugs = payload.map((p) => p.slug);

      const existingBlogs = await prisma.blog.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });

      if (existingBlogs.length > 0) {
        throw new AppError(
          `Blog(s) already exist: ${existingBlogs.map((b) => b.slug).join(", ")}`,
          status.CONFLICT,
        );
      }

      // Validate categories and authors in batch
      const categoryIds = Array.from(new Set(payload.map((p) => p.categoryId)));
      const authorIds = Array.from(new Set(payload.map((p) => p.authorId)));

      const existingCategories = await prisma.blogCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true },
      });
      const missingCategories = categoryIds.filter((id) => !existingCategories.find((c) => c.id === id));
      if (missingCategories.length > 0) {
        throw new AppError(`Blog category not found: ${missingCategories.join(", ")}`, status.NOT_FOUND);
      }

      const existingAuthors = await prisma.author.findMany({
        where: { id: { in: authorIds } },
        select: { id: true },
      });
      const missingAuthors = authorIds.filter((id) => !existingAuthors.find((a) => a.id === id));
      if (missingAuthors.length > 0) {
        throw new AppError(`Author not found: ${missingAuthors.join(", ")}`, status.NOT_FOUND);
      }

      // Tags: collect unique names
      const tagNames = Array.from(new Set(payload.flatMap((p) => p.tags.map((t) => t.trim()))));

      // Fetch existing tags
      const existingTags = await prisma.tag.findMany({ where: { name: { in: tagNames } }, select: { id: true, name: true } });
      const existingTagNames = new Set(existingTags.map((t) => t.name));

      const missingTagNames = tagNames.filter((n) => !existingTagNames.has(n));

      if (missingTagNames.length > 0) {
        // createMany for missing tags; skipDuplicates in case of race
        await prisma.tag.createMany({ data: missingTagNames.map((name) => ({ name })), skipDuplicates: true });
      }

      // Reload all tags to get ids
      const allTags = await prisma.tag.findMany({ where: { name: { in: tagNames } }, select: { id: true, name: true } });
      const tagMap = allTags.reduce((acc, t) => ({ ...acc, [t.name]: t.id }), {} as Record<string, string>);

      // Prepare blog records with generated ids
      const blogRecords = payload.map((p) => ({
        id: randomUUID(),
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        thumbnail: p.thumbnail ?? null,
        categoryId: p.categoryId,
        authorId: p.authorId,
        readTime: p.readTime,
      }));

      // Insert blogs in batches to avoid overly large createMany operations
      const BATCH_SIZE = Number(process.env.BULK_BLOG_BATCH_SIZE ?? "100");
      for (let i = 0; i < blogRecords.length; i += BATCH_SIZE) {
        const chunk = blogRecords.slice(i, i + BATCH_SIZE);
        await prisma.blog.createMany({ data: chunk, skipDuplicates: false });
      }

      // Create blog-tag join rows
      const blogTagRows: { id: string; blogId: string; tagId: string }[] = [];
      for (let i = 0; i < payload.length; i++) {
        const p = payload[i];
        const blogId = blogRecords[i].id;
        for (const tagName of p.tags.map((t) => t.trim())) {
          const tagId = tagMap[tagName];
          if (tagId) {
            blogTagRows.push({ id: randomUUID(), blogId, tagId });
          }
        }
      }

      // Insert blogTag rows in batches
      for (let i = 0; i < blogTagRows.length; i += BATCH_SIZE) {
        const chunk = blogTagRows.slice(i, i + BATCH_SIZE);
        await prisma.blogTag.createMany({ data: chunk, skipDuplicates: true });
      }

      // Return created blogs with relations populated
      const created = await prisma.blog.findMany({
        where: { slug: { in: slugs } },
        include: {
          category: true,
          author: true,
          tags: { include: { tag: true } },
        },
      });

      return created;
    } catch (error) {
      console.error("[BlogService.createBlogBulk] error:", error);
      const errAny = error as any;
      if (errAny?.code === "P2028") {
        // Prisma transaction couldn't start in time — surface as 503
        throw new AppError("Database busy: transaction timeout, try again", 503);
      }
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create blogs", 500);
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
