import status from "http-status";
import { Prisma } from "@prisma/client";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICatalogFilterQuery,
  ICreateCategoryPayload,
  ICreateCategoryBulkPayload,
  IUpdateCategoryPayload,
  ICreateProductBulkPayload,
  ICreateProductPayload,
  ICreateSpecificationFieldPayload,
  ICreateSpecificationFieldBulkPayload,
  ICreateSpecificationGroupPayload,
  ICreateSpecificationGroupBulkPayload,
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

const normalizeSubCategoryIds = (primarySubCategoryId: string, subCategoryIds?: string[]) => {
  const normalizedIds = new Set<string>([primarySubCategoryId]);

  for (const subCategoryId of subCategoryIds ?? []) {
    const trimmedSubCategoryId = subCategoryId.trim();
    if (trimmedSubCategoryId) {
      normalizedIds.add(trimmedSubCategoryId);
    }
  }

  return [...normalizedIds];
};

const getExtraSubCategoryIds = (primarySubCategoryId: string, subCategoryIds?: string[]) =>
  normalizeSubCategoryIds(primarySubCategoryId, subCategoryIds).filter((subCategoryId) => subCategoryId !== primarySubCategoryId);

const validateSubCategoryIdsExist = async (subCategoryIds: string[]) => {
  if (subCategoryIds.length === 0) {
    return;
  }

  const existingSubCategories = await prisma.subCategory.findMany({
    where: { id: { in: subCategoryIds } },
    select: { id: true },
  });

  if (existingSubCategories.length !== subCategoryIds.length) {
    const existingIds = new Set(existingSubCategories.map((subCategory) => subCategory.id));
    const missingSubCategoryId = subCategoryIds.find((subCategoryId) => !existingIds.has(subCategoryId));
    throw new AppError(`Subcategory not found: ${missingSubCategoryId ?? "unknown"}`, status.NOT_FOUND);
  }
};

const buildProductSubCategoryWhere = (subCategoryId?: string) =>
  subCategoryId
    ? {
        OR: [{ subCategoryId }, { productSubCategories: { some: { subCategoryId } } }],
      }
    : {};

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

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        subCategory: {
          categoryId: id,
        },
      },
      select: {
        id: true,
      },
    });

    if (products.length > 0) {
      await tx.productSpecification.deleteMany({
        where: {
          productId: {
            in: products.map((product) => product.id),
          },
        },
      });
    }

    await tx.category.delete({
      where: { id },
    });
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

const createSpecificationGroupBulk = async (payload: ICreateSpecificationGroupBulkPayload) => {
  const normalized = payload.map((item) => ({
    name: item.name.trim(),
    subCategoryId: item.subCategoryId,
  }));

  const seenKeys = new Set<string>();
  const duplicateKeys: string[] = [];
  const uniqueItems = normalized.filter((item) => {
    const key = `${item.subCategoryId}::${item.name.toLowerCase()}`;
    if (seenKeys.has(key)) {
      duplicateKeys.push(key);
      return false;
    }
    seenKeys.add(key);
    return true;
  });

  if (uniqueItems.length === 0) {
    return {
      total: payload.length,
      created: [],
      skipped: {
        existing: [],
        duplicatesInPayload: duplicateKeys,
      },
    };
  }

  const existing = await prisma.specificationGroup.findMany({
    where: {
      OR: uniqueItems.map((item) => ({
        subCategoryId: item.subCategoryId,
        name: { equals: item.name, mode: "insensitive" },
      })),
    },
    select: { subCategoryId: true, name: true },
  });

  const existingKeys = new Set(existing.map((e) => `${e.subCategoryId}::${e.name.toLowerCase()}`));

  const itemsToCreate = uniqueItems.filter((item) => !existingKeys.has(`${item.subCategoryId}::${item.name.toLowerCase()}`));

  if (itemsToCreate.length > 0) {
    await prisma.specificationGroup.createMany({
      data: itemsToCreate.map((it) => ({ name: it.name, subCategoryId: it.subCategoryId })),
      skipDuplicates: true,
    });
  }

  const created = itemsToCreate.length
    ? await prisma.specificationGroup.findMany({
        where: {
          OR: itemsToCreate.map((item) => ({ subCategoryId: item.subCategoryId, name: item.name })),
        },
        orderBy: { name: "asc" },
      })
    : [];

  return {
    total: payload.length,
    created,
    skipped: {
      existing: Array.from(existingKeys),
      duplicatesInPayload: duplicateKeys,
    },
  };
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
      isFeatured: payload.isFeatured ?? false,
    },
  });
};

