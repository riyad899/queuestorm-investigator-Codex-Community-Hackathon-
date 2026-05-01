import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import { StaffService } from "./staff.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import status from "http-status";
import AppError from "../../errorHelpers/appError.js";

const createStaff = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await StaffService.createStaff(payload);
  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Staff created successfully",
    data: result,
  });
});

const getAllStaff = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.getAllStaff();
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Staff retrieved successfully",
    data: result,
  });
});

const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError("Invalid staff id", status.BAD_REQUEST);
  }
  const result = await StaffService.getStaffById(id);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Staff retrieved successfully",
    data: result,
  });
});

const deleteStaff = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError("Invalid staff id", status.BAD_REQUEST);
  }
  const result = await StaffService.deleteStaff(id);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Staff deleted successfully",
    data: result,
  });
});

const updateStaff = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError("Invalid staff id", status.BAD_REQUEST);
  }
  const payload = req.body;
  const result = await StaffService.updateStaff(id, payload);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Staff updated successfully",
    data: result,
  });
});

export const StaffController = {
  createStaff, getAllStaff, deleteStaff, updateStaff, getStaffById,
};
