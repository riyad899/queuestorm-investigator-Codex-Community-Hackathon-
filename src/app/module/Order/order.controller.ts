import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as orderService from "./order.service.js";

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const result = await orderService.createOrder(req.body, userId);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

export const getOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getOrders(req.query as any);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Orders fetched successfully",
    data: result,
  });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.getOrderById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Order fetched successfully",
    data: result,
  });
});

export const updateOrderPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.updateOrderPayment(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Order payment updated successfully",
    data: result,
  });
});

export const updateOrderDelivery = catchAsync(async (req: Request, res: Response) => {
  const result = await orderService.updateOrderDelivery(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Order delivery updated successfully",
    data: result,
  });
});
