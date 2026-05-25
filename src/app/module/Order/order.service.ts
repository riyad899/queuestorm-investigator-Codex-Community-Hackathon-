import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import {
  ICreateOrderPayload,
  IOrderListQuery,
  IUpdateOrderDeliveryPayload,
  IUpdateOrderPaymentPayload,
} from "./order.interface.js";
import { getDeliveryFeeByKey, getPaymentMethodByKey } from "../PaymentSetting/paymentSetting.service.js";
import { validateCoupon as validateCouponService } from "../Coupon/coupon.service.js";

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const createOrder = async (payload: ICreateOrderPayload, userId?: string) => {
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
    const lineTotal = unitPrice * item.quantity;

    return {
      productId: product.id,
      productTitle: product.title,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    };
  });

  const subTotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = await getDeliveryFeeByKey(payload.deliveryMethodKey);
  const paymentMethod = await getPaymentMethodByKey(payload.paymentMethodKey);
  const transactionId = normalizeOptionalString(payload.transactionId);

  if (paymentMethod?.transactionIdRequired && !transactionId) {
    throw new AppError("Transaction ID is required for the selected payment method", status.BAD_REQUEST);
  }

  let discountAmount = 0;
  let couponId: string | undefined;
  let couponCodeSnapshot: string | undefined;

  if (payload.couponCode) {
    const couponResult = await validateCouponService({
      code: payload.couponCode,
      items: payload.items,
      deliveryMethodKey: payload.deliveryMethodKey,
    });

    discountAmount = couponResult.discountAmount;
    couponId = couponResult.coupon.id;
    couponCodeSnapshot = couponResult.coupon.code;
  }

  const total = Math.max(0, subTotal + deliveryFee - discountAmount);

  return prisma.$transaction(async (tx) => {
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return tx.order.create({
      data: {
        userId,

        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        address: payload.address.trim(),
        upazilaThana: payload.upazilaThana.trim(),
        district: payload.district.trim(),
        mobile: payload.mobile.trim(),
        email: payload.email.trim(),
        comment: normalizeOptionalString(payload.comment),

        paymentMethodKey: normalizeOptionalString(payload.paymentMethodKey),
        transactionId,
        deliveryMethodKey: normalizeOptionalString(payload.deliveryMethodKey),

        couponId,
        couponCodeSnapshot,
        discountAmount,

        subTotal,
        deliveryFee,
        total,

        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        coupon: true,
      },
    });
  });
};

export const getOrders = async (query: IOrderListQuery) => {
  const search = typeof query.search === "string" ? query.search.trim() : undefined;

  return prisma.order.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { mobile: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        query.paymentStatus ? { paymentStatus: query.paymentStatus } : {},
        query.deliveryStatus ? { deliveryStatus: query.deliveryStatus } : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
  });
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", status.NOT_FOUND);
  }

  return order;
};

export const getCustomerOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      address: true,
      upazilaThana: true,
      district: true,
      mobile: true,
      email: true,
      comment: true,
      paymentMethodKey: true,
      transactionId: true,
      deliveryMethodKey: true,
      couponCodeSnapshot: true,
      discountAmount: true,
      subTotal: true,
      deliveryFee: true,
      total: true,
      paymentStatus: true,
      deliveryStatus: true,
      paidAt: true,
      deliveredAt: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          productTitle: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
          productId: true,
          product: {
            select: {
              id: true,
              title: true,
              price: true,
              discountPrice: true,
              images: true,
              isFeatured: true,
              brand: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              subCategory: {
                select: {
                  id: true,
                  name: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      coupon: {
        select: {
          id: true,
          code: true,
          title: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", status.NOT_FOUND);
  }

  return order;
};

export const updateOrderPayment = async (id: string, payload: IUpdateOrderPaymentPayload) => {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Order not found", status.NOT_FOUND);
  }

  return prisma.order.update({
    where: { id },
    data: {
      paymentStatus: payload.paymentStatus,
      paidAt: payload.paymentStatus === "PAID" ? new Date() : null,
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
};

export const updateOrderDelivery = async (id: string, payload: IUpdateOrderDeliveryPayload) => {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Order not found", status.NOT_FOUND);
  }

  return prisma.order.update({
    where: { id },
    data: {
      deliveryStatus: payload.deliveryStatus,
      deliveredAt: payload.deliveryStatus === "DELIVERED" ? new Date() : null,
    },
    include: {
      items: {
        include: { product: true },
      },
    },
  });
};
