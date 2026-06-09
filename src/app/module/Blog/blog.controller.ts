import { Request, Response } from "express";
import { BlogService } from "./blog.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import catchAsync from "../../shared/catchAsync.js";


export class BlogController {
  // Blog Category Handlers
  static createBlogCategory = catchAsync(
    async (req: Request, res: Response) => {
      const { name } = req.body;

      const category = await BlogService.createBlogCategory({ name });

      sendResponse(res, {
        httpStatus: 201,
        success: true,
        message: "Blog category created successfully",
        data: category,
      });
    }
  );

  static getBlogCategories = catchAsync(
    async (req: Request, res: Response) => {
      const categories = await BlogService.getBlogCategories();

      sendResponse(res, {
        httpStatus: 200,
        success: true,
        message: "Blog categories retrieved successfully",
        data: categories,
      });
    }
  );

  // Author Handlers
  static createAuthor = catchAsync(async (req: Request, res: Response) => {
    const { name, avatar } = req.body;

    const author = await BlogService.createAuthor({ name, avatar });

    sendResponse(res, {
      httpStatus: 201,
      success: true,
      message: "Author created successfully",
      data: author,
    });
  });

  static getAuthors = catchAsync(async (req: Request, res: Response) => {
    const authors = await BlogService.getAuthors();

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Authors retrieved successfully",
      data: authors,
    });
  });

  // Blog Handlers
  static createBlog = catchAsync(async (req: Request, res: Response) => {
    const { title, slug, excerpt, content, thumbnail, categoryId, authorId, readTime, tags } = req.body;

    const blog = await BlogService.createBlog({
      title,
      slug,
      excerpt,
      content,
      thumbnail,
      categoryId,
      authorId,
      readTime,
      tags,
    });

    sendResponse(res, {
      httpStatus: 201,
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  });

  static createBlogBulk = catchAsync(async (req: Request, res: Response) => {
    const blogs = await BlogService.createBlogBulk(req.body);

    sendResponse(res, {
      httpStatus: 201,
      success: true,
      message: "Blogs created successfully",
      data: blogs,
    });
  });

  static getBlogs = catchAsync(async (req: Request, res: Response) => {
    const { category, search } = req.query;

    const blogs = await BlogService.getBlogs(
      category as string | undefined,
      search as string | undefined
    );

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Blogs retrieved successfully",
      data: blogs,
    });
  });

  static getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;

    const blog = await BlogService.getBlogBySlug(slug as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Blog retrieved successfully",
      data: blog,
    });
  });

  static updateBlog = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, slug, excerpt, content, thumbnail, categoryId, authorId, readTime, tags } = req.body;

    const blog = await BlogService.updateBlog(id as string, {
      title,
      slug,
      excerpt,
      content,
      thumbnail,
      categoryId,
      authorId,
      readTime,
      tags,
    });

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  });

  static deleteBlog = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await BlogService.deleteBlog(id as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Blog deleted successfully",
      data: result,
    });
  });
}
