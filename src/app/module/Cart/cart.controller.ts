import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { CartService } from "./cart.service.js";

const getCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await CartService.getCart(userId);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Cart fetched successfully",
    data: result,
  });
});

const addItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await CartService.addItem(userId, req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Cart item added successfully",
    data: result,
  });
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await CartService.updateItem(userId, String(req.params.productId), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Cart item updated successfully",
    data: result,
  });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;
  const result = await CartService.removeItem(userId, String(req.params.productId));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Cart item removed successfully",
    data: result,
  });
});

export const CartController = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};
