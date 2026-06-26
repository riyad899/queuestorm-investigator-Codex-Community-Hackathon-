import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { supportTicketController } from "./supportTicket.controller.js";
import { analyzeTicketZodSchema } from "./supportTicket.validation.js";

const router = Router();

// =====================================================================
// Public hackathon endpoints
// ---------------------------------------------------------------------
// Only the two endpoints required by the spec (Section 4) are exposed.
// =====================================================================

// Liveness probe (no auth) — must respond within 60s of service start.
router.get("/health", supportTicketController.health);

// AI ticket analysis endpoint used by the judge.
router.post(
  "/analyze-ticket",
  validateZodSchema(analyzeTicketZodSchema),
  supportTicketController.analyzeTicket,
);

export const SupportTicketRoute = router;
