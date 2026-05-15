import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { IUpdateCustomerNotificationSettingPayload } from "./customerNotification.interface.js";

const getLatestSettingForUser = async (userId: string) => {
  return prisma.customerNotificationSetting.findUnique({
    where: { userId },
  });
};

const ensureSettingForUser = async (userId: string) => {
  const existing = await getLatestSettingForUser(userId);

  if (existing) {
    return existing;
  }

  return prisma.customerNotificationSetting.create({
    data: {
      userId,
    },
  });
};

const getMyNotificationSetting = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new AppError("User not found", status.NOT_FOUND);
  }

  return ensureSettingForUser(userId);
};

const updateMyNotificationSetting = async (
  userId: string,
  payload: IUpdateCustomerNotificationSettingPayload,
  requester: IRequestUser,
) => {
  if (requester.userId !== userId) {
    throw new AppError("You can only update your own notification settings", status.FORBIDDEN);
  }

  const existing = await ensureSettingForUser(userId);

  return prisma.customerNotificationSetting.update({
    where: { userId: existing.userId },
    data: {
      ...(payload.newProductsArrive !== undefined ? { newProductsArrive: payload.newProductsArrive } : {}),
      ...(payload.latestOffersAdd !== undefined ? { latestOffersAdd: payload.latestOffersAdd } : {}),
      ...(payload.orderPurchasedSuccessfully !== undefined
        ? { orderPurchasedSuccessfully: payload.orderPurchasedSuccessfully }
        : {}),
    },
  });
};

const disableAllMyNotifications = async (userId: string, requester: IRequestUser) => {
  if (requester.userId !== userId) {
    throw new AppError("You can only update your own notification settings", status.FORBIDDEN);
  }

  const existing = await ensureSettingForUser(userId);

  return prisma.customerNotificationSetting.update({
    where: { userId: existing.userId },
    data: {
      newProductsArrive: false,
      latestOffersAdd: false,
      orderPurchasedSuccessfully: false,
    },
  });
};

const enableAllMyNotifications = async (userId: string, requester: IRequestUser) => {
  if (requester.userId !== userId) {
    throw new AppError("You can only update your own notification settings", status.FORBIDDEN);
  }

  const existing = await ensureSettingForUser(userId);

  return prisma.customerNotificationSetting.update({
    where: { userId: existing.userId },
    data: {
      newProductsArrive: true,
      latestOffersAdd: true,
      orderPurchasedSuccessfully: true,
    },
  });
};

export const CustomerNotificationService = {
  getMyNotificationSetting,
  updateMyNotificationSetting,
  disableAllMyNotifications,
  enableAllMyNotifications,
};