const createSpecificationFieldBulk = async (payload: ICreateSpecificationFieldBulkPayload) => {
  const normalized = payload.map((item) => ({
    name: item.name.trim(),
    groupId: item.groupId.trim(),
    type: item.type?.trim().toLowerCase() || "text",
    options: item.options ?? [],
    isFeatured: item.isFeatured ?? false,
  }));

  const seenKeys = new Set<string>();
  const duplicateKeys: string[] = [];
  const uniqueItems = normalized.filter((item) => {
    const key = `${item.groupId}::${item.name.toLowerCase()}`;
    if (seenKeys.has(key)) {
      duplicateKeys.push(key);
      return false;
    }
    seenKeys.add(key);
    return true;
  });

  if (uniqueItems.length === 0) {
    return {
      total: payload.length,
      created: [],
      skipped: {
        invalidGroups: [],
        duplicatesInPayload: duplicateKeys,
      },
    };
  }

  const groupIds = [...new Set(uniqueItems.map((item) => item.groupId))];
  const existingGroups = await prisma.specificationGroup.findMany({
    where: { id: { in: groupIds } },
    select: { id: true },
  });

  if (existingGroups.length !== groupIds.length) {
    const existingGroupIds = new Set(existingGroups.map((group) => group.id));
    const missingGroupId = groupIds.find((groupId) => !existingGroupIds.has(groupId));
    throw new AppError(`Specification group not found: ${missingGroupId ?? "unknown"}`, status.NOT_FOUND);
  }

  await prisma.specificationField.createMany({
    data: uniqueItems.map((item) => ({
      name: item.name,
      groupId: item.groupId,
      type: item.type,
      options: item.options,
      isFeatured: item.isFeatured,
    })),
  });

  const created = await prisma.specificationField.findMany({
    where: {
      OR: uniqueItems.map((item) => ({
        groupId: item.groupId,
        name: item.name,
      })),
    },
    orderBy: { name: "asc" },
  });

  return {
    total: payload.length,
    created,
    skipped: {
      invalidGroups: [],
      duplicatesInPayload: duplicateKeys,
    },
  };
};

