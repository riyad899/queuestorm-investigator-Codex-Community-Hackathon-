import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateLatestOfferPayload,
  IUpdateLatestOfferPayload,
} from "./latestOffer.interface.js";

const isOfferActiveNow = (offer: { isActive: boolean; offerStartAt: Date; offerEndAt: Date }) => {
  const now = new Date();
  return offer.isActive && offer.offerStartAt <= now && offer.offerEndAt >= now;
};

const connectFeaturedProducts = async (latestOfferId: string) => {
  const featuredProducts = await prisma.product.findMany({
    where: { isFeatured: true },
    select: { id: true },
  });

  if (featuredProducts.length === 0) {
    return;
  }

  await prisma.latestOfferProduct.createMany({
    data: featuredProducts.map((product) => ({
      latestOfferId,
      productId: product.id,
    })),
    skipDuplicates: true,
  });
};

export const createLatestOffer = async (payload: ICreateLatestOfferPayload) => {
  const created = await prisma.latestOffer.create({
    data: {
      title: payload.title.trim(),
      description: payload.description?.trim(),
      offerStartAt: new Date(payload.offerStartAt),
      offerEndAt: new Date(payload.offerEndAt),
      isActive: payload.isActive ?? true,
    },
  });

  if (isOfferActiveNow(created)) {
    await connectFeaturedProducts(created.id);
  }

  return prisma.latestOffer.findUnique({
    where: { id: created.id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const updateLatestOffer = async (id: string, payload: IUpdateLatestOfferPayload) => {
  const existing = await prisma.latestOffer.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Latest offer not found", status.NOT_FOUND);
  }

  const updated = await prisma.latestOffer.update({
    where: { id },
    data: {
      ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
      ...(payload.description !== undefined ? { description: payload.description?.trim() ?? null } : {}),
      ...(payload.offerStartAt !== undefined ? { offerStartAt: new Date(payload.offerStartAt) } : {}),
      ...(payload.offerEndAt !== undefined ? { offerEndAt: new Date(payload.offerEndAt) } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });

  if (isOfferActiveNow(updated)) {
    await prisma.latestOfferProduct.deleteMany({ where: { latestOfferId: id } });
    await connectFeaturedProducts(id);
  }

  return prisma.latestOffer.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getLatestOfferById = async (id: string) => {
  const offer = await prisma.latestOffer.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!offer) {
    throw new AppError("Latest offer not found", status.NOT_FOUND);
  }

  return offer;
};

export const getActiveLatestOffer = async () => {
  const now = new Date();

  return prisma.latestOffer.findFirst({
    where: {
      isActive: true,
      offerStartAt: { lte: now },
      offerEndAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });
};
