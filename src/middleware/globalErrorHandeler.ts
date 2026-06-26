import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { env } from "node:process";
import z from "zod";
import { IError, IErrorResponse } from "../app/interfaces/globalError.interface.js";
import { handleZodErrors } from "../app/errorHelpers/handleZodErrors.js";
import AppError from "../app/errorHelpers/appError.js";

export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error("[error] request failed", {
    method: req.method,
    url: req.originalUrl,
    statusCode: err?.statusCode,
    name: err?.name,
    message: err?.message,
    code: err?.code,
    stack: err?.stack,
    cause: err?.cause,
    error: err,
  });

  let errorSource: IError[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack: string | undefined;

  if (err instanceof z.ZodError) {
    const zodErrorResponse = handleZodErrors(err);
    statusCode = zodErrorResponse.statusCode || status.INTERNAL_SERVER_ERROR;
    message = zodErrorResponse.message || "Validation error";

    if (zodErrorResponse.errorSource) {
      errorSource.push(...zodErrorResponse.errorSource);
    }
  } else if (err instanceof AppError) {
    statusCode = err.statusCode || status.INTERNAL_SERVER_ERROR;
    message = err.message || "Internal Server Error";
    stack = err.stack;
    errorSource = [
      {
        path: "app",
        message: err.message || "Error",
      },
    ];
  } else if (err instanceof Error) {
    statusCode = status.BAD_REQUEST;
    message = err.message || "Bad Request";
    stack = err.stack;
    errorSource = [
      {
        path: "app",
        message: err.message || "Error",
      },
    ];
  }

  if (err?.statusCode && typeof err.statusCode === "number") {
    statusCode = err.statusCode;
  }

  if (!(err instanceof z.ZodError) && typeof err?.message === "string") {
    message = err.message;
  }

  const errorResponse: IErrorResponse = {
    success: false,
    message,
    statusCode,
    stack: env.NODE_ENV === "development" ? stack : undefined,
    errorSource: errorSource.length > 0 ? errorSource : undefined,
    error: env.NODE_ENV === "development" ? err : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
