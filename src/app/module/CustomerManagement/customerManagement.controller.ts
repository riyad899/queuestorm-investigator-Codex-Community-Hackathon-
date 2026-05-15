import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as customerManagementService from "./customerManagement.service.js";

export const getCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await customerManagementService.getCustomers(req.query as any);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customers fetched successfully",
    data: result,
  });
});

export const getLatestCustomers = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await customerManagementService.getLatestCustomers(
    Number.isFinite(limit as number) ? (limit as number) : undefined,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Latest customers fetched successfully",
    data: result,
  });
});

export const getCustomerById = catchAsync(async (req: Request, res: Response) => {
  const result = await customerManagementService.getCustomerById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer fetched successfully",
    data: result,
  });
});

export const updateCustomerStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await customerManagementService.updateCustomerStatus(
    String(req.params.id),
    req.body,
    req.user!,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer status updated successfully",
    data: result,
  });
});

export const updateCustomerRole = catchAsync(async (req: Request, res: Response) => {
  const result = await customerManagementService.updateCustomerRole(
    String(req.params.id),
    req.body,
    req.user!,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Customer role updated successfully",
    data: result,
  });
});
