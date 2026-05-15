import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as DashboardOverviewService from "./dashboardOverview.service.js";

export const getOverviewCards = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardOverviewService.getOverviewCards();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Overview cards fetched successfully",
    data: result,
  });
});

export const getMonthlyRevenue = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardOverviewService.getMonthlyRevenue(
    typeof req.query.months === "string" ? req.query.months : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Monthly revenue fetched successfully",
    data: result,
  });
});

export const getOrdersByStatus = catchAsync(async (_req: Request, res: Response) => {
  const result = await DashboardOverviewService.getOrdersByStatus();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Orders by status fetched successfully",
    data: result,
  });
});

export const getRecentOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardOverviewService.getRecentOrders(
    typeof req.query.limit === "string" ? req.query.limit : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Recent orders fetched successfully",
    data: result,
  });
});

export const getSalesByCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardOverviewService.getSalesByCategory(
    typeof req.query.limit === "string" ? req.query.limit : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Sales by category fetched successfully",
    data: result,
  });
});

export const getLowStockAlerts = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardOverviewService.getLowStockAlerts(
    typeof req.query.threshold === "string" ? req.query.threshold : undefined,
    typeof req.query.limit === "string" ? req.query.limit : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Low stock alerts fetched successfully",
    data: result,
  });
});

export const getFullOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardOverviewService.getFullOverview({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    recentLimit: typeof req.query.recentLimit === "string" ? req.query.recentLimit : undefined,
    categoryLimit: typeof req.query.categoryLimit === "string" ? req.query.categoryLimit : undefined,
    lowStockLimit: typeof req.query.lowStockLimit === "string" ? req.query.lowStockLimit : undefined,
    threshold: typeof req.query.threshold === "string" ? req.query.threshold : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Full overview fetched successfully",
    data: result,
  });
});
