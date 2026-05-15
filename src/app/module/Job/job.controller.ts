import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { JobService } from "./job.service.js";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.createDepartment(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Department created successfully",
    data: result,
  });
});

const getDepartments = catchAsync(async (_req: Request, res: Response) => {
  const result = await JobService.getDepartments();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Departments fetched successfully",
    data: result,
  });
});

const createJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.createJob(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Job created successfully",
    data: result,
  });
});

const getJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getJobs(req.query as any);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Jobs fetched successfully",
    data: result,
  });
});

const getJobById = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getJobById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Job fetched successfully",
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.updateJob(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Job updated successfully",
    data: result,
  });
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.deleteJob(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Job deleted successfully",
    data: result,
  });
});

const applyJob = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.createJobApplication(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Job application submitted successfully",
    data: result,
  });
});

const getApplications = catchAsync(async (_req: Request, res: Response) => {
  const result = await JobService.getApplications();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Job applications fetched successfully",
    data: result,
  });
});

export const JobController = {
  createDepartment,
  getDepartments,
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyJob,
  getApplications,
};
