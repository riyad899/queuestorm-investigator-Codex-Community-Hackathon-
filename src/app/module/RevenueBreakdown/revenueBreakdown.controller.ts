import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as RevenueBreakdownService from "./revenueBreakdown.service.js";

export const getRevenueSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getRevenueSummary({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    taxRate: typeof req.query.taxRate === "string" ? req.query.taxRate : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Revenue summary fetched successfully",
    data: result,
  });
});

export const getMonthlyOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getMonthlyOverview({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    taxRate: typeof req.query.taxRate === "string" ? req.query.taxRate : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Monthly overview fetched successfully",
    data: result,
  });
});

export const getPaymentMethodsBreakdown = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getPaymentMethodsBreakdown({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Payment methods breakdown fetched successfully",
    data: result,
  });
});

export const getMonthlyBreakdownTable = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getMonthlyBreakdownTable({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    taxRate: typeof req.query.taxRate === "string" ? req.query.taxRate : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Monthly breakdown table fetched successfully",
    data: result,
  });
});

export const getCategoryBreakdown = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getCategoryBreakdown({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    categoryLimit: typeof req.query.categoryLimit === "string" ? req.query.categoryLimit : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Category breakdown fetched successfully",
    data: result,
  });
});

export const getRevenueBreakdownFull = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueBreakdownService.getRevenueBreakdownFull({
    months: typeof req.query.months === "string" ? req.query.months : undefined,
    taxRate: typeof req.query.taxRate === "string" ? req.query.taxRate : undefined,
    limit: typeof req.query.limit === "string" ? req.query.limit : undefined,
    categoryLimit: typeof req.query.categoryLimit === "string" ? req.query.categoryLimit : undefined,
  });

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Revenue breakdown fetched successfully",
    data: result,
  });
});
