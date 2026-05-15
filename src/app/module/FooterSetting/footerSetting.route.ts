import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as footerSettingController from "./footerSetting.controller.js";
import { upsertFooterSettingZodSchema } from "./footerSetting.validation.js";

const router = Router();

router.get("/", footerSettingController.getFooterSetting);
router.get("/:id", footerSettingController.getFooterSettingById);
router.put("/", validateZodSchema(upsertFooterSettingZodSchema), footerSettingController.upsertFooterSetting);
router.post("/", validateZodSchema(upsertFooterSettingZodSchema), footerSettingController.createFooterSetting);
router.delete("/:id", footerSettingController.deleteFooterSetting);

export const FooterSettingRoute = router;
