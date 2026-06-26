import { Router } from "express";
import { SupportTicketRoute } from "../module/SupportTicket/supportTicket.route.js";

const router = Router();

// =====================================================================
// Hackathon judge endpoints (Section 4 of the spec).
// Only the two endpoints required by the problem statement are exposed
// at the API root: GET /health and POST /analyze-ticket.
// =====================================================================
router.use("/", SupportTicketRoute);

export const IndexRoute = router;
