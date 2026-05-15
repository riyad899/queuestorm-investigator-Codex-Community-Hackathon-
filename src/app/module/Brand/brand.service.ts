import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IAssignBrandCategoryPayload, IBrandQuery, ICreateBrandPayload } from "./brand.interface.js";

const createBrand = async (payload: ICreateBrandPayload) => {
  const name = payload.name.trim();
  const slug = payload.slug.trim().toLowerCase();

  const existing = await prisma.brand.findFirst({
    where: {
      slug: {
        equals: slug,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError("Brand already exists", status.CONFLICT);
  }

  return prisma.brand.create({
    data: {
      name,
      slug,
      logo: payload.logo ?? null,
      country: payload.country ?? null,
      slogan: payload.slogan ?? null,
      description: payload.description ?? null,
    },
  });
};

const assignCategory = async (payload: IAssignBrandCategoryPayload) => {
  const brand = await prisma.brand.findUnique({ where: { id: payload.brandId } });
  if (!brand) {
    throw new AppError("Brand not found", status.NOT_FOUND);
  }

  const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
  if (!category) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  const existing = await prisma.brandCategory.findFirst({
    where: {
      brandId: payload.brandId,
      categoryId: payload.categoryId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.brandCategory.create({
    data: {
      brandId: payload.brandId,
      categoryId: payload.categoryId,
    },
    include: {
      brand: true,
      category: true,
    },
  });
};

const getBrands = async (query: IBrandQuery) => {
  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  const category = typeof query.category === "string" ? query.category.trim() : undefined;

  return prisma.brand.findMany({
    where: {
      AND: [
        search
          ? {
              name: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        category
          ? {
              categories: {
                some: {
                  category: {
                    slug: category,
                  },
                },
              },
            }
          : {},
      ],
    },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

const getBrandBySlug = async (slug: string) => {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: true },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!brand) {
    throw new AppError("Brand not found", status.NOT_FOUND);
  }

  return brand;
};

export const BrandService = {
  createBrand,
  assignCategory,
  getBrands,
  getBrandBySlug,
};
