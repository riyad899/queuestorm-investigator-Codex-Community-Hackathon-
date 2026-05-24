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

export const getIconById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await IconsService.getIconById(id);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Icon fetched successfully",
    data: result,
  });
});

export const deleteIconById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await IconsService.deleteIconById(id);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Icon deleted successfully",
    data: result,
  });
});

export const updateIconById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as { name?: string; svg?: string };
  const result = await IconsService.updateIconById(id, payload);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Icon updated successfully",
    data: result,
  });
});

export const replaceIconById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const payload = req.body as { name: string; svg: string };
  const result = await IconsService.replaceIconById(id, payload);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Icon replaced successfully",
    data: result,
  });
});
