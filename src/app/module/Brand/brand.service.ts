import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  IAssignBrandCategoryPayload,
  IBrandQuery,
  ICreateBrandBulkPayload,
  ICreateBrandPayload,
} from "./brand.interface.js";

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

const createBrandBulk = async (payload: ICreateBrandBulkPayload) => {
  const cleanedBrands = payload.map((brand: ICreateBrandPayload) => ({
    name: brand.name.trim(),
    slug: brand.slug.trim().toLowerCase(),
    logo: brand.logo ?? null,
    country: brand.country ?? null,
    slogan: brand.slogan ?? null,
    description: brand.description ?? null,
  }));

  const slugCountMap: Record<string, number> = cleanedBrands.reduce((acc, brand) => {
    acc[brand.slug] = (acc[brand.slug] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicateSlugs = Object.keys(slugCountMap).filter((slug) => slugCountMap[slug] > 1);

  if (duplicateSlugs.length > 0) {
    throw new AppError(
      `Duplicate brand slugs in payload: ${duplicateSlugs.join(", ")}`,
      status.BAD_REQUEST,
    );
  }

  const slugs = cleanedBrands.map((brand) => brand.slug);

  const existingBrands = await prisma.brand.findMany({
    where: {
      slug: {
        in: slugs,
        mode: "insensitive",
      },
    },
    select: { slug: true },
  });

  if (existingBrands.length > 0) {
    throw new AppError(
      `Brand(s) already exist: ${existingBrands.map((brand) => brand.slug).join(", ")}`,
      status.CONFLICT,
    );
  }

  await prisma.brand.createMany({
    data: cleanedBrands,
  });

  return prisma.brand.findMany({
    where: {
      slug: {
        in: slugs,
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
  createBrandBulk,
  assignCategory,
  getBrands,
  getBrandBySlug,
};
