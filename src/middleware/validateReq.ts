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
    // Express 5 made req.query and req.params read-only (they are getter-only).
    // We mutate the existing objects in place rather than reassigning them.
    if (data?.body !== undefined || data?.params !== undefined || data?.query !== undefined) {
      if (data.body !== undefined) req.body = data.body;
      if (data.params !== undefined) {
        // Replace keys on the existing params object
        for (const key of Object.keys(req.params)) delete req.params[key];
        Object.assign(req.params as any, data.params);
      }
      if (data.query !== undefined) {
        for (const key of Object.keys(req.query)) delete (req.query as any)[key];
        Object.assign(req.query as any, data.query);
      }
    } else {
      req.body = data;
    }

    next();

  }

}