import { Request, Response } from "express";
import { ContactService } from "./contact.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import catchAsync from "../../shared/catchAsync.js";

export class ContactController {
  static createMessage = catchAsync(async (req: Request, res: Response) => {
    const { fullName, phone, email, subject, message } = req.body;

    const msg = await ContactService.createMessage({ fullName, phone, email, subject, message });

    sendResponse(res, {
      httpStatus: 201,
      success: true,
      message: "Message created successfully",
      data: msg,
    });
  });

  static getMessages = catchAsync(async (req: Request, res: Response) => {
    const list = await ContactService.getMessages();

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Messages retrieved successfully",
      data: list,
    });
  });

  static getMessageById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await ContactService.getMessageById(id as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: "Message retrieved successfully",
      data: item,
    });
  });

  static deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await ContactService.deleteMessage(id as string);

    sendResponse(res, {
      httpStatus: 200,
      success: true,
      message: result.message,
      data: null,
    });
  });
}
