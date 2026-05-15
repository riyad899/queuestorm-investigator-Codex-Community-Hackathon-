import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync.js';
import * as logoService from './logo.service.js';
import { sendResponse } from '../../shared/sendResponse.js';

export const createLogo = catchAsync(async (req: Request, res: Response) => {
  const logo = await logoService.createLogo(req.body);
  sendResponse(res, { httpStatus: status.CREATED, success: true, message: 'Logo created', data: logo });
});

export const updateLogo = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const updated = await logoService.updateLogo(id, req.body);
  sendResponse(res, { httpStatus: status.OK, success: true, message: 'Logo updated', data: updated });
});

export const getLatestLogo = catchAsync(async (_req: Request, res: Response) => {
  const logo = await logoService.getLatestLogo();
  sendResponse(res, { httpStatus: status.OK, success: true, message: 'Latest logo fetched', data: logo ?? null });
});

export const getAllLogos = catchAsync(async (_req: Request, res: Response) => {
  const logos = await logoService.getAllLogos();
  sendResponse(res, { httpStatus: status.OK, success: true, message: 'Logo list fetched', data: logos });
});

export const getLogoById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const logo = await logoService.getLogoById(id);
  sendResponse(res, { httpStatus: status.OK, success: true, message: 'Logo fetched', data: logo ?? null });
});

export const deleteLogo = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deletedLogo = await logoService.deleteLogo(id);
  sendResponse(res, { httpStatus: status.OK, success: true, message: 'Logo deleted', data: deletedLogo });
});
