import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as paymentSettingService from "./paymentSetting.service.js";

export const getPaymentSetting = catchAsync(async (_req: Request, res: Response) => {
  const result = await paymentSettingService.getLatestPaymentSetting();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Payment setting fetched successfully",
    data: result ?? null,
  });
});

export const upsertPaymentSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentSettingService.upsertPaymentSetting(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Payment setting saved successfully",
    data: result,
  });
});
