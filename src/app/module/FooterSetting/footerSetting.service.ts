import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IUpsertFooterSettingPayload } from "./footerSetting.interface.js";

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizePaymentAccepts = (values: string[] | undefined) => {
  if (!values) {
    return undefined;
  }

  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
};

export const getLatestFooterSetting = async () => {
  return prisma.footerSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

export const getFooterSettingById = async (id: string) => {
  const footerSetting = await prisma.footerSetting.findUnique({ where: { id } });

  if (!footerSetting) {
    throw new AppError("Footer setting not found", status.NOT_FOUND);
  }

  return footerSetting;
};

export const upsertFooterSetting = async (payload: IUpsertFooterSettingPayload) => {
  const existing = await prisma.footerSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const data = {
    title: payload.title.trim(),

    address: normalizeOptionalString(payload.address),
    store: normalizeOptionalString(payload.store),
    district: normalizeOptionalString(payload.district),
    experience: normalizeOptionalString(payload.experience),

    paymentAccepts: normalizePaymentAccepts(payload.paymentAccepts) ?? [],

    facebookLink: normalizeOptionalString(payload.facebookLink),
    twitterLink: normalizeOptionalString(payload.twitterLink),
    youtubeLink: normalizeOptionalString(payload.youtubeLink),
    whatsappLink: normalizeOptionalString(payload.whatsappLink),

    playStoreLink: normalizeOptionalString(payload.playStoreLink),
    appleStoreLink: normalizeOptionalString(payload.appleStoreLink),

    hotline: normalizeOptionalString(payload.hotline),
    email: normalizeOptionalString(payload.email),
    hq: normalizeOptionalString(payload.hq),
  };

  if (!existing) {
    return prisma.footerSetting.create({ data });
  }

  return prisma.footerSetting.update({
    where: { id: existing.id },
    data,
  });
};

export const createFooterSetting = async (payload: IUpsertFooterSettingPayload) => {
  const data = {
    title: payload.title.trim(),

    address: normalizeOptionalString(payload.address),
    store: normalizeOptionalString(payload.store),
    district: normalizeOptionalString(payload.district),
    experience: normalizeOptionalString(payload.experience),

    paymentAccepts: normalizePaymentAccepts(payload.paymentAccepts) ?? [],

    facebookLink: normalizeOptionalString(payload.facebookLink),
    twitterLink: normalizeOptionalString(payload.twitterLink),
    youtubeLink: normalizeOptionalString(payload.youtubeLink),
    whatsappLink: normalizeOptionalString(payload.whatsappLink),

    playStoreLink: normalizeOptionalString(payload.playStoreLink),
    appleStoreLink: normalizeOptionalString(payload.appleStoreLink),

    hotline: normalizeOptionalString(payload.hotline),
    email: normalizeOptionalString(payload.email),
    hq: normalizeOptionalString(payload.hq),
  };

  return prisma.footerSetting.create({ data });
};

export const deleteFooterSetting = async (id: string) => {
  const existing = await prisma.footerSetting.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Footer setting not found", status.NOT_FOUND);
  }

  return prisma.footerSetting.delete({ where: { id } });
};
