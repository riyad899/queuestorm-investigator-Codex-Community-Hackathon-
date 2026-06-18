import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as couponService from "./coupon.service.js";

export const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.createCoupon(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Coupon created successfully",
    data: result,
  });
});

export const getCoupons = catchAsync(async (_req: Request, res: Response) => {
  const result = await couponService.getCoupons();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Coupons fetched successfully",
    data: result,
  });
});

export const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.getCouponById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Coupon fetched successfully",
    data: result,
  });
});

export const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.updateCoupon(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Coupon updated successfully",
    data: result,
  });
});

export const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.deleteCoupon(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Coupon deleted successfully",
    data: result,
  });
});

export const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await couponService.validateCoupon(req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Coupon validated successfully",
    data: result,
  });
});
