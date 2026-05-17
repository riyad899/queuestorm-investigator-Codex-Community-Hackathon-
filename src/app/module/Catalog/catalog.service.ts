import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICatalogFilterQuery,
  ICreateCategoryPayload,
  ICreateCategoryBulkPayload,
  IUpdateCategoryPayload,
  ICreateProductPayload,
  ICreateSpecificationFieldPayload,
  ICreateSpecificationGroupPayload,
  ICreateSubCategoryPayload,
  IUpdateProductPayload,
} from "./catalog.interface.js";

const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFilterValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getBooleanFilterValue = (value: string | string[] | undefined) => {
  const filterValue = getFilterValue(value);

  if (filterValue === undefined) {
    return undefined;
  }

  if (filterValue.toLowerCase() === "true") {
    return true;
  }

  if (filterValue.toLowerCase() === "false") {
    return false;
  }

  return undefined;
};

const getNumberFilterValue = (value: string | string[] | undefined) => {
  const filterValue = getFilterValue(value);

  if (filterValue === undefined) {
    return undefined;
  }

  const parsedValue = Number(filterValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const syncProductWithLatestOffer = async (productId: string, isFeatured: boolean) => {
  const activeLatestOffer = await prisma.latestOffer.findFirst({
    where: {
      isActive: true,
      offerStartAt: { lte: new Date() },
      offerEndAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activeLatestOffer) {
    return;
  }

  if (isFeatured) {
    await prisma.latestOfferProduct.upsert({
      where: {
        latestOfferId_productId: {
          latestOfferId: activeLatestOffer.id,
          productId,
        },
      },
      create: {
        latestOfferId: activeLatestOffer.id,
        productId,
      },
      update: {},
    });
    return;
  }

  await prisma.latestOfferProduct.deleteMany({
    where: {
      latestOfferId: activeLatestOffer.id,
      productId,
    },
  });
};

const createCategory = async (payload: ICreateCategoryPayload) => {
  const name = payload.name.trim();
  const slug = slugify(name);

  const existing = await prisma.category.findFirst({
    where: {
      slug: {
        equals: slug,
        mode: "insensitive",
      },
    },
  });

  if (existing) {
    throw new AppError("Category already exists", status.CONFLICT);
  }

  return prisma.category.create({
    data: {
      name,
      slug,
      isFeatured: payload.isFeatured ?? false,
      icon: payload.icon,
      image: payload.image,
    },
  });
};

const createCategoryBulk = async (payload: ICreateCategoryBulkPayload) => {
  const normalized = payload.map((item) => {
    const name = item.name.trim();
    return {
      name,
      slug: slugify(name),
      isFeatured: item.isFeatured ?? false,
      icon: item.icon,
      image: item.image,
    };
  });

  const seenSlugs = new Set<string>();
  const duplicateSlugs: string[] = [];
  const uniqueItems = normalized.filter((item) => {
    if (seenSlugs.has(item.slug)) {
      duplicateSlugs.push(item.slug);
      return false;
    }

    seenSlugs.add(item.slug);
    return true;
  });

  if (uniqueItems.length === 0) {
    return {
      total: payload.length,
      created: [],
      skipped: {
        existing: [],
        duplicatesInPayload: duplicateSlugs,
      },
    };
  }

  const existing = await prisma.category.findMany({
    where: {
      slug: {
        in: uniqueItems.map((item) => item.slug),
      },
    },
    select: { slug: true },
  });

  const existingSlugs = new Set(existing.map((item) => item.slug));
  const itemsToCreate = uniqueItems.filter((item) => !existingSlugs.has(item.slug));

  if (itemsToCreate.length > 0) {
    await prisma.category.createMany({
      data: itemsToCreate.map((item) => ({
        name: item.name,
        slug: item.slug,
        isFeatured: item.isFeatured,
        icon: item.icon,
        image: item.image,
      })),
      skipDuplicates: true,
    });
  }

  const created = itemsToCreate.length
    ? await prisma.category.findMany({
        where: {
          slug: {
            in: itemsToCreate.map((item) => item.slug),
          },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return {
    total: payload.length,
    created,
    skipped: {
      existing: Array.from(existingSlugs),
      duplicatesInPayload: duplicateSlugs,
    },
  };
};

const getCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return { total: categories.length, data: categories };
};

const updateCategory = async (id: string, payload: IUpdateCategoryPayload) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  const nextName = payload.name?.trim();
  const nextSlug = nextName ? slugify(nextName) : undefined;

  if (nextSlug) {
    const duplicate = await prisma.category.findFirst({
      where: {
        slug: {
          equals: nextSlug,
          mode: "insensitive",
        },
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError("Category already exists", status.CONFLICT);
    }
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: nextName as string, slug: nextSlug as string } : {}),
      ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
      ...(payload.icon !== undefined ? { icon: payload.icon ?? null } : {}),
      ...(payload.image !== undefined ? { image: payload.image ?? null } : {}),
    },
  });
};

const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  await prisma.category.delete({
    where: { id },
  });

  return { deleted: true, id };
};

const createSubCategory = async (payload: ICreateSubCategoryPayload) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  return prisma.subCategory.create({
    data: {
      name: payload.name.trim(),
      categoryId: payload.categoryId,
    },
  });
};

const getSubCategories = async (categoryId?: string) => {
  const subCategories = await prisma.subCategory.findMany({
    where: categoryId ? { categoryId } : undefined,
    orderBy: { name: "asc" },
    include: {
      category: true,
    },
  });

  return { total: subCategories.length, data: subCategories };
};

const getSubCategoryById = async (id: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  return subCategory;
};

const createSpecificationGroup = async (payload: ICreateSpecificationGroupPayload) => {
  const groupName = payload.name.trim();

  const subCategory = await prisma.subCategory.findUnique({
    where: { id: payload.subCategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const existingGroup = await prisma.specificationGroup.findFirst({
    where: {
      subCategoryId: payload.subCategoryId,
      name: {
        equals: groupName,
        mode: "insensitive",
      },
    },
  });

  if (existingGroup) {
    throw new AppError("Specification group already exists", status.CONFLICT);
  }

  return prisma.specificationGroup.create({
    data: {
      name: groupName,
      subCategoryId: payload.subCategoryId,
    },
  });
};

const createSpecificationField = async (payload: ICreateSpecificationFieldPayload) => {
  const group = await prisma.specificationGroup.findUnique({
    where: { id: payload.groupId },
  });

  if (!group) {
    throw new AppError("Specification group not found", status.NOT_FOUND);
  }

  return prisma.specificationField.create({
    data: {
      name: payload.name.trim(),
      groupId: payload.groupId,
      type: payload.type?.trim().toLowerCase() || "text",
      options: payload.options ?? [],
    },
  });
};

const getSpecificationGroups = async (subCategoryId: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const groups = await prisma.specificationGroup.findMany({
    where: { subCategoryId },
    orderBy: { name: "asc" },
  });

  return { total: groups.length, data: groups };
};

const getSpecificationFields = async (groupId: string) => {
  const group = await prisma.specificationGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new AppError("Specification group not found", status.NOT_FOUND);
  }

  const fields = await prisma.specificationField.findMany({
    where: { groupId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      options: true,
      groupId: true,
    },
  });

  return { total: fields.length, data: fields };
};

const getSpecificationFieldsBySubCategory = async (subCategoryId: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const fields = await prisma.specificationField.findMany({
    where: {
      group: {
        subCategoryId,
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      options: true,
      groupId: true,
    },
  });

  return { total: fields.length, data: fields };
};

const getSpecifications = async (subcategoryId: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const groups = await prisma.specificationGroup.findMany({
    where: { subCategoryId: subcategoryId },
    orderBy: { name: "asc" },
    include: {
      fields: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          options: true,
        },
      },
    },
  });

  return {
    groups: groups.map((group) => ({
      ...group,
      groupId: group.id,
      groupName: group.name,
    })),
  };
};

const validateSpecificationFields = async (subCategoryId: string, specifications: NonNullable<ICreateProductPayload["specifications"]>) => {
  const groups = await prisma.specificationGroup.findMany({
    where: { subCategoryId },
    include: { fields: { select: { id: true, name: true } } },
  });

  const validFields = new Map<string, string>();
  for (const group of groups) {
    for (const field of group.fields) {
      validFields.set(field.id, field.name);
    }
  }

  const invalidField = specifications.find((specification) => !validFields.has(specification.fieldId));
  if (invalidField) {
    throw new AppError(`Invalid specification field id: ${invalidField.fieldId}`, status.BAD_REQUEST);
  }

  const duplicateField = new Set<string>();
  for (const specification of specifications) {
    if (duplicateField.has(specification.fieldId)) {
      throw new AppError(`Duplicate specification field id: ${specification.fieldId}`, status.BAD_REQUEST);
    }
    duplicateField.add(specification.fieldId);
  }
};

const createProduct = async (payload: ICreateProductPayload) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: payload.subCategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const brand = await prisma.brand.findUnique({
    where: { id: payload.brandId },
  });

  if (!brand) {
    throw new AppError("Brand not found", status.NOT_FOUND);
  }

  const specifications = payload.specifications ?? [];
  if (specifications.length > 0) {
    await validateSpecificationFields(payload.subCategoryId, specifications);
  }

  const createdProduct = await prisma.product.create({
    data: {
      title: payload.title.trim(),
      price: payload.price,
      discountPrice: payload.discountPrice,
      quantity: payload.quantity ?? 0,
      rating: payload.rating ?? 0,
      reviewCount: payload.reviewCount ?? 0,
      likeCount: payload.likeCount ?? 0,
      brandId: payload.brandId,
      images: payload.images ?? [],
      isFeatured: payload.isFeatured ?? false,
      subCategoryId: payload.subCategoryId,
      specifications: {
        create: specifications.map((specification) => ({
          fieldId: specification.fieldId,
          value: specification.value,
        })),
      },
    },
    include: {
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
    },
  });

  await syncProductWithLatestOffer(createdProduct.id, payload.isFeatured ?? false);

  return createdProduct;
};

const getProducts = async (query: ICatalogFilterQuery) => {
  const searchTerm = typeof query.search === "string" ? query.search.trim() : undefined;
  const subCategoryId = query.subcategoryId ?? query.subCategoryId;
  const brandSlug = typeof query.brand === "string" ? query.brand.trim() : undefined;
  const brandId = typeof query.brandId === "string" ? query.brandId.trim() : undefined;
  const isFeatured = getBooleanFilterValue(query.isFeatured);
  const priceMin = getNumberFilterValue(query.priceMin);
  const priceMax = getNumberFilterValue(query.priceMax);
  const page = Math.max(1, getNumberFilterValue(query.page) ?? 1);
  const limit = Math.max(1, getNumberFilterValue(query.limit) ?? 12);
  const skip = (page - 1) * limit;
  const filters = Object.entries(query).filter(
    ([key]) =>
      key !== "subcategoryId" &&
      key !== "subCategoryId" &&
      key !== "search" &&
      key !== "brand" &&
      key !== "brandId" &&
      key !== "isFeatured" &&
      key !== "priceMin" &&
      key !== "priceMax" &&
      key !== "page" &&
      key !== "limit",
  );

  const products = await prisma.product.findMany({
    where: {
      ...(subCategoryId ? { subCategoryId } : {}),
      ...(brandSlug
        ? {
            brand: {
              slug: brandSlug,
            },
          }
        : {}),
      ...(brandId ? { brandId } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...((priceMin !== undefined || priceMax !== undefined)
        ? {
            price: {
              ...(priceMin !== undefined ? { gte: priceMin } : {}),
              ...(priceMax !== undefined ? { lte: priceMax } : {}),
            },
          }
        : {}),
      ...(searchTerm
        ? {
            title: {
              contains: searchTerm,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
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
    },
  });

  const totalBeforeSpecFilters = products.length;

  if (filters.length === 0) {
    return {
      total: totalBeforeSpecFilters,
      page,
      limit,
      totalPages: Math.ceil(totalBeforeSpecFilters / limit) || 1,
      data: products.slice(skip, skip + limit),
    };
  }

  const fieldLookups = await prisma.specificationField.findMany({
    where: subCategoryId
      ? {
          group: {
            subCategoryId,
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
    },
  });

  const resolvedFilters = filters
    .map(([key, value]) => {
      const normalizedKey = normalizeKey(key);
      const matchedField = fieldLookups.find((field) => {
        const normalizedFieldName = normalizeKey(field.name);
        return normalizedFieldName.includes(normalizedKey) || normalizedKey.includes(normalizedFieldName);
      });

      const filterValue = getFilterValue(value);
      if (!matchedField || !filterValue) {
        return null;
      }

      return {
        fieldId: matchedField.id,
        value: filterValue.toLowerCase().trim(),
      };
    })
    .filter((filter): filter is { fieldId: string; value: string } => Boolean(filter));

  if (resolvedFilters.length === 0) {
    return {
      total: totalBeforeSpecFilters,
      page,
      limit,
      totalPages: Math.ceil(totalBeforeSpecFilters / limit) || 1,
      data: products.slice(skip, skip + limit),
    };
  }

  const filteredProducts = products.filter((product) =>
    resolvedFilters.every((filter) =>
      product.specifications.some((specification) =>
        specification.fieldId === filter.fieldId && specification.value.toLowerCase().trim() === filter.value,
      ),
    ),
  );

  return {
    total: filteredProducts.length,
    page,
    limit,
    totalPages: Math.ceil(filteredProducts.length / limit) || 1,
    data: filteredProducts.slice(skip, skip + limit),
  };
};

const getProductSuggestions = async (search: string) => {
  const searchTerm = search.trim();

  if (!searchTerm) {
    return [];
  }

  return prisma.product.findMany({
    where: {
      title: {
        contains: searchTerm,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
    },
  });
};

const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
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
    },
  });

  if (!product) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  return product;
};

const updateProduct = async (id: string, payload: IUpdateProductPayload) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      specifications: true,
    },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  if (payload.subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: payload.subCategoryId },
    });

    if (!subCategory) {
      throw new AppError("Subcategory not found", status.NOT_FOUND);
    }
  }

  if (payload.specifications) {
    const targetSubCategoryId = payload.subCategoryId ?? existingProduct.subCategoryId;
    await validateSpecificationFields(targetSubCategoryId, payload.specifications);
  }

  if (payload.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: payload.brandId },
    });

    if (!brand) {
      throw new AppError("Brand not found", status.NOT_FOUND);
    }
  }

  const updateData: Record<string, unknown> = {
    ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
    ...(payload.price !== undefined ? { price: payload.price } : {}),
    ...(payload.discountPrice !== undefined ? { discountPrice: payload.discountPrice } : {}),
    ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
    ...(payload.rating !== undefined ? { rating: payload.rating } : {}),
    ...(payload.reviewCount !== undefined ? { reviewCount: payload.reviewCount } : {}),
    ...(payload.likeCount !== undefined ? { likeCount: payload.likeCount } : {}),
    ...(payload.brandId !== undefined ? { brandId: payload.brandId } : {}),
    ...(payload.images !== undefined ? { images: payload.images } : {}),
    ...(payload.isFeatured !== undefined ? { isFeatured: payload.isFeatured } : {}),
    ...(payload.subCategoryId !== undefined ? { subCategoryId: payload.subCategoryId } : {}),
  };

  const updatedProduct = await prisma.$transaction(async (tx) => {
    if (payload.specifications) {
      await tx.productSpecification.deleteMany({
        where: { productId: id },
      });

      await tx.product.update({
        where: { id },
        data: {
          ...updateData,
          specifications: {
            create: payload.specifications.map((specification) => ({
              fieldId: specification.fieldId,
              value: specification.value,
            })),
          },
        },
      });
    } else {
      await tx.product.update({
        where: { id },
        data: updateData,
      });
    }

    return tx.product.findUnique({
      where: { id },
      include: {
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
      },
    });
  });

  await syncProductWithLatestOffer(id, payload.isFeatured ?? existingProduct.isFeatured);

  return updatedProduct;
};

