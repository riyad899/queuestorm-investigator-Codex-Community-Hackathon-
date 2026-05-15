import { Request, Response } from "express";
import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import * as latestOfferService from "./latestOffer.service.js";

export const createLatestOffer = catchAsync(async (req: Request, res: Response) => {
  const result = await latestOfferService.createLatestOffer(req.body);

  sendResponse(res, {
    httpStatus: status.CREATED,
    success: true,
    message: "Latest offer created successfully",
    data: result,
  });
});

export const updateLatestOffer = catchAsync(async (req: Request, res: Response) => {
  const result = await latestOfferService.updateLatestOffer(String(req.params.id), req.body);

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Latest offer updated successfully",
    data: result,
  });
});

export const getLatestOffer = catchAsync(async (_req: Request, res: Response) => {
  const result = await latestOfferService.getActiveLatestOffer();

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Latest offer fetched successfully",
    data: result,
  });
});

export const getLatestOfferById = catchAsync(async (req: Request, res: Response) => {
  const result = await latestOfferService.getLatestOfferById(String(req.params.id));

  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Latest offer fetched successfully",
    data: result,
  });
});
