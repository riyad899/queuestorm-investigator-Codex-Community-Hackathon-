import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ComplaintService } from "./complaint.service.js";

export class ComplaintController {
  static createComplaint = catchAsync(async (req: Request, res: Response) => {
    const { orderInformation, complaintType, priorityLevel, complaintDetails } = req.body;
    const complaint = await ComplaintService.createComplaint({
      orderInformation,
      complaintType,
      priorityLevel,
      complaintDetails,
    });

    sendResponse(res, {
      httpStatus: 201,
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  });

  static getComplaints = catchAsync(async (_req: Request, res: Response) => {
    const complaints = await ComplaintService.getComplaints();

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Complaints retrieved successfully",
      data: complaints,
    });
  });

  static getComplaintById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const complaint = await ComplaintService.getComplaintById(id as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Complaint retrieved successfully",
      data: complaint,
    });
  });

  static updateComplaint = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const complaint = await ComplaintService.updateComplaint(id as string, req.body);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  });

  static deleteComplaint = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ComplaintService.deleteComplaint(id as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: result.message,
      data: null,
    });
  });
}
