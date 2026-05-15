import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { BrandService } from "./brand.service.js";

const createBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.createBrand(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Brand created successfully",
    data: result,
  });
});

const assignCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.assignCategory(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Brand assigned to category successfully",
    data: result,
  });
});

const getBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.getBrands(req.query as any);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Brands fetched successfully",
    data: result,
  });
});

const getBrandBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BrandService.getBrandBySlug(String(req.params.slug));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Brand fetched successfully",
    data: result,
  });
});

export const BrandController = {
  createBrand,
  assignCategory,
  getBrands,
  getBrandBySlug,
};
