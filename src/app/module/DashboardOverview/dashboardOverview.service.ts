import { DeliveryStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

const toPositiveInt = (value: string | undefined, fallback: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(max, Math.floor(parsed));
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getNextMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const percentChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return round2(((current - previous) / previous) * 100);
};

const toOrderCode = (orderId: string) => {
  const segment = orderId.slice(-6).toUpperCase();
  return `ORD-${segment}`;
};

export const getOverviewCards = async () => {
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const nextMonthStart = getNextMonthStart(now);
  const prevMonthStart = addMonths(currentMonthStart, -1);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const last30Start = new Date(now);
  last30Start.setDate(now.getDate() - 30);

  const prev30Start = new Date(now);
  prev30Start.setDate(now.getDate() - 60);

  const [
    totalProducts,
    currentMonthProducts,
    previousMonthProducts,
    activeCoupons,
    newCouponsThisWeek,
    lowStockAlerts,
    lowStockSinceYesterday,
    paidRevenueLast30,
    paidRevenuePrevious30,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
    prisma.product.count({ where: { createdAt: { gte: prevMonthStart, lt: currentMonthStart } } }),
    prisma.coupon.count({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
    }),
    prisma.coupon.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { quantity: { lt: 5 } } }),
    prisma.product.count({ where: { quantity: { lt: 5 }, updatedAt: { gte: yesterday } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: last30Start, lt: now },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: { gte: prev30Start, lt: last30Start },
      },
    }),
  ]);

  const revenue30 = paidRevenueLast30._sum.total ?? 0;
  const revenuePrev30 = paidRevenuePrevious30._sum.total ?? 0;

  return {
    totalProducts: {
      value: totalProducts,
      growthPercent: percentChange(currentMonthProducts, previousMonthProducts),
      currentMonthNew: currentMonthProducts,
    },
    activeCoupons: {
      value: activeCoupons,
      newThisWeek: newCouponsThisWeek,
    },
    lowStockAlerts: {
      value: lowStockAlerts,
      newSinceYesterday: lowStockSinceYesterday,
    },
    revenue30Days: {
      value: round2(revenue30),
      growthPercent: percentChange(revenue30, revenuePrev30),
    },
  };
};

export const getMonthlyRevenue = async (monthsRaw?: string) => {
  const months = toPositiveInt(monthsRaw, 6, 24);
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const startMonth = addMonths(currentMonthStart, -(months - 1));
  const endExclusive = addMonths(currentMonthStart, 1);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startMonth,
        lt: endExclusive,
      },
    },
    select: {
      createdAt: true,
      total: true,
      paymentStatus: true,
    },
  });

  const monthMap = new Map<string, { month: string; monthIndex: number; revenue: number; orders: number }>();

  for (let i = 0; i < months; i += 1) {
    const d = addMonths(startMonth, i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthMap.set(key, {
      month: d.toLocaleString("en-US", { month: "short" }),
      monthIndex: i,
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    const d = order.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthMap.get(key);
    if (!bucket) {
      continue;
    }

    bucket.orders += 1;
    if (order.paymentStatus === PaymentStatus.PAID) {
      bucket.revenue += order.total;
    }
  }

  const data = [...monthMap.values()]
    .sort((a, b) => a.monthIndex - b.monthIndex)
    .map((item) => ({
      month: item.month,
      revenue: round2(item.revenue),
      orders: item.orders,
    }));

  return {
    months,
    data,
  };
};

export const getOrdersByStatus = async () => {
  const now = new Date();
  const monthStart = getMonthStart(now);
  const nextMonthStart = getNextMonthStart(now);

  const grouped = await prisma.order.groupBy({
    by: ["deliveryStatus"],
    _count: { _all: true },
    where: {
      createdAt: { gte: monthStart, lt: nextMonthStart },
    },
  });

  const statuses = Object.values(DeliveryStatus);
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  const data = statuses.map((status) => {
    const found = grouped.find((g) => g.deliveryStatus === status);
    const count = found?._count._all ?? 0;

    return {
      status,
      count,
      percentage: total === 0 ? 0 : round2((count / total) * 100),
    };
  });

  return {
    total,
    data,
  };
};

export const getRecentOrders = async (limitRaw?: string) => {
  const limit = toPositiveInt(limitRaw, 5, 20);

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        select: {
          productTitle: true,
          quantity: true,
        },
      },
    },
  });

  return {
    total: orders.length,
    data: orders.map((order) => {
      const firstItem = order.items[0];
      const extraItemCount = Math.max(0, order.items.length - 1);
      const itemSummary = firstItem
        ? `${firstItem.productTitle}${extraItemCount > 0 ? ` +${extraItemCount} more` : ""}`
        : "No items";

      return {
        id: order.id,
        orderCode: toOrderCode(order.id),
        customerName: `${order.firstName} ${order.lastName}`.trim(),
        itemSummary,
        total: round2(order.total),
        paymentStatus: order.paymentStatus,
        deliveryStatus: order.deliveryStatus,
        createdAt: order.createdAt,
      };
    }),
  };
};

