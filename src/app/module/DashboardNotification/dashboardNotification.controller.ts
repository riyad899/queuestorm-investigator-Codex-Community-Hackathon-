import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { DashboardNotificationService } from "./dashboardNotification.service.js";

const getNotificationSetting = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardNotificationService.getNotificationSetting();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Dashboard notification settings fetched successfully",
    data: result,
  });
});

const updateNotificationSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardNotificationService.updateNotificationSetting(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Dashboard notification settings updated successfully",
    data: result,
  });
});

const disableAllNotifications = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardNotificationService.disableAllNotifications();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "All dashboard notifications disabled successfully",
    data: result,
  });
});

const enableAllNotifications = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardNotificationService.enableAllNotifications();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "All dashboard notifications enabled successfully",
    data: result,
  });
});

export const DashboardNotificationController = {
  getNotificationSetting,
  updateNotificationSetting,
  disableAllNotifications,
  enableAllNotifications,
};
