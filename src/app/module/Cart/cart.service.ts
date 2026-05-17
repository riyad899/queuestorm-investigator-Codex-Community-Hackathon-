import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { ICartItemPayload, IUpdateCartItemPayload } from "./cart.interface.js";

const productSelect = {
  id: true,
  title: true,
  price: true,
  discountPrice: true,
  images: true,
};

const buildCartResponse = (cart: {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      price: number;
      discountPrice: number | null;
      images: string[];
    };
  }[];
}) => {
  const items = cart.items.map((item) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    const lineTotal = unitPrice * item.quantity;

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      product: item.product,
    };
  });

  const subTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subTotal,
    total: subTotal,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const getCartByUserId = async (userId: string) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: productSelect,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

const ensureCart = async (userId: string) => {
  const existing = await getCartByUserId(userId);
  if (existing) {
    return existing;
  }

  return prisma.cart.create({
    data: { userId },
    include: {
      items: {
        include: {
          product: {
            select: productSelect,
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
};

const getCart = async (userId: string) => {
  const cart = await ensureCart(userId);
  return buildCartResponse(cart);
};

const addItem = async (userId: string, payload: ICartItemPayload) => {
  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
    select: { id: true },
  });

  if (!product) {
    throw new AppError("Product not found", status.NOT_FOUND);
  }

  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId: payload.productId,
      },
    },
    create: {
      cartId: cart.id,
      productId: payload.productId,
      quantity: payload.quantity,
    },
    update: {
      quantity: { increment: payload.quantity },
    },
  });

  const updatedCart = await getCartByUserId(userId);
  if (!updatedCart) {
    throw new AppError("Cart not found", status.NOT_FOUND);
  }

  return buildCartResponse(updatedCart);
};

const updateItem = async (userId: string, productId: string, payload: IUpdateCartItemPayload) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new AppError("Cart not found", status.NOT_FOUND);
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (!existingItem) {
    throw new AppError("Cart item not found", status.NOT_FOUND);
  }

  await prisma.cartItem.update({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    data: {
      quantity: payload.quantity,
    },
  });

  const updatedCart = await getCartByUserId(userId);
  if (!updatedCart) {
    throw new AppError("Cart not found", status.NOT_FOUND);
  }

  return buildCartResponse(updatedCart);
};

const removeItem = async (userId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new AppError("Cart not found", status.NOT_FOUND);
  }

  const deleted = await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (deleted.count === 0) {
    throw new AppError("Cart item not found", status.NOT_FOUND);
  }

  const updatedCart = await getCartByUserId(userId);
  if (!updatedCart) {
    throw new AppError("Cart not found", status.NOT_FOUND);
  }

  return buildCartResponse(updatedCart);
};

export const CartService = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
