import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateZodSchema = (zodSchema: z.ZodSchema)=>{
  return (req: Request, res: Response, next: NextFunction) => {
    const payloadToValidate = {
      params: req.params ?? {},
      body: req.body ?? {},
      query: req.query ?? {},
    };

    const parseAttempts = [
      zodSchema.safeParse(payloadToValidate),
      zodSchema.safeParse(req.body ?? {}),
      zodSchema.safeParse(req.params ?? {}),
      zodSchema.safeParse(req.query ?? {}),
    ];

    const validationResult = parseAttempts.find((attempt) => attempt.success) ?? parseAttempts[0];

    if (!validationResult.success) {
      next(validationResult.error);
      return;
    }

    const data = validationResult.data as any;
    if (data?.body !== undefined || data?.params !== undefined || data?.query !== undefined) {
      if (data.body !== undefined) req.body = data.body;
      if (data.params !== undefined) req.params = data.params;
      if (data.query !== undefined) req.query = data.query;
    } else {
      req.body = data;
    }

    next();

  }

}