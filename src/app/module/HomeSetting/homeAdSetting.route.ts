import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { HomeAdSettingController } from "./homeAdSetting.controller.js";
import { upsertBigAdZodSchema, upsertSideAdsZodSchema } from "./homeAdSetting.validation.js";

const router = Router();

router.get("/big-ad", HomeAdSettingController.getBigAd);
router.put("/big-ad", validateZodSchema(upsertBigAdZodSchema), HomeAdSettingController.upsertBigAd);

router.get("/side-ads", HomeAdSettingController.getSideAds);
router.put("/side-ads", validateZodSchema(upsertSideAdsZodSchema), HomeAdSettingController.upsertSideAds);

export const HomeAdSettingRoute = router;
