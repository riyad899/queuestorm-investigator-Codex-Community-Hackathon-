import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { JobController } from "./job.controller.js";
import {
  createDepartmentZodSchema,
  createJobApplicationZodSchema,
  createJobZodSchema,
  updateJobZodSchema,
} from "./job.validation.js";

const router = Router();

router.post("/department", validateZodSchema(createDepartmentZodSchema), JobController.createDepartment);
router.get("/department", JobController.getDepartments);

router.post("/job", validateZodSchema(createJobZodSchema), JobController.createJob);
router.get("/job", JobController.getJobs);
router.get("/job/applications", JobController.getApplications);
router.post("/job/apply", validateZodSchema(createJobApplicationZodSchema), JobController.applyJob);
router.get("/job/:id", JobController.getJobById);
router.patch("/job/:id", validateZodSchema(updateJobZodSchema), JobController.updateJob);
router.delete("/job/:id", JobController.deleteJob);

export const JobRoute = router;
