import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as IconsService from "./icons.service.js";

export const createIcon = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as unknown as { icons?: unknown };

  if (body && typeof body === "object" && "icons" in body) {
    const result = await IconsService.createIconsBulk((req.body as any).icons);

    sendResponse(res, {
      httpStatus: status.CREATED,
      success: true,
      message: "Icons created successfully",
      data: result,
    });
    return;
  }

  const result = await IconsService.createIcon(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Icon created successfully",
    data: result,
  });
});

export const getAllIcons = catchAsync(async (_req: Request, res: Response) => {
  const result = await IconsService.getAllIcons();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Icons fetched successfully",
    data: result,
  });
});
