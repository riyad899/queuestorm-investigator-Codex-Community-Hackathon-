import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { PCBuildService } from "./pcBuild.service.js";

const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const result = await PCBuildService.getCategories();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "PC build categories fetched successfully",
    data: result,
  });
});

const getCategoryComponents = catchAsync(async (req: Request, res: Response) => {
  const result = await PCBuildService.getCategoryComponents(String(req.params.identifier));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "PC build components fetched successfully",
    data: result,
  });
});

const getCategoryProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await PCBuildService.getCategoryProducts(
    String(req.params.identifier),
    req.query as Record<string, string | string[] | undefined>,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "PC build category products fetched successfully",
    data: result,
  });
});

const getSubCategoryProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await PCBuildService.getSubCategoryProducts(
    String(req.params.subCategoryId),
    req.query as Record<string, string | string[] | undefined>,
  );

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "PC build subcategory products fetched successfully",
    data: result,
  });
});

export const PCBuildController = {
  getCategories,
  getCategoryComponents,
  getCategoryProducts,
  getSubCategoryProducts,
};