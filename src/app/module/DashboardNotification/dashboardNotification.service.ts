import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import { prisma } from "../../lib/prisma.js";
import { IDashboardNotificationSettingPayload } from "./dashboardNotification.interface.js";

const getLatestNotificationSetting = async () => {
  return prisma.dashboardNotificationSetting.findFirst({
    orderBy: { createdAt: "desc" },
  });
};

const ensureSetting = async () => {
  const existing = await getLatestNotificationSetting();

  if (existing) {
    return existing;
  }

  return prisma.dashboardNotificationSetting.create({
    data: {},
  });
};

const getNotificationSetting = async () => {
  return ensureSetting();
};

const updateNotificationSetting = async (payload: IDashboardNotificationSettingPayload) => {
  const existing = await ensureSetting();

  return prisma.dashboardNotificationSetting.update({
    where: { id: existing.id },
    data: {
      ...(payload.orderUpdates !== undefined ? { orderUpdates: payload.orderUpdates } : {}),
      ...(payload.lowStockAlerts !== undefined ? { lowStockAlerts: payload.lowStockAlerts } : {}),
      ...(payload.newUserRegistrations !== undefined ? { newUserRegistrations: payload.newUserRegistrations } : {}),
      ...(payload.revenueReports !== undefined ? { revenueReports: payload.revenueReports } : {}),
      ...(payload.promotionsOffers !== undefined ? { promotionsOffers: payload.promotionsOffers } : {}),
    },
  });
};

const disableAllNotifications = async () => {
  const existing = await ensureSetting();

  return prisma.dashboardNotificationSetting.update({
    where: { id: existing.id },
    data: {
      orderUpdates: false,
      lowStockAlerts: false,
      newUserRegistrations: false,
      revenueReports: false,
      promotionsOffers: false,
    },
  });
};

const enableAllNotifications = async () => {
  const existing = await ensureSetting();

  return prisma.dashboardNotificationSetting.update({
    where: { id: existing.id },
    data: {
      orderUpdates: true,
      lowStockAlerts: true,
      newUserRegistrations: true,
      revenueReports: true,
      promotionsOffers: true,
    },
  });
};

export const DashboardNotificationService = {
  getNotificationSetting,
  updateNotificationSetting,
  disableAllNotifications,
  enableAllNotifications,
};