const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.productSpecification.deleteMany({
      where: { productId: id },
    });

    await tx.latestOfferProduct.deleteMany({
      where: { productId: id },
    });

    await tx.product.delete({
      where: { id },
    });
  });

  return { deleted: true, id };
};

const setCategoryFeatured = async (id: string, isFeatured: boolean) => {
  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  return prisma.category.update({ where: { id }, data: { isFeatured } });
};

const getFeaturedProducts = async () => {
  const activeLatestOffer = await prisma.latestOffer.findFirst({
    where: {
      isActive: true,
      offerStartAt: { lte: new Date() },
      offerEndAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        include: {
          product: {
            include: {
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
            },
          },
        },
      },
    },
  });

  const products = activeLatestOffer?.products.map((item) => item.product).filter((product) => product.isFeatured) ?? [];

  return {
    total: products.length,
    data: products,
  };
};

const getFilterOptions = async (subcategoryId: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const groups = await prisma.specificationGroup.findMany({
    where: { subCategoryId: subcategoryId },
    orderBy: { name: "asc" },
    include: {
      fields: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          options: true,
        },
      },
    },
  });

  const filterOptions: Record<string, { fieldId: string; fieldName: string; fieldType: string; values: string[] }> = {};

  for (const group of groups) {
    for (const field of group.fields) {
      const distinctValues = await prisma.productSpecification.findMany({
        where: { fieldId: field.id },
        distinct: ["value"],
        select: { value: true },
        orderBy: { value: "asc" },
      });

      filterOptions[field.name] = {
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type,
        values: distinctValues.map((spec) => spec.value),
      };
    }
  }

  return filterOptions;
};

