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

export const getFooterSettingById = catchAsync(async (req: Request, res: Response) => {
  const result = await footerSettingService.getFooterSettingById(req.params.id as string);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Footer setting fetched successfully",
    data: result,
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

export const createFooterSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await footerSettingService.createFooterSetting(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Footer setting created successfully",
    data: result,
  });
});

export const deleteFooterSetting = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await footerSettingService.deleteFooterSetting(id as string);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Footer setting deleted successfully",
    data: result,
  });
});
