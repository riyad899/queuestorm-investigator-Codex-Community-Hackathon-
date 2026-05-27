import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { ComplaintController } from "./complaint.controller.js";
import { createComplaintSchema, updateComplaintSchema } from "./complaint.validation.js";

const router = Router();

router.post("/complaint", validateZodSchema(createComplaintSchema), ComplaintController.createComplaint);
router.get("/complaint", ComplaintController.getComplaints);
router.get("/complaint/:id", ComplaintController.getComplaintById);
router.patch("/complaint/:id", validateZodSchema(updateComplaintSchema), ComplaintController.updateComplaint);
router.delete("/complaint/:id", ComplaintController.deleteComplaint);

export const ComplaintRoute = router;