const getFieldOptions = async (fieldId: string) => {
  const field = await prisma.specificationField.findUnique({
    where: { id: fieldId },
  });

  if (!field) {
    throw new AppError("Specification field not found", status.NOT_FOUND);
  }

  const distinctValues = await prisma.productSpecification.findMany({
    where: { fieldId },
    distinct: ["value"],
    select: { value: true },
    orderBy: { value: "asc" },
  });

  return {
    fieldId: field.id,
    fieldName: field.name,
    fieldType: field.type,
    predefinedOptions: field.options,
    usedValues: distinctValues.map((spec) => spec.value),
  };
};

const getFilteredProductCount = async (query: ICatalogFilterQuery) => {
  const subCategoryId = query.subcategoryId ?? query.subCategoryId;
  const brandSlug = typeof query.brand === "string" ? query.brand.trim() : undefined;
  const brandId = typeof query.brandId === "string" ? query.brandId.trim() : undefined;
  const isFeatured = getBooleanFilterValue(query.isFeatured);
  const priceMin = getNumberFilterValue(query.priceMin);
  const priceMax = getNumberFilterValue(query.priceMax);
  const filters = Object.entries(query).filter(
    ([key]) =>
      key !== "subcategoryId" &&
      key !== "subCategoryId" &&
      key !== "brand" &&
      key !== "brandId" &&
      key !== "isFeatured" &&
      key !== "priceMin" &&
      key !== "priceMax",
  );

  const products = await prisma.product.findMany({
    where: {
      ...(subCategoryId ? { subCategoryId } : {}),
      ...(brandSlug
        ? {
            brand: {
              slug: brandSlug,
            },
          }
        : {}),
      ...(brandId ? { brandId } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...((priceMin !== undefined || priceMax !== undefined)
        ? {
            price: {
              ...(priceMin !== undefined ? { gte: priceMin } : {}),
              ...(priceMax !== undefined ? { lte: priceMax } : {}),
            },
          }
        : {}),
    },
    include: {
      specifications: {
        select: {
          fieldId: true,
          value: true,
        },
      },
    },
  });

  if (filters.length === 0) {
    return { totalCount: products.length, matchedCount: products.length, products: [] };
  }

  const fieldLookups = await prisma.specificationField.findMany({
    where: subCategoryId
      ? {
          group: {
            subCategoryId,
          },
        }
      : undefined,
    select: {
      id: true,
      name: true,
    },
  });

  const resolvedFilters = filters
    .map(([key, value]) => {
      const normalizedKey = normalizeKey(key);
      const matchedField = fieldLookups.find((field) => {
        const normalizedFieldName = normalizeKey(field.name);
        return normalizedFieldName.includes(normalizedKey) || normalizedKey.includes(normalizedFieldName);
      });

      const filterValue = getFilterValue(value);
      if (!matchedField || !filterValue) {
        return null;
      }

      return {
        fieldId: matchedField.id,
        value: filterValue.toLowerCase().trim(),
      };
    })
    .filter((filter): filter is { fieldId: string; value: string } => Boolean(filter));

  if (resolvedFilters.length === 0) {
    return { totalCount: products.length, matchedCount: products.length, products: [] };
  }

  const matchedProducts = products.filter((product) =>
    resolvedFilters.every((filter) =>
      product.specifications.some((specification) =>
        specification.fieldId === filter.fieldId && specification.value.toLowerCase().trim() === filter.value,
      ),
    ),
  );

  return {
    totalCount: products.length,
    matchedCount: matchedProducts.length,
    products: matchedProducts.map((p) => p.id),
  };
};

const setProductFeatured = async (id: string, isFeatured: boolean) => {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  const updated = await prisma.product.update({ where: { id }, data: { isFeatured } });

  await syncProductWithLatestOffer(id, isFeatured);

  return updated;
};

export const CatalogService = {
  createCategory,
  createCategoryBulk,
  getCategories,
  updateCategory,
  deleteCategory,
  createSubCategory,
  getSubCategories,
  getSubCategoryById,
  createSpecificationGroup,
  createSpecificationField,
  getSpecificationGroups,
  getSpecificationFields,
  getSpecificationFieldsBySubCategory,
  getSpecifications,
  createProduct,
  getProducts,
  getProductSuggestions,
  getFeaturedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFilterOptions,
  getFieldOptions,
  getFilteredProductCount,
  setCategoryFeatured,
  setProductFeatured,
};