import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as IconsController from "./icons.controller.js";
import { createIconZodSchema } from "./icons.validation.js";

const router = Router();

router.get("/", IconsController.getAllIcons);
router.post("/", validateZodSchema(createIconZodSchema), IconsController.createIcon);

export const IconsRoute = router;
