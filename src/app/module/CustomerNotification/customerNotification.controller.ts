import { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errorHelpers/appError.js";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { CustomerNotificationService } from "./customerNotification.service.js";

const getMyNotificationSetting = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await CustomerNotificationService.getMyNotificationSetting(user.userId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer notification settings fetched successfully",
    data: result,
  });
});

const updateMyNotificationSetting = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await CustomerNotificationService.updateMyNotificationSetting(user.userId, req.body, user);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer notification settings updated successfully",
    data: result,
  });
});

const disableAllMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await CustomerNotificationService.disableAllMyNotifications(user.userId, user);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "All customer notifications disabled successfully",
    data: result,
  });
});

const enableAllMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError("Unauthorized access! User not found in request.", status.UNAUTHORIZED);
  }

  const result = await CustomerNotificationService.enableAllMyNotifications(user.userId, user);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "All customer notifications enabled successfully",
    data: result,
  });
});

export const CustomerNotificationController = {
  getMyNotificationSetting,
  updateMyNotificationSetting,
  disableAllMyNotifications,
  enableAllMyNotifications,
};
