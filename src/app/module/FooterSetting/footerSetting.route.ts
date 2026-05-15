import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import * as footerSettingController from "./footerSetting.controller.js";
import { upsertFooterSettingZodSchema } from "./footerSetting.validation.js";

const router = Router();

router.get("/", footerSettingController.getFooterSetting);
router.put("/", validateZodSchema(upsertFooterSettingZodSchema), footerSettingController.upsertFooterSetting);

export const FooterSettingRoute = router;