export const getSalesByCategory = async (limitRaw?: string) => {
  const limit = toPositiveInt(limitRaw, 6, 20);
  const now = new Date();
  const monthStart = getMonthStart(now);
  const nextMonthStart = getNextMonthStart(now);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
    },
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
  });

  const map = new Map<string, { categoryId: string; categoryName: string; amount: number; units: number }>();

  for (const item of orderItems) {
    const category = item.product?.subCategory?.category;
    const categoryId = category?.id ?? "uncategorized";
    const categoryName = category?.name ?? "Uncategorized";

    const existing = map.get(categoryId);
    if (existing) {
      existing.amount += item.lineTotal;
      existing.units += item.quantity;
    } else {
      map.set(categoryId, {
        categoryId,
        categoryName,
        amount: item.lineTotal,
        units: item.quantity,
      });
    }
  }

  const all = [...map.values()].sort((a, b) => b.amount - a.amount);
  const selected = all.slice(0, limit);
  const totalAmount = selected.reduce((sum, entry) => sum + entry.amount, 0);

  return {
    totalCategories: selected.length,
    data: selected.map((entry) => ({
      categoryId: entry.categoryId,
      categoryName: entry.categoryName,
      salesAmount: round2(entry.amount),
      unitsSold: entry.units,
      percentage: totalAmount === 0 ? 0 : round2((entry.amount / totalAmount) * 100),
    })),
  };
};

export const getLowStockAlerts = async (thresholdRaw?: string, limitRaw?: string) => {
  const threshold = toPositiveInt(thresholdRaw, 5, 200);
  const limit = toPositiveInt(limitRaw, 20, 200);

  const products = await prisma.product.findMany({
    where: {
      quantity: {
        lt: threshold,
      },
    },
    orderBy: [{ quantity: "asc" }, { updatedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      quantity: true,
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      updatedAt: true,
    },
  });

  return {
    threshold,
    total: products.length,
    data: products.map((product) => ({
      ...product,
      level: product.quantity <= 2 ? "critical" : "warning",
    })),
  };
};

export const getFullOverview = async (query: {
  months?: string;
  recentLimit?: string;
  categoryLimit?: string;
  lowStockLimit?: string;
  threshold?: string;
}) => {
  const [cards, monthlyRevenue, ordersByStatus, recentOrders, salesByCategory, lowStockAlerts] = await Promise.all([
    getOverviewCards(),
    getMonthlyRevenue(query.months),
    getOrdersByStatus(),
    getRecentOrders(query.recentLimit),
    getSalesByCategory(query.categoryLimit),
    getLowStockAlerts(query.threshold, query.lowStockLimit),
  ]);

  return {
    cards,
    monthlyRevenue,
    ordersByStatus,
    recentOrders,
    salesByCategory,
    lowStockAlerts,
  };
};
