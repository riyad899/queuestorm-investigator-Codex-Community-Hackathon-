import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { DiscountType } from "@prisma/client";
import { getDeliveryFeeByKey } from "../PaymentSetting/paymentSetting.service.js";
import {
  ICouponValidatePayload,
  ICreateCouponPayload,
  IUpdateCouponPayload,
} from "./coupon.interface.js";

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toCouponCode = (code: string) => code.trim().toUpperCase();

const ensureProductsExist = async (productIds: string[]) => {
  if (productIds.length === 0) {
    return;
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products were not found", status.BAD_REQUEST);
  }
};

export const createCoupon = async (payload: ICreateCouponPayload) => {
  const code = toCouponCode(payload.code);

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    throw new AppError("Coupon code already exists", status.CONFLICT);
  }

  const productIds = [...new Set(payload.productIds ?? [])];
  await ensureProductsExist(productIds);

  return prisma.coupon.create({
    data: {
      code,
      title: normalizeOptionalString(payload.title),
      description: normalizeOptionalString(payload.description),

      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxDiscount: payload.maxDiscount,

      minOrderAmount: payload.minOrderAmount,
      usageLimit: payload.usageLimit,

      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,

      isActive: payload.isActive ?? true,

      products: productIds.length
        ? {
            create: productIds.map((productId) => ({ productId })),
          }
        : undefined,
    },
    include: {
      products: { include: { product: true } },
    },
  });
};

export const getCoupons = async () => {
  return prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: {
      products: { include: { product: true } },
    },
  });
};

export const getCouponById = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { products: { include: { product: true } } },
  });

  if (!coupon) {
    throw new AppError("Coupon not found", status.NOT_FOUND);
  }

  return coupon;
};

export const updateCoupon = async (id: string, payload: IUpdateCouponPayload) => {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Coupon not found", status.NOT_FOUND);
  }

  const code = payload.code ? toCouponCode(payload.code) : undefined;
  if (code && code !== existing.code) {
    const codeExists = await prisma.coupon.findUnique({ where: { code } });
    if (codeExists) {
      throw new AppError("Coupon code already exists", status.CONFLICT);
    }
  }

  const productIds = payload.productIds ? [...new Set(payload.productIds)] : undefined;
  if (productIds) {
    await ensureProductsExist(productIds);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.coupon.update({
      where: { id },
      data: {
        ...(code !== undefined ? { code } : {}),
        ...(payload.title !== undefined ? { title: payload.title?.trim() ?? null } : {}),
        ...(payload.description !== undefined ? { description: payload.description?.trim() ?? null } : {}),

        ...(payload.discountType !== undefined ? { discountType: payload.discountType } : {}),
        ...(payload.discountValue !== undefined ? { discountValue: payload.discountValue } : {}),
        ...(payload.maxDiscount !== undefined ? { maxDiscount: payload.maxDiscount ?? null } : {}),

        ...(payload.minOrderAmount !== undefined ? { minOrderAmount: payload.minOrderAmount ?? null } : {}),
        ...(payload.usageLimit !== undefined ? { usageLimit: payload.usageLimit ?? null } : {}),

        ...(payload.startsAt !== undefined
          ? { startsAt: payload.startsAt ? new Date(payload.startsAt) : null }
          : {}),
        ...(payload.endsAt !== undefined ? { endsAt: payload.endsAt ? new Date(payload.endsAt) : null } : {}),

        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });

    if (productIds) {
      await tx.couponProduct.deleteMany({ where: { couponId: id } });
      if (productIds.length) {
        await tx.couponProduct.createMany({
          data: productIds.map((productId) => ({ couponId: id, productId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.coupon.findUnique({
      where: { id: updated.id },
      include: { products: { include: { product: true } } },
    });
  });
};

const computeDiscountAmount = (args: {
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
  eligibleAmount: number;
}) => {
  const { discountType, discountValue, maxDiscount, eligibleAmount } = args;

  if (eligibleAmount <= 0) {
    return 0;
  }

  if (discountType === DiscountType.PERCENT) {
    const raw = (eligibleAmount * discountValue) / 100;
    const capped = maxDiscount != null ? Math.min(raw, maxDiscount) : raw;
    return Math.max(0, capped);
  }

  // FIXED
  return Math.max(0, Math.min(discountValue, eligibleAmount));
};

export const validateCoupon = async (payload: ICouponValidatePayload) => {
  const code = toCouponCode(payload.code);

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { products: true },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError("Invalid coupon", status.BAD_REQUEST);
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new AppError("Coupon is not active yet", status.BAD_REQUEST);
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    throw new AppError("Coupon has expired", status.BAD_REQUEST);
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", status.BAD_REQUEST);
  }

  const items = payload.items;
  const productIds = [...new Set(items.map((i) => i.productId))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, price: true, discountPrice: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products were not found", status.BAD_REQUEST);
  }

  const productById = new Map(products.map((p) => [p.id, p] as const));

  const orderItems = items.map((item) => {
    const product = productById.get(item.productId)!;
    const unitPrice = product.discountPrice ?? product.price;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subTotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

  if (coupon.minOrderAmount != null && subTotal < coupon.minOrderAmount) {
    throw new AppError("Order amount does not meet coupon minimum", status.BAD_REQUEST);
  }

  const restrictedProductIds = coupon.products.map((p) => p.productId);
  const isRestricted = restrictedProductIds.length > 0;
  const eligibleAmount = isRestricted
    ? orderItems
        .filter((i) => restrictedProductIds.includes(i.productId))
        .reduce((sum, i) => sum + i.lineTotal, 0)
    : subTotal;

  if (isRestricted && eligibleAmount <= 0) {
    throw new AppError("Coupon is not applicable to selected products", status.BAD_REQUEST);
  }

  const discountAmount = computeDiscountAmount({
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscount: coupon.maxDiscount,
    eligibleAmount,
  });

  const deliveryFee = await getDeliveryFeeByKey(payload.deliveryMethodKey);
  const total = Math.max(0, subTotal + deliveryFee - discountAmount);

  return {
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    subTotal,
    deliveryFee,
    discountAmount,
    total,
  };
};
