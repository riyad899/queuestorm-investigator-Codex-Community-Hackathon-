import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as IconsController from "./icons.controller.js";
import { createIconZodSchema, updateIconZodSchema, replaceIconZodSchema } from "./icons.validation.js";

const router = Router();

router.get("/", IconsController.getAllIcons);
router.get("/:id", IconsController.getIconById);
router.delete("/:id", IconsController.deleteIconById);
router.patch("/:id", validateZodSchema(updateIconZodSchema), IconsController.updateIconById);
router.put("/:id", validateZodSchema(replaceIconZodSchema), IconsController.replaceIconById);
router.post("/", validateZodSchema(createIconZodSchema), IconsController.createIcon);

export const IconsRoute = router;
