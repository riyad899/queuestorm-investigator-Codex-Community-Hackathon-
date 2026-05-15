import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { InventoryAlertService } from "./inventoryAlert.service.js";

const getLowStockAlerts = catchAsync(async (req: Request, res: Response) => {
  const threshold = typeof req.query.threshold === "string" ? Number(req.query.threshold) : undefined;

  const result = await InventoryAlertService.getLowStockAlerts(
    Number.isFinite(threshold as number) ? (threshold as number) : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Low stock alerts fetched successfully",
    data: result,
  });
});

export const InventoryAlertController = {
  getLowStockAlerts,
};
