import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { createLatestOfferZodSchema, updateLatestOfferZodSchema } from "./latestOffer.validation.js";
import * as latestOfferController from "./latestOffer.controller.js";

const router = Router();

router.post("/", validateZodSchema(createLatestOfferZodSchema), latestOfferController.createLatestOffer);
router.get("/active", latestOfferController.getLatestOffer);
router.get("/:id", latestOfferController.getLatestOfferById);
router.patch("/:id", validateZodSchema(updateLatestOfferZodSchema), latestOfferController.updateLatestOffer);

export const LatestOfferRoute = router;
