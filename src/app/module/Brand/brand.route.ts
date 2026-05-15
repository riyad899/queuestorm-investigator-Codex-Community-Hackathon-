import { Router } from "express";
import { validateZodSchema } from "../../../middleware/validateReq.js";
import { BrandController } from "./brand.controller.js";
import { assignBrandCategoryZodSchema, createBrandZodSchema } from "./brand.validation.js";

const router = Router();

router.post("/assign-category", validateZodSchema(assignBrandCategoryZodSchema), BrandController.assignCategory);
router.post("/", validateZodSchema(createBrandZodSchema), BrandController.createBrand);
router.get("/", BrandController.getBrands);
router.get("/:slug", BrandController.getBrandBySlug);

export const BrandRoute = router;
