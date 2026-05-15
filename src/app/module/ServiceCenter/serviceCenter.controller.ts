import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as serviceCenterService from "./serviceCenter.service.js";

export const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceCenterService.createService(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Service created successfully",
    data: result,
  });
});

export const getServices = catchAsync(async (_req: Request, res: Response) => {
  const result = await serviceCenterService.getServices();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Services fetched successfully",
    data: result,
  });
});

export const createServiceCenter = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceCenterService.createServiceCenter(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Service center created successfully",
    data: result,
  });
});

export const getServiceCenters = catchAsync(async (req: Request, res: Response) => {
  const result = await serviceCenterService.getServiceCenters(req.query as any);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Service centers fetched successfully",
    data: result,
  });
});
