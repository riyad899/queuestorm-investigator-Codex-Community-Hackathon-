import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AdminService } from "./admin.service.js";

const getAllAdmins = catchAsync(
    async (req: Request, res: Response) => {
        const result = await AdminService.getAllAdmins();

        sendResponse(res, {
            httpStatus: status.OK,
            success: true,
            message: "Admins fetched successfully",
            data: result,
        })
    }
)

const getAdminById = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;

        const admin = await AdminService.getAdminById(id as string);

        sendResponse(res, {
            httpStatus: status.OK,
            success: true,
            message: "Admin fetched successfully",
            data: admin,
        })
    }
)

const updateAdmin = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = req.body;

        const updatedAdmin = await AdminService.updateAdmin(id as string, payload);

        sendResponse(res, {
            httpStatus: status.OK,
            success: true,
            message: "Admin updated successfully",
            data: updatedAdmin,
        })
    }
)

const deleteAdmin = catchAsync(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = req.user;

        const result = await AdminService.deleteAdmin(id as string, user);

        sendResponse(res, {
            httpStatus: status.OK,
            success: true,
            message: "Admin deleted successfully",
            data: result,
        })
    }

)

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = req.user;

    const updated = await AdminService.changeUserRole(id as string, { role }, user);

    sendResponse(res, {
        httpStatus: status.OK,
        success: true,
        message: "User role updated successfully",
        data: updated,
    });
});

export const AdminController = {
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getAdminById,
    changeUserRole,
};