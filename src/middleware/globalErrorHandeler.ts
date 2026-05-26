import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { env } from "node:process";
import z from "zod";
import { IError, IErrorResponse } from "../app/interfaces/globalError.interface.js";
import { handleZodErrors } from "../app/errorHelpers/handleZodErrors.js";
import AppError from "../app/errorHelpers/appError.js";

const isDatabaseFailure = (err: any) => {
  const message = typeof err?.message === "string" ? err.message : "";
  const code = typeof err?.code === "string" ? err.code : "";

  return (
    code.startsWith("P1") ||
    /can't reach database server|unable to start a transaction|transaction api error|prisma/i.test(message)
  );
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const databaseError = isDatabaseFailure(err);

  if (databaseError) {
    console.error("[db][error] request failed", {
      method: req.method,
      url: req.originalUrl,
      code: err?.code,
      message: err?.message,
      meta: err?.meta,
      cause: err?.cause,
      stack: err?.stack,
    });
  }

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
        path: databaseError ? "database" : "app",
        message: err.message || "Error",
      },
    ];
  } else if (err instanceof Error) {
    statusCode = databaseError ? status.SERVICE_UNAVAILABLE : status.BAD_REQUEST;
    message = err.message || "Bad Request";
    stack = err.stack;
    errorSource = [
      {
        path: databaseError ? "database" : "app",
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