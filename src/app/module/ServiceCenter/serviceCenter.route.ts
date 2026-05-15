import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as serviceCenterController from "./serviceCenter.controller.js";
import { createServiceCenterZodSchema, createServiceZodSchema } from "./serviceCenter.validation.js";

const router = Router();

router.post("/service", validateZodSchema(createServiceZodSchema), serviceCenterController.createService);
router.get("/service", serviceCenterController.getServices);

router.post("/service-center", validateZodSchema(createServiceCenterZodSchema), serviceCenterController.createServiceCenter);
router.get("/service-center", serviceCenterController.getServiceCenters);

export const ServiceCenterRoute = router;
