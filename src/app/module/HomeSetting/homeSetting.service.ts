import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  IFeaturedCategoryPayload,
  IHomeBannerSettingPayload,
  IHomeLogoSliderItemPayload,
  IHomeLogoSliderItemUpdatePayload,
  IPopularCategoryItemPayload,
  IPopularCategoryUpdatePayload,
  IPopularCategoryPayload,
  IRecommendedCategoryPayload,
  ISiteThemePayload,
  ISiteThemeUpdatePayload,
  ITestimonialPayload,
  ITestimonialUpdatePayload,
} from "./homeSetting.interface.js";

const ensureCategoriesExist = async (categoryIds: string[]) => {
  if (categoryIds.length === 0) {
    return;
  }

  const categories = await prisma.category.findMany({
    where: {
      id: { in: categoryIds },
    },
    select: { id: true },
  });

  if (categories.length !== categoryIds.length) {
    throw new AppError("One or more categories were not found", status.BAD_REQUEST);
  }
};

const getBannerSetting = async () => {
  return prisma.homeBannerSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

const upsertBannerSetting = async (payload: IHomeBannerSettingPayload) => {
  const existing = await prisma.homeBannerSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    return prisma.homeBannerSetting.create({
      data: {
        middleBanner: payload.middleBanner,
        sideBanner: payload.sideBanner ?? [],
        recommendedBanners: payload.recommendedBanners ?? [],
      },
    });
  }

  return prisma.homeBannerSetting.update({
    where: { id: existing.id },
    data: {
      middleBanner: payload.middleBanner,
      sideBanner: payload.sideBanner ?? [],
      recommendedBanners: payload.recommendedBanners ?? [],
    },
  });
};

const createBannerSetting = async (payload: IHomeBannerSettingPayload) => {
  return prisma.homeBannerSetting.create({
    data: {
      middleBanner: payload.middleBanner,
      sideBanner: payload.sideBanner ?? [],
      recommendedBanners: payload.recommendedBanners ?? [],
    },
  });
};

const createLogoSliderItem = async (payload: IHomeLogoSliderItemPayload) => {
  return prisma.homeLogoSliderItem.create({
    data: {
      name: payload.name.trim(),
      logoUrl: payload.logoUrl,
      linkUrl: payload.linkUrl,
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
    },
  });
};

const getLogoSliderItems = async () => {
  return prisma.homeLogoSliderItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

const updateLogoSliderItem = async (id: string, payload: IHomeLogoSliderItemUpdatePayload) => {
  const existing = await prisma.homeLogoSliderItem.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Logo slider item not found", status.NOT_FOUND);
  }

  return prisma.homeLogoSliderItem.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.logoUrl !== undefined ? { logoUrl: payload.logoUrl } : {}),
      ...(payload.linkUrl !== undefined ? { linkUrl: payload.linkUrl } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
};

const deleteLogoSliderItem = async (id: string) => {
  const existing = await prisma.homeLogoSliderItem.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Logo slider item not found", status.NOT_FOUND);
  }

  await prisma.homeLogoSliderItem.delete({ where: { id } });

  return { deleted: true, id };
};

const createTheme = async (payload: ISiteThemePayload) => {
  const created = await prisma.siteTheme.create({
    data: {
      name: payload.name.trim(),
      colorPrimaryBg: payload.colorPrimaryBg,
      colorSecondaryCard: payload.colorSecondaryCard,
      colorButton: payload.colorButton,
      colorIcon: payload.colorIcon,
      colorIconMuted: payload.colorIconMuted,
      colorBar: payload.colorBar,
      colorFont: payload.colorFont,
      colorBorderShade: payload.colorBorderShade,
      isActive: payload.isActive ?? false,
    },
  });

  if (created.isActive) {
    await prisma.siteTheme.updateMany({
      where: { id: { not: created.id } },
      data: { isActive: false },
    });
  }

  return prisma.siteTheme.findUnique({ where: { id: created.id } });
};

const getThemes = async () => {
  return prisma.siteTheme.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
};

const updateTheme = async (id: string, payload: ISiteThemeUpdatePayload) => {
  const existing = await prisma.siteTheme.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Theme not found", status.NOT_FOUND);
  }

  const updated = await prisma.siteTheme.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.colorPrimaryBg !== undefined ? { colorPrimaryBg: payload.colorPrimaryBg } : {}),
      ...(payload.colorSecondaryCard !== undefined ? { colorSecondaryCard: payload.colorSecondaryCard } : {}),
      ...(payload.colorButton !== undefined ? { colorButton: payload.colorButton } : {}),
      ...(payload.colorIcon !== undefined ? { colorIcon: payload.colorIcon } : {}),
      ...(payload.colorIconMuted !== undefined ? { colorIconMuted: payload.colorIconMuted } : {}),
      ...(payload.colorBar !== undefined ? { colorBar: payload.colorBar } : {}),
      ...(payload.colorFont !== undefined ? { colorFont: payload.colorFont } : {}),
      ...(payload.colorBorderShade !== undefined ? { colorBorderShade: payload.colorBorderShade } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });

  if (updated.isActive) {
    await prisma.siteTheme.updateMany({
      where: { id: { not: updated.id } },
      data: { isActive: false },
    });
  }

  return prisma.siteTheme.findUnique({ where: { id: updated.id } });
};

