import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { HomeAdSettingService } from "./homeAdSetting.service.js";

const upsertBigAd = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeAdSettingService.upsertBigAd(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Big ad image saved successfully",
    data: result,
  });
});

const upsertSideAds = catchAsync(async (req: Request, res: Response) => {
  const result = await HomeAdSettingService.upsertSideAds(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Side ad images saved successfully",
    data: result,
  });
});

const getBigAd = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeAdSettingService.getBigAd();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Big ad image fetched successfully",
    data: result,
  });
});

const getSideAds = catchAsync(async (_req: Request, res: Response) => {
  const result = await HomeAdSettingService.getSideAds();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Side ad images fetched successfully",
    data: result,
  });
});

export const HomeAdSettingController = {
  upsertBigAd,
  upsertSideAds,
  getBigAd,
  getSideAds,
};
