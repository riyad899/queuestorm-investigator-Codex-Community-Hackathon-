import status from "http-status";
import catchAsync from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { analyzeTicketService } from "./supportTicket.analyze.service.js";
import type { AnalyzeTicketInput } from "./supportTicket.validation.js";

// =====================================================================
// POST /analyze-ticket
// ---------------------------------------------------------------------
// Public-ish endpoint used by the hackathon judge.
// Body has already been validated by Zod (analyzeTicketZodSchema).
// The service runs the LLM, validates the LLM output, and returns
// a schema-valid JSON response.
// =====================================================================
const analyzeTicket = catchAsync(async (req, res) => {
  const payload = req.body as AnalyzeTicketInput;
  const result = await analyzeTicketService.analyzeTicket(payload);
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Ticket analyzed successfully",
    data: result,
  });
});

// =====================================================================
// GET /health
// ---------------------------------------------------------------------
// Simple liveness probe required by the problem statement.
// Must respond with {"status":"ok"} within 60 seconds of service start.
// =====================================================================
const health = catchAsync(async (_req, res) => {
  sendResponse(res, {
    httpStatus: status.OK,
    success: true,
    message: "Service is healthy",
    data: { status: "ok" },
  });
});

export const supportTicketController = {
  analyzeTicket,
  health,
};
