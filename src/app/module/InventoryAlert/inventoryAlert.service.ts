import { prisma } from "../../lib/prisma.js";

const getLowStockAlerts = async (threshold?: number) => {
  const normalizedThreshold = Number.isFinite(threshold as number)
    ? Math.max(0, Math.floor(threshold as number))
    : 5;

  const products = await prisma.product.findMany({
    where: {
      quantity: {
        lt: normalizedThreshold,
      },
    },
    orderBy: [{ quantity: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      quantity: true,
      price: true,
      discountPrice: true,
      rating: true,
      reviewCount: true,
      likeCount: true,
      images: true,
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
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    threshold: normalizedThreshold,
    totalAlerts: products.length,
    data: products,
  };
};

export const InventoryAlertService = {
  getLowStockAlerts,
};
