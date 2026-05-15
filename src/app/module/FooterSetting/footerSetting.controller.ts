import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as footerSettingService from "./footerSetting.service.js";

export const getFooterSetting = catchAsync(async (_req: Request, res: Response) => {
  const result = await footerSettingService.getLatestFooterSetting();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Footer setting fetched successfully",
    data: result ?? null,
  });
});

export const upsertFooterSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await footerSettingService.upsertFooterSetting(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Footer setting saved successfully",
    data: result,
  });
});
