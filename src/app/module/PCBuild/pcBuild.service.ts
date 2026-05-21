import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";

const buildProductInclude = {
  brand: true,
  subCategory: {
    include: {
      category: true,
    },
  },
  specifications: {
    include: {
      field: {
        select: {
          id: true,
          name: true,
          type: true,
          options: true,
        },
      },
    },
  },
} as const;

const findCategory = async (identifier: string) => {
  return prisma.category.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: { equals: identifier, mode: "insensitive" } }],
    },
  });
};

const getCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      subCategories: {
        orderBy: { name: "asc" },
      },
    },
  });

  return {
    total: categories.length,
    data: categories,
  };
};

const getCategoryComponents = async (identifier: string) => {
  const category = await findCategory(identifier);

  if (!category) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  const components = await prisma.subCategory.findMany({
    where: { categoryId: category.id },
    orderBy: { name: "asc" },
  });

  return {
    category,
    total: components.length,
    data: components,
  };
};

const getCategoryProducts = async (
  identifier: string,
  query: Record<string, string | string[] | undefined>,
) => {
  const category = await findCategory(identifier);

  if (!category) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  const isFeatured =
    typeof query.isFeatured === "string"
      ? query.isFeatured.toLowerCase() === "true"
        ? true
        : query.isFeatured.toLowerCase() === "false"
          ? false
          : undefined
      : undefined;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.max(1, Number(query.limit ?? 20) || 20);
  const skip = (page - 1) * limit;

  const where = {
    subCategory: {
      categoryId: category.id,
    },
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(isFeatured !== undefined ? { isFeatured } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: buildProductInclude,
      skip,
      take: limit,
    }),
  ]);

  return {
    category,
    page,
    limit,
    total,
    data,
  };
};

const getSubCategoryProducts = async (subCategoryId: string, query: Record<string, string | string[] | undefined>) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    include: { category: true },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.max(1, Number(query.limit ?? 20) || 20);
  const skip = (page - 1) * limit;

  const where = {
    subCategoryId,
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: buildProductInclude,
      skip,
      take: limit,
    }),
  ]);

  return {
    subCategory,
    page,
    limit,
    total,
    data,
  };
};

export const PCBuildService = {
  getCategories,
  getCategoryComponents,
  getCategoryProducts,
  getSubCategoryProducts,
};