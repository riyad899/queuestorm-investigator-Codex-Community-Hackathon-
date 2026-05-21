import { Router } from "express";
import { PCBuildController } from "./pcBuild.controller.js";

const router = Router();

router.get("/pc-build/categories", PCBuildController.getCategories);
router.get("/pc-build/categories/:identifier/components", PCBuildController.getCategoryComponents);
router.get("/pc-build/categories/:identifier/products", PCBuildController.getCategoryProducts);
router.get("/pc-build/components/:subCategoryId/products", PCBuildController.getSubCategoryProducts);

export const PCBuildRoute = router;