const activateTheme = async (id: string) => {
  const existing = await prisma.siteTheme.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Theme not found", status.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.siteTheme.updateMany({
      data: { isActive: false },
    });

    await tx.siteTheme.update({
      where: { id },
      data: { isActive: true },
    });
  });

  return prisma.siteTheme.findUnique({ where: { id } });
};

const getActiveTheme = async () => {
  return prisma.siteTheme.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
};

const setFeaturedCategories = async (payload: IFeaturedCategoryPayload) => {
  const uniqueCategoryIds = [...new Set(payload.categoryIds)];
  await ensureCategoriesExist(uniqueCategoryIds);

  await prisma.$transaction(async (tx) => {
    await tx.category.updateMany({
      data: { isFeatured: false },
    });

    await tx.category.updateMany({
      where: {
        id: { in: uniqueCategoryIds },
      },
      data: { isFeatured: true },
    });
  });

  return prisma.category.findMany({
    where: { isFeatured: true },
    orderBy: { name: "asc" },
  });
};

const getFeaturedCategories = async () => {
  return prisma.category.findMany({
    where: { isFeatured: true },
    orderBy: { name: "asc" },
  });
};

const setPopularCategories = async (payload: IPopularCategoryPayload) => {
  const uniqueCategoryIds = [...new Set(payload.items.map((item) => item.categoryId))];
  await ensureCategoriesExist(uniqueCategoryIds);

  await prisma.$transaction(async (tx) => {
    await tx.popularCategory.deleteMany();

    if (payload.items.length > 0) {
      await tx.popularCategory.createMany({
        data: payload.items.map((item, index) => ({
          categoryId: item.categoryId,
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }
  });

  return prisma.popularCategory.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

const addPopularCategory = async (payload: IPopularCategoryItemPayload) => {
  await ensureCategoriesExist([payload.categoryId]);

  const existing = await prisma.popularCategory.findUnique({
    where: { categoryId: payload.categoryId },
  });

  if (existing) {
    return prisma.popularCategory.update({
      where: { categoryId: payload.categoryId },
      data: {
        ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      },
      include: { category: true },
    });
  }

  const nextSortOrder = payload.sortOrder ?? (await prisma.popularCategory.count());

  return prisma.popularCategory.create({
    data: {
      categoryId: payload.categoryId,
      sortOrder: nextSortOrder,
    },
    include: { category: true },
  });
};

const updatePopularCategory = async (categoryId: string, payload: IPopularCategoryUpdatePayload) => {
  const existing = await prisma.popularCategory.findUnique({
    where: { categoryId },
  });

  if (!existing) {
    throw new AppError("Popular category not found", status.NOT_FOUND);
  }

  return prisma.popularCategory.update({
    where: { categoryId },
    data: {
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
    },
    include: { category: true },
  });
};

const deletePopularCategory = async (categoryId: string) => {
  const existing = await prisma.popularCategory.findUnique({
    where: { categoryId },
  });

  if (!existing) {
    throw new AppError("Popular category not found", status.NOT_FOUND);
  }

  await prisma.popularCategory.delete({
    where: { categoryId },
  });

  return { deleted: true, categoryId };
};

const getPopularCategories = async () => {
  return prisma.popularCategory.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

const setRecommendedCategories = async (payload: IRecommendedCategoryPayload) => {
  const uniqueCategoryIds = [...new Set(payload.items.map((item) => item.categoryId))];
  await ensureCategoriesExist(uniqueCategoryIds);

  await prisma.$transaction(async (tx) => {
    await tx.recommendedCategory.deleteMany();

    if (payload.items.length > 0) {
      await tx.recommendedCategory.createMany({
        data: payload.items.map((item, index) => ({
          categoryId: item.categoryId,
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }
  });

  return prisma.recommendedCategory.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

const getRecommendedCategories = async () => {
  return prisma.recommendedCategory.findMany({
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
};

const createTestimonial = async (payload: ITestimonialPayload) => {
  return prisma.testimonial.create({
    data: {
      description: payload.description.trim(),
      userImage: payload.userImage,
      userName: payload.userName.trim(),
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
    },
  });
};

const getTestimonials = async () => {
  return prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
};

const updateTestimonial = async (id: string, payload: ITestimonialUpdatePayload) => {
  const existing = await prisma.testimonial.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Testimonial not found", status.NOT_FOUND);
  }

  return prisma.testimonial.update({
    where: { id },
    data: {
      ...(payload.description !== undefined ? { description: payload.description.trim() } : {}),
      ...(payload.userImage !== undefined ? { userImage: payload.userImage } : {}),
      ...(payload.userName !== undefined ? { userName: payload.userName.trim() } : {}),
      ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
};

const deleteTestimonial = async (id: string) => {
  const existing = await prisma.testimonial.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Testimonial not found", status.NOT_FOUND);
  }

  await prisma.testimonial.delete({ where: { id } });

  return { deleted: true, id };
};

export const HomeSettingService = {
  getBannerSetting,
  upsertBannerSetting,
  createLogoSliderItem,
  getLogoSliderItems,
  updateLogoSliderItem,
  deleteLogoSliderItem,
  createTheme,
  getThemes,
  updateTheme,
  activateTheme,
  getActiveTheme,
  setFeaturedCategories,
  getFeaturedCategories,
  addPopularCategory,
  setPopularCategories,
  getPopularCategories,
  updatePopularCategory,
  deletePopularCategory,
  setRecommendedCategories,
  getRecommendedCategories,
  createTestimonial,
  getTestimonials,
  updateTestimonial,
  deleteTestimonial,
};
