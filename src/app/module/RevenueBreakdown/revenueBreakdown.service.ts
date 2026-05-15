import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const round2 = (value: number) => Math.round(value * 100) / 100;

const toPositiveInt = (value: string | undefined, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(max, Math.floor(parsed));
};

const toPercent = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.min(100, parsed);
};

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getNextMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);
const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const formatMonthLabel = (date: Date) => date.toLocaleString("en-US", { month: "short" });

const buildMonthBuckets = (startMonth: Date, months: number) => {
  return Array.from({ length: months }, (_, index) => {
    const date = addMonths(startMonth, index);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: formatMonthLabel(date),
      date,
      grossRevenue: 0,
      refunds: 0,
      orders: 0,
    };
  });
};

const getPaidAndRefundOrders = async (startDate: Date, endDate: Date) => {
  return prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      total: true,
      deliveryStatus: true,
      paymentStatus: true,
      paymentMethodKey: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          lineTotal: true,
          product: {
            select: {
              subCategory: {
                select: {
                  category: {
                    select: {
                      id: true,
                      name: true,
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
};

const getPaymentMethodMap = async () => {
  const setting = await prisma.paymentSetting.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      paymentMethods: true,
    },
  });

  const map = new Map<string, string>();
  for (const method of setting?.paymentMethods ?? []) {
    map.set(method.key.toLowerCase(), method.name);
  }
  return map;
};

export const getRevenueSummary = async (query: { months?: string; taxRate?: string }) => {
  const months = toPositiveInt(query.months, 6, 24);
  const taxRate = toPercent(query.taxRate, 15);

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const startMonth = addMonths(currentMonthStart, -(months - 1));
  const endExclusive = getNextMonthStart(now);
  const previousStart = addMonths(startMonth, -months);

  const [currentOrders, previousOrders] = await Promise.all([
    getPaidAndRefundOrders(startMonth, endExclusive),
    getPaidAndRefundOrders(previousStart, startMonth),
  ]);

  const grossRevenue = currentOrders
    .filter((order) => order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + order.total, 0);

  const refunds = currentOrders
    .filter((order) => order.deliveryStatus === DeliveryStatus.CANCELED && order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + order.total, 0);

  const netRevenue = Math.max(0, grossRevenue - refunds);
  const totalOrders = currentOrders.length;
  const totalTax = round2((netRevenue * taxRate) / 100);

  const previousGross = previousOrders
    .filter((order) => order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + order.total, 0);
  const previousRefunds = previousOrders
    .filter((order) => order.deliveryStatus === DeliveryStatus.CANCELED && order.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, order) => sum + order.total, 0);
  const previousNet = Math.max(0, previousGross - previousRefunds);

  const growthPercent = previousNet === 0 ? (netRevenue === 0 ? 0 : 100) : round2(((netRevenue - previousNet) / previousNet) * 100);
  const orderGrowthPercent = previousOrders.length === 0 ? (totalOrders === 0 ? 0 : 100) : round2(((totalOrders - previousOrders.length) / previousOrders.length) * 100);
  const refundGrowthPercent = previousRefunds === 0 ? (refunds === 0 ? 0 : 100) : round2(((refunds - previousRefunds) / previousRefunds) * 100);

  return {
    months,
    taxRate,
    totalRevenue: {
      value: round2(netRevenue),
      grossRevenue: round2(grossRevenue),
      refunds: round2(refunds),
      growthPercent,
    },
    totalOrders: {
      value: totalOrders,
      growthPercent: orderGrowthPercent,
    },
    totalRefunds: {
      value: round2(refunds),
      growthPercent: refundGrowthPercent,
    },
    taxCollected: {
      value: totalTax,
      effectiveRate: taxRate,
    },
  };
};

export const getMonthlyOverview = async (query: { months?: string; taxRate?: string }) => {
  const months = toPositiveInt(query.months, 6, 24);
  const taxRate = toPercent(query.taxRate, 15);

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const startMonth = addMonths(currentMonthStart, -(months - 1));
  const endExclusive = getNextMonthStart(now);

  const orders = await getPaidAndRefundOrders(startMonth, endExclusive);
  const buckets = buildMonthBuckets(startMonth, months);

  for (const order of orders) {
    const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
    const bucket = buckets.find((entry) => entry.key === key);
    if (!bucket) {
      continue;
    }

    bucket.orders += 1;
    if (order.paymentStatus === PaymentStatus.PAID) {
      bucket.grossRevenue += order.total;
    }
    if (order.deliveryStatus === DeliveryStatus.CANCELED && order.paymentStatus === PaymentStatus.PAID) {
      bucket.refunds += order.total;
    }
  }

  const data = buckets.map((bucket) => {
    const netRevenue = Math.max(0, bucket.grossRevenue - bucket.refunds);
    return {
      month: bucket.month,
      grossRevenue: round2(bucket.grossRevenue),
      refunds: round2(bucket.refunds),
      netRevenue: round2(netRevenue),
      tax: round2((netRevenue * taxRate) / 100),
      margin: bucket.grossRevenue === 0 ? 0 : round2((netRevenue / bucket.grossRevenue) * 100),
      orders: bucket.orders,
    };
  });

  return {
    months,
    taxRate,
    data,
  };
};

export const getPaymentMethodsBreakdown = async (query: { months?: string }) => {
  const months = toPositiveInt(query.months, 6, 24);

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const startMonth = addMonths(currentMonthStart, -(months - 1));
  const endExclusive = getNextMonthStart(now);

  const orders = await getPaidAndRefundOrders(startMonth, endExclusive);
  const methodNames = await getPaymentMethodMap();

  const map = new Map<string, { key: string; name: string; amount: number; count: number }>();

  for (const order of orders) {
    if (order.paymentStatus !== PaymentStatus.PAID) {
      continue;
    }

    const key = order.paymentMethodKey?.trim().toLowerCase() || "unknown";
    const name = order.paymentMethodKey ? methodNames.get(key) ?? order.paymentMethodKey : "Unknown";
    const existing = map.get(key);
    if (existing) {
      existing.amount += order.total;
      existing.count += 1;
    } else {
      map.set(key, { key, name, amount: order.total, count: 1 });
    }
  }

  const data = [...map.values()].sort((a, b) => b.amount - a.amount);
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return {
    months,
    total: round2(total),
    data: data.map((item) => ({
      key: item.key,
      name: item.name,
      revenue: round2(item.amount),
      orders: item.count,
      percentage: total === 0 ? 0 : round2((item.amount / total) * 100),
    })),
  };
};

export const getMonthlyBreakdownTable = async (query: { months?: string; taxRate?: string }) => {
  return getMonthlyOverview(query);
};

export const getCategoryBreakdown = async (query: { months?: string; categoryLimit?: string }) => {
  const months = toPositiveInt(query.months, 6, 24);
  const limit = toPositiveInt(query.categoryLimit, 6, 20);

  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const startMonth = addMonths(currentMonthStart, -(months - 1));
  const endExclusive = getNextMonthStart(now);

  const orders = await getPaidAndRefundOrders(startMonth, endExclusive);
  const map = new Map<string, { categoryId: string; categoryName: string; revenue: number; units: number }>();

  for (const order of orders) {
    if (order.paymentStatus !== PaymentStatus.PAID) {
      continue;
    }

    for (const item of order.items) {
      const category = item.product?.subCategory?.category;
      const categoryId = category?.id ?? "uncategorized";
      const categoryName = category?.name ?? "Uncategorized";
      const revenue = item.lineTotal;
      const units = item.quantity;

      const existing = map.get(categoryId);
      if (existing) {
        existing.revenue += revenue;
        existing.units += units;
      } else {
        map.set(categoryId, { categoryId, categoryName, revenue, units });
      }
    }
  }

  const data = [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return {
    months,
    totalRevenue: round2(totalRevenue),
    data: data.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      revenue: round2(item.revenue),
      units: item.units,
      percentage: totalRevenue === 0 ? 0 : round2((item.revenue / totalRevenue) * 100),
    })),
  };
};

export const getRevenueBreakdownFull = async (query: { months?: string; taxRate?: string; limit?: string; categoryLimit?: string }) => {
  const [summary, monthlyOverview, paymentMethods, categoryBreakdown] = await Promise.all([
    getRevenueSummary({ months: query.months, taxRate: query.taxRate }),
    getMonthlyOverview({ months: query.months, taxRate: query.taxRate }),
    getPaymentMethodsBreakdown({ months: query.months }),
    getCategoryBreakdown({ months: query.months, categoryLimit: query.categoryLimit }),
  ]);

  return {
    summary,
    monthlyOverview,
    paymentMethods,
    categoryBreakdown,
  };
};
