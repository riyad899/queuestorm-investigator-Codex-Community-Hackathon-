import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { SuperAdminService } from "./superAdmin.service.js";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.createAdmin(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.getAllAdmins();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Admins fetched successfully",
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.getAdminById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: result,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.updateAdmin(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await SuperAdminService.deleteAdmin(String(req.params.id), req.user!);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

export const SuperAdminController = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
