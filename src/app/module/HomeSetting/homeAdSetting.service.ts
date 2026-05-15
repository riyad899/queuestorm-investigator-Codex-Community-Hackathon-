import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IUpsertBigAdPayload, IUpsertSideAdsPayload } from "./homeAdSetting.interface.js";

const getLatestAdSetting = async () => {
  return prisma.homeAdSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

const upsertBigAd = async (payload: IUpsertBigAdPayload) => {
  const existing = await getLatestAdSetting();

  if (!existing) {
    return prisma.homeAdSetting.create({
      data: {
        bigAdImage: payload.bigAdImage,
        sideAdImages: [],
      },
    });
  }

  return prisma.homeAdSetting.update({
    where: { id: existing.id },
    data: {
      bigAdImage: payload.bigAdImage,
    },
  });
};

const upsertSideAds = async (payload: IUpsertSideAdsPayload) => {
  const existing = await getLatestAdSetting();

  if (!existing) {
    return prisma.homeAdSetting.create({
      data: {
        bigAdImage: null,
        sideAdImages: payload.sideAdImages,
      },
    });
  }

  return prisma.homeAdSetting.update({
    where: { id: existing.id },
    data: {
      sideAdImages: payload.sideAdImages,
    },
  });
};

const getBigAd = async () => {
  const setting = await getLatestAdSetting();
  return {
    id: setting?.id ?? null,
    bigAdImage: setting?.bigAdImage ?? null,
    createdAt: setting?.createdAt ?? null,
    updatedAt: setting?.updatedAt ?? null,
  };
};

const getSideAds = async () => {
  const setting = await getLatestAdSetting();
  return {
    id: setting?.id ?? null,
    sideAdImages: setting?.sideAdImages ?? [],
    createdAt: setting?.createdAt ?? null,
    updatedAt: setting?.updatedAt ?? null,
  };
};

const ensureAdSettingExists = async () => {
  const setting = await getLatestAdSetting();
  if (!setting) {
    throw new AppError("Ad setting not found", status.NOT_FOUND);
  }
  return setting;
};

export const HomeAdSettingService = {
  upsertBigAd,
  upsertSideAds,
  getBigAd,
  getSideAds,
  ensureAdSettingExists,
};