const getSpecificationGroups = async (subCategoryId?: string) => {
  if (subCategoryId) {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      throw new AppError("Subcategory not found", status.NOT_FOUND);
    }

    const groups = await prisma.specificationGroup.findMany({
      where: { subCategoryId },
      orderBy: { name: "asc" },
      include: {
        fields: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { total: groups.length, data: groups };
  }

  const groups = await prisma.specificationGroup.findMany({
    orderBy: { name: "asc" },
    include: {
      fields: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { total: groups.length, data: groups };
};

const getSpecificationGroupsWithFields = async () => {
  const groups = await prisma.specificationGroup.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      fields: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
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
      isFeatured: true,
    },
  });

  return { total: fields.length, data: fields };
};

const getSpecificationGroupById = async (groupId: string) => {
  const group = await prisma.specificationGroup.findUnique({
    where: { id: groupId },
    include: {
      fields: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!group) {
    throw new AppError("Specification group not found", status.NOT_FOUND);
  }

  return {
    id: group.id,
    name: group.name,
    subCategoryId: group.subCategoryId,
    fields: group.fields,
  };
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
      isFeatured: true,
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
          isFeatured: true,
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

const getSpecificationGroupsSummary = async (subCategoryId?: string) => {
  const subCategories = await prisma.subCategory.findMany({
    where: subCategoryId ? { id: subCategoryId } : undefined,
    orderBy: { name: "asc" },
    include: {
      specificationGroups: {
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
    },
  });

  const totalGroups = subCategories.reduce((acc, sc) => acc + sc.specificationGroups.length, 0);

  return {
    totalSubCategories: subCategories.length,
    totalGroups,
    data: subCategories.map((sc) => ({
      subCategory: { id: sc.id, name: sc.name },
      groupsCount: sc.specificationGroups.length,
      groups: sc.specificationGroups,
    })),
  };
};

const getFeaturedSpecificationFieldsBySubCategory = async (subCategoryId: string) => {
  const subCategory = await prisma.subCategory.findUnique({ where: { id: subCategoryId } });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  const fields = await prisma.specificationField.findMany({
    where: {
      AND: [{ isFeatured: true }, { group: { subCategoryId } }],
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      options: true,
      groupId: true,
      isFeatured: true,
    },
  });

  return { total: fields.length, data: fields };
};

const setSpecificationFieldFeatured = async (id: string, isFeatured: boolean) => {
  const existing = await prisma.specificationField.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Specification field not found", status.NOT_FOUND);
  }

  return prisma.specificationField.update({ where: { id }, data: { isFeatured } });
};

const setSpecificationFieldsFeaturedBySubCategory = async (
  subCategoryId: string,
  fieldIds: string[] | undefined,
  isFeatured: boolean,
) => {
  const subCategory = await prisma.subCategory.findUnique({ where: { id: subCategoryId } });

  if (!subCategory) {
    throw new AppError("Subcategory not found", status.NOT_FOUND);
  }

  if (fieldIds && fieldIds.length > 0) {
    const fields = await prisma.specificationField.findMany({ where: { id: { in: fieldIds } }, select: { id: true, groupId: true } });
    const invalid = fields.find((f) => {
      return f.groupId === undefined || f.groupId === null || f.groupId === "" ? true : false;
    });

    const fieldIdsSet = new Set(fields.map((f) => f.id));
    if (fieldIdsSet.size !== fieldIds.length) {
      throw new AppError("One or more specification fields not found", status.NOT_FOUND);
    }

    // ensure all belong to the subcategory
    const fieldsInSubcategory = await prisma.specificationField.findMany({
      where: { id: { in: fieldIds }, group: { subCategoryId } },
      select: { id: true },
    });

    if (fieldsInSubcategory.length !== fieldIds.length) {
      throw new AppError("One or more specification fields do not belong to the provided subcategory", status.BAD_REQUEST);
    }

    await prisma.specificationField.updateMany({ where: { id: { in: fieldIds } }, data: { isFeatured } });

    const updated = await prisma.specificationField.findMany({ where: { id: { in: fieldIds } } });
    return { total: updated.length, data: updated };
  }

  // update all fields in subcategory
  await prisma.specificationField.updateMany({ where: { group: { subCategoryId } }, data: { isFeatured } });

  const updated = await prisma.specificationField.findMany({ where: { group: { subCategoryId } } });
  return { total: updated.length, data: updated };
};

const getCatalogHierarchy = async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      subCategories: {
        orderBy: { name: "asc" },
        include: {
          specificationGroups: {
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              fields: {
                orderBy: { name: "asc" },
                select: {
                  id: true,
                  name: true,
                  groupId: true,
                  type: true,
                  options: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const totalSubCategories = categories.reduce((count, category) => count + category.subCategories.length, 0);
  const totalGroups = categories.reduce(
    (count, category) =>
      count + category.subCategories.reduce((subCount, subCategory) => subCount + subCategory.specificationGroups.length, 0),
    0,
  );
  const totalSpecFields = categories.reduce(
    (count, category) =>
      count
      + category.subCategories.reduce(
        (subCount, subCategory) =>
          subCount + subCategory.specificationGroups.reduce((groupCount, group) => groupCount + group.fields.length, 0),
        0,
      ),
    0,
  );

  return {
    totalCategories: categories.length,
    totalSubCategories,
    totalGroups,
    totalSpecFields,
    data: categories.map((category) => ({
      category: {
        id: category.id,
        name: category.name,
      },
      subCategories: category.subCategories.map((subCategory) => ({
        id: subCategory.id,
        name: subCategory.name,
        specGroups: subCategory.specificationGroups,
        groupsCount: subCategory.specificationGroups.length,
      })),
    })),
  };
};

const getCategoryDetails = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      subCategories: {
        orderBy: { name: "asc" },
        include: {
          specificationGroups: {
            orderBy: { name: "asc" },
            include: {
              fields: {
                orderBy: { name: "asc" },
                select: {
                  id: true,
                  name: true,
                  type: true,
                  options: true,
                  groupId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new AppError("Category not found", status.NOT_FOUND);
  }

  const totalSubCategories = category.subCategories.length;
  const totalGroups = category.subCategories.reduce((acc, sc) => acc + sc.specificationGroups.length, 0);
  const totalSpecFields = category.subCategories.reduce(
    (acc, sc) => acc + sc.specificationGroups.reduce((gAcc, g) => gAcc + g.fields.length, 0),
    0,
  );

  return {
    category: { id: category.id, name: category.name },
    totalSubCategories,
    totalGroups,
    totalSpecFields,
    subCategories: category.subCategories.map((sc) => ({
      id: sc.id,
      name: sc.name,
      groupsCount: sc.specificationGroups.length,
      specGroups: sc.specificationGroups.map((g) => ({ id: g.id, name: g.name, fields: g.fields })),
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

  const extraSubCategoryIds = getExtraSubCategoryIds(payload.subCategoryId, payload.subCategoryIds);
  await validateSubCategoryIdsExist(extraSubCategoryIds);

  const specifications = payload.specifications ?? [];
  if (specifications.length > 0) {
    await validateSpecificationFields(payload.subCategoryId, specifications);
  }

  const createdProduct = await prisma.product.create({
    data: {
      title: payload.title.trim(),
      description: payload.description?.trim() ?? null,
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
      productSubCategories: {
        create: extraSubCategoryIds.map((subCategoryId) => ({
          subCategoryId,
        })),
      },
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

const createProductBulk = async (payload: ICreateProductBulkPayload) => {
  const createdProducts = [];

  for (const item of payload) {
    const createdProduct = await createProduct(item);
    createdProducts.push(createdProduct);
  }

  return createdProducts;
};

const getProducts = async (query: ICatalogFilterQuery) => {
  const searchTerm = typeof query.search === "string" ? query.search.trim() : undefined;
  const subCategoryId = query.subcategoryId ?? query.subCategoryId;
  const categorySlug = typeof query.category === "string" ? query.category.trim() : undefined;
  const subcategoryName = typeof query.subcategory === "string" ? query.subcategory.trim() : undefined;
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
      key !== "category" &&
      key !== "subcategory" &&
      key !== "search" &&
      key !== "brand" &&
      key !== "brandId" &&
      key !== "isFeatured" &&
      key !== "priceMin" &&
      key !== "priceMax" &&
      key !== "page" &&
      key !== "limit" &&
      key !== "source" &&
      key !== "slot",
  );

  // ── Resolve category slug/name → subcategory IDs ──────────────────────────
  let categorySubCategoryIds: string[] | undefined;
  if (!subCategoryId && categorySlug) {
    // Look up category by slug (exact, case-insensitive) or by name (case-insensitive)
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: { equals: categorySlug, mode: "insensitive" } },
          { name: { equals: categorySlug, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (category) {
      const subCategories = await prisma.subCategory.findMany({
        where: { categoryId: category.id },
        select: { id: true },
      });
      categorySubCategoryIds = subCategories.map((sc) => sc.id);

      // If a subcategory name is also provided, narrow down further
      if (subcategoryName && categorySubCategoryIds.length > 0) {
        const matchingSubs = await prisma.subCategory.findMany({
          where: {
            categoryId: category.id,
            name: { equals: subcategoryName, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (matchingSubs.length > 0) {
          categorySubCategoryIds = matchingSubs.map((sc) => sc.id);
        }
      }
    } else {
      // Category not found — return empty results
      categorySubCategoryIds = [];
    }
  }

  // Build the subcategory filter: prefer explicit subCategoryId, then category-derived IDs
  const buildSubCategoryFilter = (): Prisma.ProductWhereInput => {
    if (subCategoryId) {
      return buildProductSubCategoryWhere(subCategoryId);
    }
    if (categorySubCategoryIds !== undefined) {
      if (categorySubCategoryIds.length === 0) {
        // No matching subcategories — force empty result
        return { id: { equals: "___no_match___" } };
      }
      return {
        OR: [
          { subCategoryId: { in: categorySubCategoryIds } },
          { productSubCategories: { some: { subCategoryId: { in: categorySubCategoryIds } } } },
        ],
      };
    }
    return {};
  };

  const baseWhere: Prisma.ProductWhereInput = {
    ...buildSubCategoryFilter(),
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
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
  };

  if (filters.length === 0) {
    const [total, pagedProducts] = await Promise.all([
      prisma.product.count({ where: baseWhere }),
      prisma.product.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          brand: true,
          subCategory: {
            include: {
              category: true,
            },
          },
          productSubCategories: {
            include: {
              subCategory: {
                include: {
                  category: true,
                },
              },
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
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: pagedProducts,
    };
  }

  const products = await prisma.product.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    include: {
      brand: true,
      subCategory: {
        include: {
          category: true,
        },
      },
      productSubCategories: {
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
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

const getRecommendedProducts = async (search: string, limit = 3) => {
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
    take: Math.max(1, Math.min(20, limit)),
    select: {
      id: true,
      title: true,
      price: true,
      discountPrice: true,
      images: true,
      brand: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
      productSubCategories: {
        select: {
          subCategory: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
        },
      },
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
      productSubCategories: {
        include: {
          subCategory: {
            include: {
              category: true,
            },
          },
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
      productSubCategories: true,
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

  const targetSubCategoryId = payload.subCategoryId ?? existingProduct.subCategoryId;
  const extraSubCategoryIds = payload.subCategoryIds !== undefined
    ? getExtraSubCategoryIds(targetSubCategoryId, payload.subCategoryIds)
    : undefined;

  if (extraSubCategoryIds !== undefined) {
    await validateSubCategoryIdsExist(extraSubCategoryIds);
  }

  const updateData: Record<string, unknown> = {
    ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
    ...(payload.description !== undefined ? { description: payload.description?.trim() ?? null } : {}),
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
    }

    await tx.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(payload.specifications
          ? {
              specifications: {
                create: payload.specifications.map((specification) => ({
                  fieldId: specification.fieldId,
                  value: specification.value,
                })),
              },
            }
          : {}),
        ...(extraSubCategoryIds !== undefined
          ? {
              productSubCategories: {
                deleteMany: {},
                create: extraSubCategoryIds.map((subCategoryId) => ({
                  subCategoryId,
                })),
              },
            }
          : payload.subCategoryId !== undefined
            ? {
                productSubCategories: {
                  deleteMany: {
                    subCategoryId: targetSubCategoryId,
                  },
                },
              }
            : {}),
      },
    });

    return tx.product.findUnique({
      where: { id },
      include: {
        brand: true,
        subCategory: {
          include: {
            category: true,
          },
        },
        productSubCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
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
              productSubCategories: {
                include: {
                  subCategory: {
                    include: {
                      category: true,
                    },
                  },
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
          isFeatured: true,
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
  const categorySlug = typeof query.category === "string" ? query.category.trim() : undefined;
  const subcategoryName = typeof query.subcategory === "string" ? query.subcategory.trim() : undefined;
  const brandSlug = typeof query.brand === "string" ? query.brand.trim() : undefined;
  const brandId = typeof query.brandId === "string" ? query.brandId.trim() : undefined;
  const isFeatured = getBooleanFilterValue(query.isFeatured);
  const priceMin = getNumberFilterValue(query.priceMin);
  const priceMax = getNumberFilterValue(query.priceMax);
  const filters = Object.entries(query).filter(
    ([key]) =>
      key !== "subcategoryId" &&
      key !== "subCategoryId" &&
      key !== "category" &&
      key !== "subcategory" &&
      key !== "search" &&
      key !== "brand" &&
      key !== "brandId" &&
      key !== "isFeatured" &&
      key !== "priceMin" &&
      key !== "priceMax" &&
      key !== "page" &&
      key !== "limit" &&
      key !== "source" &&
      key !== "slot",
  );

  // ── Resolve category slug/name → subcategory IDs ──────────────────────────
  let categorySubCategoryIds: string[] | undefined;
  if (!subCategoryId && categorySlug) {
    // Look up category by slug (exact, case-insensitive) or by name (case-insensitive)
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: { equals: categorySlug, mode: "insensitive" } },
          { name: { equals: categorySlug, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (category) {
      const subCategories = await prisma.subCategory.findMany({
        where: { categoryId: category.id },
        select: { id: true },
      });
      categorySubCategoryIds = subCategories.map((sc) => sc.id);

      // If a subcategory name is also provided, narrow down further
      if (subcategoryName && categorySubCategoryIds.length > 0) {
        const matchingSubs = await prisma.subCategory.findMany({
          where: {
            categoryId: category.id,
            name: { equals: subcategoryName, mode: "insensitive" },
          },
          select: { id: true },
        });
        if (matchingSubs.length > 0) {
          categorySubCategoryIds = matchingSubs.map((sc) => sc.id);
        }
      }
    } else {
      // Category not found — return empty results
      categorySubCategoryIds = [];
    }
  }

  // Build the subcategory filter: prefer explicit subCategoryId, then category-derived IDs
  const buildSubCategoryFilter = (): Prisma.ProductWhereInput => {
    if (subCategoryId) {
      return buildProductSubCategoryWhere(subCategoryId);
    }
    if (categorySubCategoryIds !== undefined) {
      if (categorySubCategoryIds.length === 0) {
        // No matching subcategories — force empty result
        return { id: { equals: "___no_match___" } };
      }
      return {
        OR: [
          { subCategoryId: { in: categorySubCategoryIds } },
          { productSubCategories: { some: { subCategoryId: { in: categorySubCategoryIds } } } },
        ],
      };
    }
    return {};
  };

  const products = await prisma.product.findMany({
    where: {
      ...buildSubCategoryFilter(),
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
      : categorySubCategoryIds && categorySubCategoryIds.length > 0
      ? {
          group: {
            subCategoryId: { in: categorySubCategoryIds },
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

const updateProductSpecification = async (
  productId: string,
  specificationId: string,
  payload: { fieldId?: string; value?: string },
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  const existing = await prisma.productSpecification.findUnique({ where: { id: specificationId } });

  if (!existing || existing.productId !== productId) {
    throw new AppError("Specification not found", status.NOT_FOUND);
  }

  const data: Record<string, unknown> = {};
  if (payload.fieldId !== undefined) data.fieldId = payload.fieldId;
  if (payload.value !== undefined) data.value = payload.value;

  if (Object.keys(data).length === 0) {
    throw new AppError("No fields to update", status.BAD_REQUEST);
  }

  return prisma.productSpecification.update({
    where: { id: specificationId },
    data,
    include: {
      field: { select: { id: true, name: true, type: true, options: true, isFeatured: true } },
    },
  });
};

const updateProductSpecifications = async (
  productId: string,
  specifications: Array<{ id?: string; fieldId: string; value: string }>,
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  return prisma.$transaction(async (tx) => {
    const results: any[] = [];

    for (const spec of specifications) {
      if (spec.id) {
        const existing = await tx.productSpecification.findUnique({ where: { id: spec.id } });
        if (!existing || existing.productId !== productId) {
          throw new AppError(`Specification not found: ${spec.id}`, status.NOT_FOUND);
        }

        const updated = await tx.productSpecification.update({
          where: { id: spec.id },
          data: { fieldId: spec.fieldId, value: spec.value },
          include: { field: { select: { id: true, name: true, type: true, options: true, isFeatured: true } } },
        });

        results.push(updated);
      } else {
        const created = await tx.productSpecification.create({
          data: { productId, fieldId: spec.fieldId, value: spec.value },
          include: { field: { select: { id: true, name: true, type: true, options: true, isFeatured: true } } },
        });

        results.push(created);
      }
    }

    return results;
  });
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
  createSpecificationGroupBulk,
  createSpecificationField,
  createSpecificationFieldBulk,
  getSpecificationGroupsSummary,
  getSpecificationGroupById,
  getSpecificationGroupsWithFields,
  getCatalogHierarchy,
  getCategoryDetails,
  getSpecificationGroups,
  getSpecificationFields,
  getSpecificationFieldsBySubCategory,
  getFeaturedSpecificationFieldsBySubCategory,
  getSpecifications,
  updateProductSpecification,
  updateProductSpecifications,
  createProduct,
  createProductBulk,
  getProducts,
  getProductSuggestions,
  getRecommendedProducts,
  getFeaturedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFilterOptions,
  getFieldOptions,
  getFilteredProductCount,
  setCategoryFeatured,
  setProductFeatured,
  setSpecificationFieldFeatured,
  setSpecificationFieldsFeaturedBySubCategory,
};